package service

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/evntboard/app/event/model"
	"github.com/evntboard/app/event/utils"
	"log"
	"strings"
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
		result, err := c.redisService.Client.BRPop(ctx, 0, utils.DataEvents).Result()
		if err != nil {
			fmt.Printf("Error dequeuing task: %v\n", err)
			continue
		}

		go c.unwrapEvent(ctx, result[1])
	}
}

func (c *EventsManagerService) unwrapEvent(ctx context.Context, eventKey string) {
	eventMap, err := c.redisService.Client.HGetAll(ctx, eventKey).Result()
	if err != nil {
		fmt.Println("Error retrieving data from Redis:", err)
		return
	}

	parts := strings.Split(eventKey, ":")
	if len(parts) < 3 {
		fmt.Println("eventKey have not the right format ...")
		return
	}

	organizationId := parts[2]

	var rawMessage json.RawMessage
	if err := json.Unmarshal([]byte(eventMap["payload"]), &rawMessage); err != nil {
		fmt.Println("Error unmarshaling JSON:", err)
		return
	}

	// Now, you can decide the appropriate structure and unmarshal the raw message later
	var payload interface{}
	if err := json.Unmarshal(rawMessage, &payload); err != nil {
		fmt.Println("Error unmarshaling dynamicStruct:", err)
		return
	}

	emittedAt, _ := time.Parse(time.RFC3339Nano, eventMap["emitted_at"])

	event := &model.Event{
		ID:          eventMap["id"],
		Name:        eventMap["name"],
		Payload:     payload,
		EmittedAt:   emittedAt,
		EmitterCode: eventMap["emitter_code"],
		EmitterName: eventMap["emitter_name"],
	}

	log.Printf("[%s] %s orga %s", event.ID, event.Name, organizationId)

	for _, condition := range c.triggerService.EventForTriggerCondition(event.Name, organizationId) {
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
		throttle := utils.NewThrottle(
			c.redisService.Client,
			condition.TriggerID+":"+condition.Name,
			time.Duration(condition.Timeout)*time.Millisecond,
		)

		throttle.ScheduleAction(
			func() {
				c.process(wvm)
			},
			func() {
				c.endEventProcess(event, condition)
			},
		)

	case "DEBOUNCE":
		debounce := utils.NewDebounce(
			c.redisService.Client,
			condition.TriggerID+":"+condition.Name,
			time.Duration(condition.Timeout)*time.Millisecond,
		)

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

	processKey := utils.GKeyOrgaEventTriggerProcess(condition.Trigger.OrganizationId, event.ID, condition.TriggerID)
	eventCh := utils.GChOrgaEvent(condition.Trigger.OrganizationId, event.ID)

	c.redisService.Client.HSet(ctx, processKey, map[string]string{"exec": "true"})
	if err := c.redisService.Client.Publish(ctx, eventCh, nil).Err(); err != nil {
		fmt.Println(err)
	}

	log.Printf("[%s] %s : Reaction start process [%s] %s\n", event.ID, event.Name, condition.Trigger.ID, condition.Trigger.Name)
}

func (c *EventsManagerService) startEventProcess(event *model.Event, condition *model.TriggerCondition) {
	ctx := context.Background()

	processKey := utils.GKeyOrgaEventTriggerProcess(condition.Trigger.OrganizationId, event.ID, condition.TriggerID)
	eventCh := utils.GChOrgaEvent(condition.Trigger.OrganizationId, event.ID)

	c.redisService.Client.HSet(ctx, processKey, map[string]string{"start": time.Now().Format(time.RFC3339Nano), "exec": "false"})
	if err := c.redisService.Client.Publish(ctx, eventCh, nil).Err(); err != nil {
		fmt.Println(err)
	}

	log.Printf("[%s] %s : Start process [%s] %s\n", event.ID, event.Name, condition.Trigger.ID, condition.Trigger.Name)
}

func (c *EventsManagerService) endEventProcess(event *model.Event, condition *model.TriggerCondition) {
	ctx := context.Background()

	processKey := utils.GKeyOrgaEventTriggerProcess(condition.Trigger.OrganizationId, event.ID, condition.TriggerID)
	eventCh := utils.GChOrgaEvent(condition.Trigger.OrganizationId, event.ID)

	c.redisService.Client.HSet(ctx, processKey, map[string]string{"end": time.Now().Format(time.RFC3339Nano)})
	if err := c.redisService.Client.Publish(ctx, eventCh, nil).Err(); err != nil {
		fmt.Println(err)
	}

	log.Printf("[%s] %s : End process [%s] %s\n", event.ID, event.Name, condition.Trigger.ID, condition.Trigger.Name)
}

func (c *EventsManagerService) errorEventProcess(event *model.Event, condition *model.TriggerCondition, err error) {
	ctx := context.Background()

	processKey := utils.GKeyOrgaEventTriggerProcess(condition.Trigger.OrganizationId, event.ID, condition.TriggerID)
	eventCh := utils.GChOrgaEvent(condition.Trigger.OrganizationId, event.ID)

	c.redisService.Client.HSet(ctx, processKey, map[string]string{"end": time.Now().Format(time.RFC3339Nano), "error": err.Error()})
	if err := c.redisService.Client.Publish(ctx, eventCh, nil).Err(); err != nil {
		fmt.Println(err)
	}
	log.Printf("[%s] %s : Error process [%s] %s\n", event.ID, event.Name, condition.Trigger.ID, condition.Trigger.Name)
}
