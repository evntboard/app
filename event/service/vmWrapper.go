package service

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/dop251/goja"
	"github.com/evntboard/app/event/model"
	"github.com/evntboard/app/event/utils"
	"github.com/google/uuid"
	"log"
	"strings"
	"sync"
	"time"
)

type VmWrapped struct {
	vm                       *goja.Runtime
	event                    *model.Event
	condition                *model.TriggerCondition
	sharedService            *SharedService
	redisService             *RedisService
	storagePersistentService *StoragePersistentService
	storageTemporaryService  *StorageTemporaryService
	channelLock              *utils.ChannelLock
}

func NewVmWrapped(
	event *model.Event,
	condition *model.TriggerCondition,
	sharedService *SharedService,
	redisService *RedisService,
	storagePersistentService *StoragePersistentService,
	storageTemporaryService *StorageTemporaryService,
) *VmWrapped {
	return &VmWrapped{
		vm:        goja.New(),
		event:     event,
		condition: condition,

		sharedService:            sharedService,
		redisService:             redisService,
		storagePersistentService: storagePersistentService,
		storageTemporaryService:  storageTemporaryService,
	}
}

func (c *VmWrapped) InjectConstants() {
	eventObj := c.vm.NewObject()
	_ = eventObj.Set("id", c.event.ID)
	_ = eventObj.Set("name", c.event.Name)
	_ = eventObj.Set("payload", c.event.Payload)
	_ = eventObj.Set("emitted_at", c.event.EmittedAt)
	_ = eventObj.Set("emitter_code", c.event.EmitterCode)
	_ = eventObj.Set("emitter_name", c.event.EmitterName)
	_ = c.vm.Set("event", eventObj)
}

func (c *VmWrapped) LoadSharedScript() {
	if sharedLinked, err := c.sharedService.GetSharedsFromPathSequence(c.condition.Trigger.Name, c.condition.Trigger.OrganizationId); err == nil {
		for _, s := range sharedLinked {
			if _, err := c.vm.RunString(s.Code); err != nil {
				fmt.Println("ERROR WHEN EXECUTE SHARED")
			}
		}
	}
}

func (c *VmWrapped) ExecuteCondition() (bool, error) {
	value, err := c.vm.RunString(c.condition.Code)
	if err != nil {
		return false, err
	}

	if vb := value.ToBoolean(); !vb {
		return false, nil
	}
	return true, nil
}

func (c *VmWrapped) LockChannel() {
	trimTriggerChannel := strings.Trim(c.condition.Trigger.Channel, " \t\n")

	if trimTriggerChannel != "" {
		c.channelLock = utils.NewChannelLock(c.redisService.Client, trimTriggerChannel, 30*time.Minute)
		if err := c.channelLock.Lock(context.Background()); err != nil {
			fmt.Println("LOCK ERROR " + err.Error())
		}
	}
}

func (c *VmWrapped) UnlockChannel() {
	if c.channelLock != nil {
		if err := c.channelLock.Unlock(context.Background()); err != nil {
			fmt.Println("UNLOCK ERROR " + err.Error())
		}
	}
}

func (c *VmWrapped) ExecuteReaction() error {
	_, err := c.vm.RunString(c.condition.Trigger.Code)
	return err
}

func (c *VmWrapped) LoadVars() {
	if err := c.vm.Set("log", c.vmLog); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register sleep\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	if err := c.vm.Set("sleep", c.vmSleep); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register sleep\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	// MODULE

	moduleObj := c.vm.NewObject()

	if err := moduleObj.Set("request", c.vmModuleNameRequestCall); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register tmpFile vmStorageTmpSet\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	if err := moduleObj.Set("notify", c.vmModuleNameNotifyCall); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register tmpFile vmStorageTmpSet\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	if err := c.vm.Set("module", moduleObj); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register moduleRequest\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	// MODULES

	modulesObj := c.vm.NewObject()

	if err := modulesObj.Set("request", c.vmModuleCodeRequestCall); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register tmpFile vmStorageTmpSet\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	if err := modulesObj.Set("notify", c.vmModuleCodeNotifyCall); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register tmpFile vmStorageTmpSet\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	if err := c.vm.Set("modules", modulesObj); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register moduleRequest\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}
	// storage

	storageObj := c.vm.NewObject()

	if err := storageObj.Set("set", c.vmStorageSet); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register storage set \n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	if err := storageObj.Set("get", c.vmStorageGet); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register storage get\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	if err := c.vm.Set("storage", storageObj); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register moduleRequest\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}
}

func (c *VmWrapped) publishMessage(channel string, message model.ModuleRequest) {
	messageJSON, err := json.Marshal(message)
	if err != nil {
		log.Println("Erreur de codage JSON de la requête:", err)
		return
	}

	if err = c.redisService.Client.Publish(context.Background(), channel, messageJSON).Err(); err != nil {
		log.Println("Erreur d'envoi de la requête:", err)
	}
}

