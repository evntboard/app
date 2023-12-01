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
		if err := c.channelLock.Lock(context.Background(), c.condition.Trigger.ID); err != nil {
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

	// storage persistent

	storagePersistent := c.vm.NewObject()

	if err := storagePersistent.Set("set", c.vmStoragePersistentSet); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register tmpFile vmStorageTmpSet\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	if err := storagePersistent.Set("get", c.vmStoragePersistentGet); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register tmpFile vmStorageTmpSet\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	// storage

	storageObj := c.vm.NewObject()

	if err := storageObj.Set("persistent", storagePersistent); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register moduleRequest\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}

	if err := c.vm.Set("storage", storageObj); err != nil {
		log.Printf("[%s] %s : Error trigger [%s] %s -> register moduleRequest\n", c.event.ID, c.event.Name, c.condition.TriggerID, c.condition.Trigger.Name)
	}
}

func (c *VmWrapped) vmModuleNameRequestCall(moduleName string, moduleMethod string, params any) any {
	moduleId, err := c.getModuleIdByCodeAndName(c.condition.Trigger.OrganizationId, moduleName, moduleName)
	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("there is no %s connected !", moduleName)))
	}

	requestID := uuid.New().String()

	channelRequest := fmt.Sprintf("organization:%s:module:%s", c.condition.Trigger.OrganizationId, moduleId)
	channelResponse := fmt.Sprintf("organization:%s:module:%s:%s", c.condition.Trigger.OrganizationId, moduleId, requestID)

	message := model.ModuleRequest{
		Notification: false,
		Channel:      channelResponse,
		Method:       moduleMethod,
		Params:       params,
	}

	responseChan := make(chan *model.ModuleResponse)

	wg := &sync.WaitGroup{}

	wg.Add(1)
	go c.subscribeToChannel(channelResponse, responseChan, wg)
	wg.Wait()

	c.publishMessage(channelRequest, message)

	// Récupérer la réponse du canal
	response := <-responseChan

	if response.Error != "" {
		panic(c.vm.NewGoError(fmt.Errorf("Module %s method: %s error: %s", moduleName, moduleMethod, response.Error)))
	}

	return response.Result
}

func (c *VmWrapped) vmModuleNameNotifyCall(moduleName string, moduleMethod string, params any) {
	moduleId, err := c.getModuleIdByCodeAndName(c.condition.Trigger.OrganizationId, moduleName, moduleName)
	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("there is no %s connected !", moduleName)))
	}

	requestID := uuid.New().String()

	channelRequest := fmt.Sprintf("organization:%s:module:%s", c.condition.Trigger.OrganizationId, moduleId)
	channelResponse := fmt.Sprintf("organization:%s:module:%s:%s", c.condition.Trigger.OrganizationId, moduleId, requestID)

	message := model.ModuleRequest{
		Notification: true,
		Channel:      channelResponse,
		Method:       moduleMethod,
		Params:       params,
	}

	responseChan := make(chan *model.ModuleResponse)

	wg := &sync.WaitGroup{}

	wg.Add(1)
	go c.subscribeToChannel(channelResponse, responseChan, wg)
	wg.Wait()

	c.publishMessage(channelRequest, message)

	// Récupérer la réponse du canal
	response := <-responseChan

	if response.Error != "" {
		panic(c.vm.NewGoError(fmt.Errorf("Module %s method: %s error: %s", moduleName, moduleMethod, response.Error)))
	}
}

func (c *VmWrapped) vmSleep(ms int) {
	time.Sleep(time.Duration(ms) * time.Millisecond)
}

func (c *VmWrapped) vmLog(data ...any) {
	if len(data) == 0 {
		return
	}

	ctx := context.Background()

	keyLog := fmt.Sprintf("event:%s:trigger:%s:log", c.event.ID, c.condition.TriggerID)

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

	c.redisService.Client.RPush(ctx, keyLog, jsonData)

	if err := c.redisService.Client.Publish(ctx, fmt.Sprintf("organization:%s:event:%s", c.condition.Trigger.OrganizationId, c.event.ID), nil).Err(); err != nil {
		fmt.Println(err)
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

func (c *VmWrapped) getModuleIdByCodeAndName(organizationId string, code string, name string) (string, error) {
	ctx := context.Background()

	res, err := c.redisService.Client.HGetAll(ctx, fmt.Sprintf("organization:%s:modules", organizationId)).Result()
	if err != nil {
		return "", err
	}

	for k, v := range res {
		if v == fmt.Sprintf("%s:%s", code, name) {
			return k, nil
		}
	}

	return "", fmt.Errorf("Aucune correspondance trouvée")
}

func (c *VmWrapped) vmStoragePersistentSet(key string, value string) string {
	ctx := context.Background()
	res, err := c.storagePersistentService.CreateOrUpdatePersistentStorage(c.condition.Trigger.OrganizationId, key, value)

	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("Storage %s error: %s", key, err.Error())))
	}

	channel := fmt.Sprintf("organization:%s:storage", c.condition.Trigger.OrganizationId)

	messageJSON, err := json.Marshal(map[string]string{"key": key, "value": value})
	if err != nil {
		log.Println("Erreur de codage JSON de la requête:", err)
	}

	if err = c.redisService.Client.Publish(ctx, channel, messageJSON).Err(); err != nil {
		fmt.Println("ICI", err)
	}

	return res.Value
}

func (c *VmWrapped) vmStoragePersistentGet(key string) string {
	res, err := c.storagePersistentService.GetPersistentStorage(c.condition.Trigger.OrganizationId, key)

	if err != nil {
		panic(c.vm.NewGoError(fmt.Errorf("Storage %s error: %s", key, err.Error())))
	}

	return res.Value
}
