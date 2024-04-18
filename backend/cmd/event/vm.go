package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/dop251/goja"
	"github.com/evntboard/app/backend/internal/model"
	"log"
	"time"
)

type VMContext struct {
	app             *application
	vm              *goja.Runtime
	processRecordId string
	event           *model.EventReceived
	trigger         *model.TriggerCondition
}

func NewVMContext(
	app *application,
	processRecordId string,
	event *model.EventReceived,
	trigger *model.TriggerCondition,
) (*VMContext, error) {
	vmContext := &VMContext{
		app:             app,
		vm:              goja.New(),
		processRecordId: processRecordId,
		event:           event,
		trigger:         trigger,
	}

	var payloadRaw any
	if err := json.Unmarshal(event.Payload, &payloadRaw); err != nil {
		return nil, err
	}
	eventObj := vmContext.vm.NewObject()
	_ = eventObj.Set("id", event.Id)
	_ = eventObj.Set("name", event.Name)
	_ = eventObj.Set("payload", payloadRaw)
	_ = eventObj.Set("emitted_at", event.EmittedAt)
	_ = eventObj.Set("emitter_code", event.EmitterCode)
	_ = eventObj.Set("emitter_name", event.EmitterName)
	_ = vmContext.vm.Set("event", eventObj)

	return vmContext, nil
}

func (vmContext *VMContext) vmSleep(ms int) {
	time.Sleep(time.Duration(ms) * time.Millisecond)
}

func (vmContext *VMContext) vmLog(data ...any) {
	if len(data) == 0 {
		return
	}

	go func() {
		payload := ""
		if len(data) == 1 {
			msgJson, err := json.Marshal(data[0])
			if err != nil {
				// TODO
				return
			}
			payload = string(msgJson)
		} else {
			msgJson, err := json.Marshal(data)
			if err != nil {
				// TODO
				return
			}
			payload = string(msgJson)
		}
		_ = vmContext.app.pb.CreateProcessLog(vmContext.processRecordId, payload)
	}()
}

func (vmContext *VMContext) vmModuleNameRequestCall(moduleName string, moduleMethod string, params any) any {
	module, err := vmContext.app.pb.GetModuleWithSessionByOrganizationIdAndNameOrCode(vmContext.trigger.Expand.Trigger.OrganizationId, moduleName)
	if err != nil {
		panic(vmContext.vm.NewGoError(fmt.Errorf("there is no %s connected", moduleName)))
	}

	processRequestRecordId, err := vmContext.app.pb.CreateProcessRequest(
		vmContext.processRecordId,
		module.Id,
		moduleMethod,
		params,
		false,
	)
	if err != nil {
		panic(vmContext.vm.NewGoError(fmt.Errorf("Error create process request module request :%s\n", err.Error())))
	}

	msgJson, err := json.Marshal(map[string]any{
		"type":   "module",
		"action": "request",
		"payload": map[string]any{
			"method": moduleMethod,
			"params": params,
		},
	})
	if err != nil {
		panic(vmContext.vm.NewGoError(fmt.Errorf("error encoding json : %s", err.Error())))
	}

	callResult, callError := vmContext.app.realtime.Request(
		vmContext.app.realtime.GetChannelForModule(module.SessionId),
		msgJson,
		time.Minute*15,
	)

	if callError != nil {
		msg, err := json.Marshal(callError)
		if err != nil {
			log.Println("Erreur de codage JSON de la requête:", err)
		}

		err = vmContext.app.pb.UpdateErrorProcessRequest(processRequestRecordId, msg)

		if err != nil {
			fmt.Printf("Error module request %s\n", err.Error())
		}

		panic(vmContext.vm.NewGoError(fmt.Errorf("Error module request : %s", callError)))
	}

	// callResult can be an error :)
	var rawResult map[string]any
	if err := json.Unmarshal(callResult.Data, &rawResult); err != nil {
		fmt.Println("Error:", err)
	}

	if _, ok := rawResult["error"]; ok {
		msg, err := json.Marshal(rawResult["error"])
		if err != nil {
			log.Println("Erreur de codage JSON de la requête:", err)
		}

		err = vmContext.app.pb.UpdateErrorProcessRequest(processRequestRecordId, msg)

		if err != nil {
			fmt.Printf("Error module request %s\n", err.Error())
		}

		panic(vmContext.vm.NewGoError(fmt.Errorf("Error module request : %s", msg)))
	}

	if _, ok := rawResult["success"]; ok {
		msg, err := json.Marshal(rawResult["success"])
		if err != nil {
			log.Println("Erreur de codage JSON de la requête:", err)
		}
		err = vmContext.app.pb.UpdateSuccessProcessRequest(processRequestRecordId, msg)
		return rawResult["success"]
	}

	panic(vmContext.vm.NewGoError(fmt.Errorf("invalid result")))
}

func (vmContext *VMContext) vmModuleNameNotifyCall(moduleName string, moduleMethod string, params any) {
	module, err := vmContext.app.pb.GetModuleWithSessionByOrganizationIdAndNameOrCode(vmContext.trigger.Expand.Trigger.OrganizationId, moduleName)
	if err != nil {
		return
	}

	processRequestRecordId, err := vmContext.app.pb.CreateProcessRequest(
		vmContext.processRecordId,
		module.Id,
		moduleMethod,
		params,
		true,
	)
	if err != nil {
		return
	}

	msgJson, err := json.Marshal(map[string]any{
		"type":   "module",
		"action": "notify",
		"payload": map[string]any{
			"method": moduleMethod,
			"params": params,
		},
	})
	if err != nil {
		return
	}

	callError := vmContext.app.realtime.Publish(
		vmContext.app.realtime.GetChannelForModule(module.SessionId),
		msgJson,
	)

	if callError != nil {
		msg, err := json.Marshal(callError)
		if err != nil {
			log.Println("Erreur de codage JSON de la requête:", err)
		}

		err = vmContext.app.pb.UpdateErrorProcessRequest(processRequestRecordId, msg)

		if err != nil {
			fmt.Printf("Error module request %s\n", err.Error())
		}
	} else {
		err = vmContext.app.pb.UpdateSuccessProcessRequest(processRequestRecordId, nil)
	}
}

func (vmContext *VMContext) vmStorageSet(key string, value any) any {
	if len(key) < 3 {
		panic(vmContext.vm.NewGoError(fmt.Errorf("storage get key cannot be less than 3 chars")))
	}

	record, err := vmContext.app.pb.SetStorageByKey(vmContext.trigger.Expand.Trigger.OrganizationId, key, value)

	if err != nil {
		panic(vmContext.vm.NewGoError(fmt.Errorf("storage set error")))
	}

	return record.Value
}

func (vmContext *VMContext) vmStorageGet(key string) any {
	if len(key) < 3 {
		panic(vmContext.vm.NewGoError(fmt.Errorf("storage get key cannot be less than 3 chars")))
	}

	record, err := vmContext.app.pb.GetStorageByKey(vmContext.trigger.Expand.Trigger.OrganizationId, key)

	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}

	if err != nil {
		panic(vmContext.vm.NewGoError(fmt.Errorf("storage get key error ...")))
	}

	return record.Value
}
