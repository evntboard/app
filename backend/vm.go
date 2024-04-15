package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/dop251/goja"
	"github.com/pocketbase/pocketbase/models"
	"log"
	"time"
)

type VMContext struct {
	app           *application
	vm            *goja.Runtime
	processRecord *models.Record
	eventRecord   *models.Record
	trigger       *TriggerCondition
}

func NewVMContext(
	app *application,
	processRecord *models.Record,
	eventRecord *models.Record,
	trigger *TriggerCondition,
) *VMContext {
	vmContext := &VMContext{
		app:           app,
		vm:            goja.New(),
		processRecord: processRecord,
		eventRecord:   eventRecord,
		trigger:       trigger,
	}

	var payloadRaw any
	if err := json.Unmarshal([]byte(eventRecord.GetString("payload")), &payloadRaw); err != nil {
		fmt.Println("Error:", err)
	}
	eventObj := vmContext.vm.NewObject()
	_ = eventObj.Set("id", eventRecord.Id)
	_ = eventObj.Set("name", eventRecord.GetString("name"))
	_ = eventObj.Set("payload", payloadRaw)
	_ = eventObj.Set("emitted_at", eventRecord.GetDateTime("emitted_at"))
	_ = eventObj.Set("emitter_code", eventRecord.GetString("emitter_code"))
	_ = eventObj.Set("emitter_name", eventRecord.GetString("emitter_name"))
	_ = vmContext.vm.Set("event", eventObj)

	return vmContext
}

func (vmContext *VMContext) vmSleep(ms int) {
	time.Sleep(time.Duration(ms) * time.Millisecond)
}

func (vmContext *VMContext) vmLog(data ...any) {
	if len(data) == 0 {
		return
	}

	go func() {
		var jsonData []byte

		if len(data) == 1 {
			rawJSON, err := json.MarshalIndent(data[0], "", "  ")

			if err != nil {
				fmt.Println("Error encoding to JSON:", err)
				return
			}

			jsonData = rawJSON
		} else {
			rawJSON, err := json.MarshalIndent(data, "", "  ")

			if err != nil {
				fmt.Println("Error encoding to JSON:", err)
				return
			}

			jsonData = rawJSON
		}

		_, err := vmContext.app.CreateProcessLog(vmContext.processRecord.Id, jsonData)
		if err != nil {
			return
		}

	}()
}

func (vmContext *VMContext) vmModuleNameRequestCall(moduleName string, moduleMethod string, params any) any {
	paramsJSON, err := json.Marshal(params)
	if err != nil {
		log.Println("Erreur de codage JSON de la requête:", err)
	}

	moduleRecord, err := vmContext.app.GetModuleByOrganizationIdAndNameOrCode(vmContext.trigger.OrganizationID, moduleName)
	if err != nil {
		panic(vmContext.vm.NewGoError(fmt.Errorf("there is no %s connected", moduleName)))
	}

	moduleRpc, err := vmContext.app.GetConnFromModuleSession(moduleRecord.GetString("session"))

	if moduleRpc == nil {
		panic(vmContext.vm.NewGoError(fmt.Errorf("there is no %s connected", moduleName)))
	}

	processRequestRecord, err := vmContext.app.CreateProcessRequest(
		vmContext.processRecord.Id,
		moduleRecord.Id,
		moduleMethod,
		paramsJSON,
		false,
	)
	if err != nil {
		fmt.Printf("Error create process request module request :%s\n", err.Error())
		return err
	}

	var callResult any
	callError := moduleRpc.Call(context.Background(), moduleMethod, params, &callResult)

	if callError != nil {
		msg, err := json.Marshal(callError)
		if err != nil {
			log.Println("Erreur de codage JSON de la requête:", err)
		}

		processRequestRecord, err = vmContext.app.UpdateErrorProcessRequest(processRequestRecord, msg)

		if err != nil {
			fmt.Printf("Error module request %s\n", err.Error())
		}
	} else {
		msg, err := json.Marshal(callResult)
		if err != nil {
			log.Println("Erreur de codage JSON de la requête:", err)
		}

		processRequestRecord, err = vmContext.app.UpdateSuccessProcessRequest(processRequestRecord, msg)

		if err != nil {
			fmt.Printf("Error module request %s\n", err.Error())
		}
	}

	return callResult
}

func (vmContext *VMContext) vmModuleNameNotifyCall(moduleName string, moduleMethod string, params any) {
	paramsJSON, err := json.Marshal(params)
	if err != nil {
		log.Println("Erreur de codage JSON de la requête:", err)
	}

	moduleRecord, err := vmContext.app.GetModuleByOrganizationIdAndNameOrCode(vmContext.trigger.OrganizationID, moduleName)
	if err != nil {
		panic(vmContext.vm.NewGoError(fmt.Errorf("there is no %s connected", moduleName)))
	}

	processRequestRecord, err := vmContext.app.CreateProcessRequest(
		vmContext.processRecord.Id,
		moduleRecord.Id,
		moduleMethod,
		paramsJSON,
		true,
	)
	if err != nil {
		fmt.Printf("Error create process request module request :%s\n", err.Error())
		return
	}

	moduleRpc, err := vmContext.app.GetConnFromModuleSession(moduleRecord.GetString("session"))

	if err != nil {
		fmt.Printf("Error get module session :%s\n", err.Error())
		return
	}

	if moduleRpc == nil {
		fmt.Printf("Error no module session...\n")
		return
	}

	callError := moduleRpc.Notify(context.Background(), moduleMethod, params)

	if callError != nil {
		msg, err := json.Marshal(callError)
		if err != nil {
			log.Println("Erreur de codage JSON de la requête:", err)
		}

		processRequestRecord, err = vmContext.app.UpdateErrorProcessRequest(processRequestRecord, msg)

		if err != nil {
			fmt.Printf("Error module request %s\n", err.Error())
		}
	} else {
		msg, err := json.Marshal(nil)
		if err != nil {
			log.Println("Erreur de codage JSON de la requête:", err)
		}

		processRequestRecord, err = vmContext.app.UpdateSuccessProcessRequest(processRequestRecord, msg)

		if err != nil {
			fmt.Printf("Error module request %s\n", err.Error())
		}
	}
}

func (vmContext *VMContext) vmStorageSet(key string, value any) any {
	if len(key) < 3 {
		panic(vmContext.vm.NewGoError(fmt.Errorf("storage get key cannot be less than 3 chars")))
	}

	record, err := vmContext.app.SetStorageByKey(vmContext.trigger.OrganizationID, key, value)

	if err != nil {
		panic(vmContext.vm.NewGoError(fmt.Errorf("storage set error ...")))
	}

	var payloadRaw any
	if err := json.Unmarshal([]byte(record.GetString("value")), &payloadRaw); err != nil {
		fmt.Println("Error:", err)
	}

	return payloadRaw
}

func (vmContext *VMContext) vmStorageGet(key string) any {
	if len(key) < 3 {
		panic(vmContext.vm.NewGoError(fmt.Errorf("storage get key cannot be less than 3 chars")))
	}

	res, err := vmContext.app.GetStorageByKey(vmContext.trigger.OrganizationID, key)

	if err != nil {
		log.Printf("[%s] %s : Warning trigger [%s] %s -> Storage %s error: %s\n", vmContext.eventRecord.Id, vmContext.eventRecord.GetString("name"), vmContext.trigger.TriggerID, vmContext.trigger.TriggerName, key, err.Error())
		return nil
	}

	var payloadRaw any
	if err := json.Unmarshal([]byte(res.GetString("value")), &payloadRaw); err != nil {
		fmt.Println("Error:", err)
	}

	return payloadRaw
}