func (c *VmWrapped) subscribeToChannel(channel string, responseChan chan<- *model.ModuleResponse, wg *sync.WaitGroup) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pubsub := c.redisService.Client.Subscribe(ctx, channel)

	defer pubsub.Close()

	wg.Done()

	select {
	case msg, ok := <-pubsub.Channel():
		if !ok {
			fmt.Println("le canal de messages est fermé")
			responseChan <- &model.ModuleResponse{
				Error: "channel closed",
			}
			break
		}

		request := &model.ModuleResponse{}
		err := json.Unmarshal([]byte(msg.Payload), &request)
		if err != nil {
			log.Println("Erreur de décodage JSON de la requête:", err)
			responseChan <- &model.ModuleResponse{
				Error: "decode error",
			}
			break
		}
		responseChan <- request
	case <-ctx.Done():
		log.Println("Le délai d'attente de 10 secondes est écoulé.")
		responseChan <- &model.ModuleResponse{
			Error: "timeout",
		}
	}
	close(responseChan)
}

func (c *VmWrapped) vmSleep(ms int) {
	time.Sleep(time.Duration(ms) * time.Millisecond)
}

func (c *VmWrapped) vmLog(data ...any) {
	if len(data) == 0 {
		return
	}

	ctx := context.Background()

	logKey := utils.GKeyOrgaEventTriggerLog(c.condition.Trigger.OrganizationId, c.event.ID, c.condition.TriggerID)
	eventChannel := utils.GChOrgaEvent(c.condition.Trigger.OrganizationId, c.event.ID)

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

	c.redisService.Client.RPush(ctx, logKey, jsonData)

	if err := c.redisService.Client.Publish(ctx, eventChannel, nil).Err(); err != nil {
		fmt.Println(err)
	}
}

func (c *VmWrapped) getModuleIdByName(organizationId string, nameOrCode string) (string, error) {
	ctx := context.Background()

	modulesKey := utils.GKeyOrgaModules(organizationId)

	res, err := c.redisService.Client.HGetAll(ctx, modulesKey).Result()
	if err != nil {
		return "", err
	}

	for k, v := range res {
		if strings.HasSuffix(v, fmt.Sprintf(":%s", nameOrCode)) {
			return k, nil
		}
	}

	for k, v := range res {
		if strings.HasPrefix(v, fmt.Sprintf("%s:", nameOrCode)) {
			return k, nil
		}
	}

	return "", fmt.Errorf("Aucune correspondance trouvée")
}

func (c *VmWrapped) getModuleIdsByCode(organizationId string, code string) ([]string, error) {
	ctx := context.Background()

	modulesKey := utils.GKeyOrgaModules(organizationId)

	res, err := c.redisService.Client.HGetAll(ctx, modulesKey).Result()
	if err != nil {
		return nil, err
	}

	var modulesId []string

	for k, v := range res {
		if strings.HasPrefix(v, fmt.Sprintf("%s:", code)) {
			modulesId = append(modulesId, k)
		}
	}

	if len(modulesId) == 0 {
		return nil, fmt.Errorf("Aucune correspondance trouvée")
	}
	return modulesId, nil
}

func (c *VmWrapped) vmStorageSet(key string, value any) any {
	if len(strings.Replace(key, "tmp:", "", 1)) < 3 {
		panic(c.vm.NewGoError(fmt.Errorf("storage set key cannot be less than 3 chars")))
	}

	ctx := context.Background()

	if strings.HasPrefix(key, "tmp:") {
		res, err := c.storageTemporaryService.CreateOrUpdateTemporaryStorage(c.condition.Trigger.OrganizationId, key, value)

		if err != nil {
			panic(c.vm.NewGoError(fmt.Errorf("Storage %s error: %s", key, err.Error())))
		}

		storageChannel := utils.GChOrgaStorage(c.condition.Trigger.OrganizationId)

		messageJSON, err := json.Marshal(map[string]any{"key": key, "value": res})
		if err != nil {
			log.Println("Erreur de codage JSON de la requête:", err)
		}

		if err = c.redisService.Client.Publish(ctx, storageChannel, messageJSON).Err(); err != nil {
			fmt.Println("ICI", err)
		}

		return res
	} else {
		res, err := c.storagePersistentService.CreateOrUpdatePersistentStorage(c.condition.Trigger.OrganizationId, key, value)

		if err != nil {
			panic(c.vm.NewGoError(fmt.Errorf("Storage %s error: %s", key, err.Error())))
		}

		storageChannel := utils.GChOrgaStorage(c.condition.Trigger.OrganizationId)

		messageJSON, err := json.Marshal(map[string]any{"key": key, "value": value})
		if err != nil {
			log.Println("Erreur de codage JSON de la requête:", err)
		}

		if err = c.redisService.Client.Publish(ctx, storageChannel, messageJSON).Err(); err != nil {
			fmt.Println("ICI", err)
		}

		return res
	}
}

