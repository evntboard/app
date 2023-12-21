package service

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/dop251/goja"
	"github.com/evntboard/app/event/model"
	"github.com/evntboard/app/event/utils"
	"github.com/lucsky/cuid"
	"log"
	"strings"
	"time"
)

type VmWrapped struct {
	vm                    *goja.Runtime
	data                  *model.VmData
	natsService           *NatsService
	sharedService         *SharedService
	processService        *ProcessService
	storageService        *StorageService
	moduleSessionService  *ModuleSessionService
	processRequestService *ProcessRequestService
	processLogService     *ProcessLogService
	lockService           *LockService
}

func NewVmWrapped(
	data *model.VmData,
	natsService *NatsService,
	sharedService *SharedService,
	processService *ProcessService,
	storageService *StorageService,
	moduleSessionService *ModuleSessionService,
	processLogService *ProcessLogService,
	processRequestService *ProcessRequestService,
	lockService *LockService,
) *VmWrapped {
	vm := &VmWrapped{
		vm:   goja.New(),
		data: data,

		natsService:           natsService,
		moduleSessionService:  moduleSessionService,
		processRequestService: processRequestService,
		processLogService:     processLogService,
		sharedService:         sharedService,
		processService:        processService,
		storageService:        storageService,
		lockService:           lockService,
	}

	vm.InjectConstants()

	return vm
}

func (c *VmWrapped) InjectConstants() {
	eventObj := c.vm.NewObject()
	_ = eventObj.Set("id", c.data.Event.ID)
	_ = eventObj.Set("name", c.data.Event.Name)
	_ = eventObj.Set("payload", c.data.Event.Payload)
	_ = eventObj.Set("emitted_at", c.data.Event.EmittedAt)
	_ = eventObj.Set("emitter_code", c.data.Event.EmitterCode)
	_ = eventObj.Set("emitter_name", c.data.Event.EmitterName)
	_ = c.vm.Set("event", eventObj)
}

func (c *VmWrapped) LoadSharedScript() {
	if sharedLinked, err := c.sharedService.GetSharedsFromPathSequence(c.data.Trigger.TriggerName, c.data.Trigger.OrganizationID); err == nil {
		for _, s := range sharedLinked {
			if _, err := c.vm.RunString(s.Code); err != nil {
				fmt.Println("ERROR WHEN EXECUTE SHARED")
			}
		}
	}
}

func (c *VmWrapped) ExecuteCondition() (bool, error) {
	value, err := c.vm.RunString(c.data.Trigger.ConditionCode)
	if err != nil {
		return false, err
	}

	if vb := value.ToBoolean(); !vb {
		return false, nil
	}
	return true, nil
}

func (c *VmWrapped) LockChannel() {
	trimTriggerChannel := strings.Trim(c.data.Trigger.TriggerChannel, " \t\n")

	if trimTriggerChannel != "" {
		if err := c.lockService.Lock(context.Background(), trimTriggerChannel, 10*time.Minute); err != nil {
			fmt.Println("LOCK ERROR " + err.Error())
		}
	}
}

func (c *VmWrapped) UnlockChannel() {
	trimTriggerChannel := strings.Trim(c.data.Trigger.TriggerChannel, " \t\n")

	if trimTriggerChannel != "" {
		if err := c.lockService.Unlock(context.Background(), trimTriggerChannel); err != nil {
			fmt.Println("LOCK ERROR " + err.Error())
		}
	}
}

func (c *VmWrapped) ExecuteReaction() error {
	_, err := c.vm.RunString(c.data.Trigger.TriggerCode)
	return err
}

func (c *VmWrapped) LoadVars() {
	if err := c.vm.Set("log", c.vmLog); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register sleep\n", c.data.Event.ID, c.data.Event.Name, c.data.Trigger.TriggerID, c.data.Trigger.TriggerName)
	}

	if err := c.vm.Set("sleep", c.vmSleep); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register sleep\n", c.data.Event.ID, c.data.Event.Name, c.data.Trigger.TriggerID, c.data.Trigger.TriggerName)
	}

	// MODULE

	moduleObj := c.vm.NewObject()

	if err := moduleObj.Set("request", c.vmModuleNameRequestCall); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register tmpFile vmStorageTmpSet\n", c.data.Event.ID, c.data.Event.Name, c.data.Trigger.TriggerID, c.data.Trigger.TriggerName)
	}

	if err := moduleObj.Set("notify", c.vmModuleNameNotifyCall); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register tmpFile vmStorageTmpSet\n", c.data.Event.ID, c.data.Event.Name, c.data.Trigger.TriggerID, c.data.Trigger.TriggerName)
	}

	if err := c.vm.Set("module", moduleObj); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register moduleRequest\n", c.data.Event.ID, c.data.Event.Name, c.data.Trigger.TriggerID, c.data.Trigger.TriggerName)
	}

	// storage

	storageObj := c.vm.NewObject()

	if err := storageObj.Set("set", c.vmStorageSet); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register storage set \n", c.data.Event.ID, c.data.Event.Name, c.data.Trigger.TriggerID, c.data.Trigger.TriggerName)
	}

	if err := storageObj.Set("get", c.vmStorageGet); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register storage get\n", c.data.Event.ID, c.data.Event.Name, c.data.Trigger.TriggerID, c.data.Trigger.TriggerName)
	}

	if err := c.vm.Set("storage", storageObj); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register moduleRequest\n", c.data.Event.ID, c.data.Event.Name, c.data.Trigger.TriggerID, c.data.Trigger.TriggerName)
	}
}

func (c *VmWrapped) vmSleep(ms int) {
	time.Sleep(time.Duration(ms) * time.Millisecond)
}

