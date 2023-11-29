package service

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/evntboard/app/event/model"
	"github.com/evntboard/app/event/utils"
	"log"
	"time"
)

type EventsManagerService struct {
	sharedService            *SharedService
	triggerService           *TriggerService
	storagePersistentService *StoragePersistentService
	storageTemporaryService  *StorageTemporaryService
	redisService             *RedisService
}

func NewEventsManagerService(
	sharedService *SharedService,
	triggerService *TriggerService,
	storagePersistentService *StoragePersistentService,
	storageTemporaryService *StorageTemporaryService,
	redisService *RedisService,
) *EventsManagerService {
	ems := &EventsManagerService{
		sharedService:            sharedService,
		triggerService:           triggerService,
		storagePersistentService: storagePersistentService,
		storageTemporaryService:  storageTemporaryService,
		redisService:             redisService,
	}
	return ems
}

func (c *EventsManagerService) StartProcessEvents() {
	ctx := context.Background()
	for {
		result, err := c.redisService.Client.BRPop(ctx, 0, "event").Result()
		if err != nil {
			fmt.Printf("Error dequeuing task: %v\n", err)
			continue
		}

		go c.unwrapEvent(ctx, result[1])
	}
}

func (c *EventsManagerService) unwrapEvent(ctx context.Context, eventId string) {
	eventJson, err := c.redisService.Client.Get(ctx, fmt.Sprintf("event:%s", eventId)).Result()
	if err != nil {
		fmt.Println("Error retrieving data from Redis:", err)
		return
	}

	event := &model.Event{}

	if err := json.Unmarshal([]byte(eventJson), event); err != nil {
		fmt.Printf("[%s] Error decoding JSON: %v\n", eventId, err)
		return
	}

	log.Printf("[%s] %s orga %s", event.ID, event.Name, event.OrganizationId)

	for _, condition := range c.triggerService.EventForTriggerCondition(event.Name, event.OrganizationId) {
		go c.processEvent(event, condition)
	}
}

func (c *EventsManagerService) processEvent(event *model.Event, condition *model.TriggerCondition) {
	c.startEventProcess(event, condition)

	wvm := NewVmWrapped(
		event,
		condition,
		c.sharedService,
		c.redisService,
		c.storagePersistentService,
		c.storageTemporaryService,
	)

	wvm.InjectConstants()

	switch condition.Type {
	case "THROTTLE":
		currentTimeout := time.Duration(condition.Timeout) * time.Millisecond
		throttle := utils.NewThrottle(c.redisService.Client, condition.TriggerID+":"+condition.Name, currentTimeout)

		if throttle.ShouldExecute() {
			throttle.RecordExecutionTime()
			c.process(wvm)
		} else {
			c.endEventProcess(event, condition)
		}

	case "DEBOUNCE":
		currentTimeout := time.Duration(condition.Timeout) * time.Millisecond
		debounce := utils.NewDebounce(c.redisService.Client, condition.TriggerID+":"+condition.Name, currentTimeout)

		debounce.ScheduleAction(
			func() {
				c.process(wvm)
			},
			func() {
				c.endEventProcess(event, condition)
			},
		)

	case "BASIC":
		c.process(wvm)

	default:
		c.errorEventProcess(event, condition, fmt.Errorf("unknown trigger condition type : %s", condition.Type))
	}
}

func (c *EventsManagerService) process(wvm *VmWrapped) {
	wvm.LoadSharedScript()

	ok, err := wvm.ExecuteCondition()

	if err != nil {
		c.errorEventProcess(wvm.event, wvm.condition, err)
	} else if ok {
		wvm.LoadVars()
		wvm.LockChannel()
		c.reactionOkEventProcess(wvm.event, wvm.condition)
		if err := wvm.ExecuteReaction(); err != nil {
			c.errorEventProcess(wvm.event, wvm.condition, err)
		} else {
			c.endEventProcess(wvm.event, wvm.condition)
		}
		wvm.UnlockChannel()
	} else {
		c.endEventProcess(wvm.event, wvm.condition)
	}
}

func (c *EventsManagerService) reactionOkEventProcess(event *model.Event, condition *model.TriggerCondition) {
	ctx := context.Background()
	c.redisService.Client.HSet(ctx, fmt.Sprintf("event:%s:trigger:%s:process", event.ID, condition.TriggerID), map[string]string{"exec": "true"})
	if err := c.redisService.Client.Publish(ctx, fmt.Sprintf("organization:%s:event:%s", condition.Trigger.OrganizationId, event.ID), nil).Err(); err != nil {
		fmt.Println(err)
	}

	log.Printf("[%s] %s : Reaction start process [%s] %s\n", event.ID, event.Name, condition.Trigger.ID, condition.Trigger.Name)
}

func (c *EventsManagerService) startEventProcess(event *model.Event, condition *model.TriggerCondition) {
	ctx := context.Background()
	c.redisService.Client.HSet(ctx, fmt.Sprintf("event:%s:trigger:%s:process", event.ID, condition.TriggerID), map[string]string{"start": time.Now().Format(time.RFC3339Nano), "exec": "false"})
	if err := c.redisService.Client.Publish(ctx, fmt.Sprintf("organization:%s:event:%s", condition.Trigger.OrganizationId, event.ID), nil).Err(); err != nil {
		fmt.Println(err)
	}

	log.Printf("[%s] %s : Start process [%s] %s\n", event.ID, event.Name, condition.Trigger.ID, condition.Trigger.Name)
}

func (c *EventsManagerService) endEventProcess(event *model.Event, condition *model.TriggerCondition) {
	ctx := context.Background()
	c.redisService.Client.HSet(ctx, fmt.Sprintf("event:%s:trigger:%s:process", event.ID, condition.TriggerID), map[string]string{"end": time.Now().Format(time.RFC3339Nano)})
	if err := c.redisService.Client.Publish(ctx, fmt.Sprintf("organization:%s:event:%s", condition.Trigger.OrganizationId, event.ID), nil).Err(); err != nil {
		fmt.Println(err)
	}

	log.Printf("[%s] %s : End process [%s] %s\n", event.ID, event.Name, condition.Trigger.ID, condition.Trigger.Name)
}

func (c *EventsManagerService) errorEventProcess(event *model.Event, condition *model.TriggerCondition, err error) {
	ctx := context.Background()
	c.redisService.Client.HSet(ctx, fmt.Sprintf("event:%s:trigger:%s:process", event.ID, condition.TriggerID), map[string]string{"end": time.Now().Format(time.RFC3339Nano), "error": err.Error()})
	if err := c.redisService.Client.Publish(ctx, fmt.Sprintf("organization:%s:event:%s", condition.Trigger.OrganizationId, event.ID), nil).Err(); err != nil {
		fmt.Println(err)
	}
	log.Printf("[%s] %s : Error process [%s] %s\n", event.ID, event.Name, condition.Trigger.ID, condition.Trigger.Name)
}