func (c *VmWrapped) vmStorageGet(key string) any {
	if len(strings.Replace(key, "tmp:", "", 1)) < 3 {
		panic(c.vm.NewGoError(fmt.Errorf("storage get key cannot be less than 3 chars")))
	}

	if strings.HasPrefix(key, "tmp:") {
		res, err := c.storageTemporaryService.GetTemporaryStorage(c.condition.Trigger.OrganizationId, key)

		if err != nil {
			log.Printf("[%s] %s : Warning trigger [%s] %s -> Storage %s error: %s\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name, key, err.Error())
			return nil
		}

		return res
	} else {
		res, err := c.storagePersistentService.GetPersistentStorage(c.condition.Trigger.OrganizationId, key)

		if err != nil {
			log.Printf("[%s] %s : Warning trigger [%s] %s -> Storage %s error: %s\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name, key, err.Error())
			return nil
		}

		return res
	}
}

func (c *VmWrapped) vmModuleNameRequestCall(moduleName string, moduleMethod string, params any) any {
	moduleId, err := c.getModuleIdByName(c.condition.Trigger.OrganizationId, moduleName)
	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("there is no %s connected !", moduleName)))
	}

	requestID := uuid.New().String()

	requestChannel := utils.GChOrgaModule(c.condition.Trigger.OrganizationId, moduleId)
	responseChannel := utils.GChOrgaModuleRequest(c.condition.Trigger.OrganizationId, moduleId, requestID)

	message := model.ModuleRequest{
		Notification: false,
		Channel:      responseChannel,
		Method:       moduleMethod,
		Params:       params,
	}

	responseChan := make(chan *model.ModuleResponse)

	wg := &sync.WaitGroup{}

	wg.Add(1)
	go c.subscribeToChannel(responseChannel, responseChan, wg)
	wg.Wait()

	c.publishMessage(requestChannel, message)

	// Récupérer la réponse du canal
	response := <-responseChan

	if response.Error != "" {
		panic(c.vm.NewGoError(fmt.Errorf("Module %s method: %s error: %s", moduleName, moduleMethod, response.Error)))
	}

	return response.Result
}

func (c *VmWrapped) vmModuleNameNotifyCall(moduleName string, moduleMethod string, params any) {
	moduleId, err := c.getModuleIdByName(c.condition.Trigger.OrganizationId, moduleName)
	if err != nil {
		log.Printf("[%s] %s : Warning trigger [%s] %s -> notify an unknown module %s\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name, moduleName)
		return
	}

	requestChannel := utils.GChOrgaModule(c.condition.Trigger.OrganizationId, moduleId)

	message := model.ModuleRequest{
		Notification: true,
		Channel:      "",
		Method:       moduleMethod,
		Params:       params,
	}

	c.publishMessage(requestChannel, message)
}

func (c *VmWrapped) vmModuleCodeRequestCall(moduleCode string, moduleMethod string, params any) []any {
	moduleIds, err := c.getModuleIdsByCode(c.condition.Trigger.OrganizationId, moduleCode)
	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("there is no %s connected !", moduleCode)))
	}

	var wg sync.WaitGroup
	responseChan := make(chan *model.ModuleResponse, len(moduleIds))

	for _, moduleId := range moduleIds {
		wg.Add(1)
		go func(moduleId string) {
			defer wg.Done()

			requestID := uuid.New().String()

			requestChannel := utils.GChOrgaModule(c.condition.Trigger.OrganizationId, moduleId)
			responseChannel := utils.GChOrgaModuleRequest(c.condition.Trigger.OrganizationId, moduleId, requestID)

			message := model.ModuleRequest{
				Notification: false,
				Channel:      responseChannel,
				Method:       moduleMethod,
				Params:       params,
			}

			wg2 := &sync.WaitGroup{}
			wg.Add(1)
			go c.subscribeToChannel(responseChannel, responseChan, wg2)
			wg.Wait()

			c.publishMessage(requestChannel, message)
		}(moduleId)
	}

	wg.Wait()

	close(responseChan)

	var responses []model.ModuleResponse
	for response := range responseChan {
		responses = append(responses, *response)
	}

	for _, response := range responses {
		if response.Error != "" {
			panic(c.vm.NewGoError(fmt.Errorf("Module %s method: %s error: %s", moduleCode, moduleMethod, response.Error)))
		}
	}

	var results []any
	for _, response := range responses {
		results = append(results, response.Result)
	}

	return results
}

func (c *VmWrapped) vmModuleCodeNotifyCall(moduleCode string, moduleMethod string, params []any) {
	moduleIds, err := c.getModuleIdsByCode(c.condition.Trigger.OrganizationId, moduleCode)

	if err != nil {
		log.Printf("[%s] %s : Warning trigger [%s] %s -> notify an unknown module %s\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name, moduleCode)
		return
	}

	for _, moduleId := range moduleIds {
		go func(moduleId string) {
			requestChannel := utils.GChOrgaModule(c.condition.Trigger.OrganizationId, moduleId)

			message := model.ModuleRequest{
				Notification: true,
				Channel:      "",
				Method:       moduleMethod,
				Params:       params,
			}

			c.publishMessage(requestChannel, message)
		}(moduleId)
	}
}