func (c *VmWrapped) vmLog(data ...any) {
	if len(data) == 0 {
		return
	}

	go func() {
		eventChannel := utils.GChOrgaEvent(c.data.Trigger.OrganizationID, c.data.Event.ID)

		var jsonData []byte

		if len(data) == 1 {
			rawJson, err := json.MarshalIndent(data[0], "", "  ")

			if err != nil {
				fmt.Println("Error encoding to JSON:", err)
				return
			}

			jsonData = rawJson
		} else {
			rawJson, err := json.MarshalIndent(data, "", "  ")

			if err != nil {
				fmt.Println("Error encoding to JSON:", err)
				return
			}

			jsonData = rawJson
		}

		if err := c.processLogService.AddProcessLog(c.data.ProcessID, jsonData); err != nil {
			fmt.Println("Error log :", err)
		}

		if err := c.natsService.Nats.Publish(eventChannel, nil); err != nil {
			log.Println("Erreur d'envoi de la requête:", err)
		}
	}()
}

func (c *VmWrapped) vmStorageSet(key string, value any) any {
	if len(strings.Replace(key, "tmp:", "", 1)) < 3 {
		panic(c.vm.NewGoError(fmt.Errorf("storage set key cannot be less than 3 chars")))
	}

	res, err := c.storageService.CreateOrUpdateStorage(c.data.Trigger.OrganizationID, key, value)

	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("Storage %s error: %s", key, err.Error())))
	}

	storageChannel := utils.GChOrgaStorage(c.data.Trigger.OrganizationID)

	messageJSON, err := json.Marshal(map[string]any{"key": key, "value": value})
	if err != nil {
		log.Println("Erreur de codage JSON de la requête:", err)
	}

	if err := c.natsService.Nats.Publish(storageChannel, messageJSON); err != nil {
		log.Println("Erreur d'envoi de la requête:", err)
	}

	return res
}

func (c *VmWrapped) vmStorageGet(key string) any {
	if len(strings.Replace(key, "tmp:", "", 1)) < 3 {
		panic(c.vm.NewGoError(fmt.Errorf("storage get key cannot be less than 3 chars")))
	}

	res, err := c.storageService.GetStorage(c.data.Trigger.OrganizationID, key)

	if err != nil {
		log.Printf("[%s] %s : Warning trigger [%s] %s -> Storage %s error: %s\n", c.data.Event.ID, c.data.Event.Name, c.data.Trigger.TriggerID, c.data.Trigger.TriggerName, key, err.Error())
		return nil
	}

	return res
}

func (c *VmWrapped) vmModuleNameRequestCall(moduleName string, moduleMethod string, params any) any {
	moduleSession, err := c.moduleSessionService.GetModuleSessionIDByNameOrCode(c.data.Trigger.OrganizationID, moduleName)
	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("there is no %s connected !", moduleName)))
	}

	requestChannel := utils.GChOrgaModule(c.data.Trigger.OrganizationID, moduleSession.ModuleSessionID)

	message, err := json.Marshal(model.ModuleRequest{
		Method: moduleMethod,
		Params: params,
	})
	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("Error publishing message to channel %s: %s", requestChannel, err.Error())))
	}

	newId := cuid.New()

	go func() {
		err = c.processRequestService.CreateProcessRequest(
			newId,
			moduleMethod,
			params,
			false,
			moduleSession.ModuleID,
			c.data.ProcessID,
		)
		if err != nil {
			fmt.Printf("Error module request %s: %s\n", requestChannel, err.Error())
		}
	}()

	msg, err := c.natsService.Nats.Request(requestChannel, message, 25*time.Second)
	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("Error receiving response from channel %s: %s", requestChannel, err.Error())))
	}

	response := &model.ModuleResponse{}
	if err := json.Unmarshal(msg.Data, response); err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("Error decoding JSON response: %s", err.Error())))
	}

	if response.Error != "" {
		go func() {
			err = c.processRequestService.UpdateError(
				response.Error,
				newId,
			)
			if err != nil {
				fmt.Printf("Error module request %s: %s\n", requestChannel, err.Error())
			}
		}()

		panic(c.vm.NewGoError(fmt.Errorf("Module %s method: %s error: %s", moduleName, moduleMethod, response.Error)))
	}

	go func() {
		err = c.processRequestService.UpdateResult(
			response.Result,
			newId,
		)
		if err != nil {
			fmt.Printf("Error module request %s: %s\n", requestChannel, err.Error())
		}
	}()

	return response.Result
}

func (c *VmWrapped) vmModuleNameNotifyCall(moduleName string, moduleMethod string, params any) {
	moduleSession, err := c.moduleSessionService.GetModuleSessionIDByNameOrCode(c.data.Trigger.OrganizationID, moduleName)

	if err != nil {
		log.Printf("[%s] %s : Warning trigger [%s] %s -> notify an unknown module %s\n", c.data.Event.ID, c.data.Event.Name, c.data.Trigger.TriggerID, c.data.Trigger.TriggerName, moduleName)
		return
	}

	requestChannel := utils.GChOrgaModule(c.data.Trigger.OrganizationID, moduleSession.ModuleSessionID)

	message, err := json.Marshal(model.ModuleRequest{
		Notification: true,
		Method:       moduleMethod,
		Params:       params,
	})

	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("Error publishing message to channel %s: %s", requestChannel, err.Error())))
	}

	if err := c.natsService.Nats.Publish(requestChannel, message); err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("Error publishing message to channel %s: %s", requestChannel, err.Error())))
	}

	go func() {
		newId := cuid.New()

		err = c.processRequestService.CreateProcessRequest(
			newId,
			moduleMethod,
			params,
			true,
			moduleSession.ModuleID,
			c.data.ProcessID,
		)
		if err != nil {
			fmt.Printf("Error module request %s: %s\n", requestChannel, err.Error())
		}
	}()
}
