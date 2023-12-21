package service

import (
	"context"
	"errors"
	"fmt"
	"github.com/evntboard/app/event/model"
	"github.com/evntboard/app/event/utils"
	"github.com/lucsky/cuid"
	"github.com/nats-io/nats.go"
	"log"
	"time"
)

type EventsManagerService struct {
	sharedService         *SharedService
	triggerService        *TriggerService
	eventService          *EventService
	processService        *ProcessService
	storageService        *StorageService
	moduleSessionService  *ModuleSessionService
	processRequestService *ProcessRequestService
	processLogService     *ProcessLogService
	natsService           *NatsService
	lockService           *LockService
}

func NewEventsManagerService(
	sharedService *SharedService,
	triggerService *TriggerService,
	eventService *EventService,
	processService *ProcessService,
	storageService *StorageService,
	moduleSessionService *ModuleSessionService,
	processRequestService *ProcessRequestService,
	processLogService *ProcessLogService,
	natsService *NatsService,
	lockService *LockService,
) *EventsManagerService {
	ems := &EventsManagerService{
		sharedService:         sharedService,
		triggerService:        triggerService,
		eventService:          eventService,
		processService:        processService,
		storageService:        storageService,
		moduleSessionService:  moduleSessionService,
		processRequestService: processRequestService,
		processLogService:     processLogService,
		natsService:           natsService,
		lockService:           lockService,
	}
	return ems
}

func (c *EventsManagerService) StartProcessEvents() error {
	sub, err := c.natsService.Nats.QueueSubscribe(utils.DataEvents, "event-workers", func(msg *nats.Msg) {
		eventID := string(msg.Data)
		go c.unwrapEvent(eventID)
	})
	if err != nil {
		fmt.Println("Error subscribing to channel:", err)
		return errors.New("error subscribing to channel")
	}
	defer sub.Unsubscribe()

	select {}
}

func (c *EventsManagerService) unwrapEvent(eventID string) {
	err := c.eventService.UpdateStatusEventByID(eventID, "QUEUED", "CONSUMED")

	if err != nil {
		fmt.Println("Event already in process")
		return
	}

	event, err := c.eventService.GetEventByID(eventID)

	if err != nil {
		fmt.Println("Error retrieving data from database:", err)
		return
	}

	log.Printf("[%s] %s orga %s", event.ID, event.Name, event.OrganizationID)

	conditions, err := c.triggerService.EventForTriggerCondition(event.OrganizationID, event.Name)
	if err != nil {
		fmt.Println("Error retrieving data from DB:", err)
		return
	}

	for _, condition := range conditions {
		data := &model.VmData{
			Event:     event,
			Trigger:   condition,
			ProcessID: cuid.New(),
		}

		ctx := context.Background()

		if err := c.processService.CreateProcessForTriggerIDAndEventID(ctx, data.ProcessID, data.Trigger.TriggerID, data.Event.ID); err != nil {
			fmt.Println("Error creating process:", err)
			return
		}

		go c.processEvent(data)
	}
}

func (c *EventsManagerService) processEvent(data *model.VmData) {
	go c.startEventProcess(data)

	wvm := NewVmWrapped(
		data,
		c.natsService,
		c.sharedService,
		c.processService,
		c.storageService,
		c.moduleSessionService,
		c.processLogService,
		c.processRequestService,
		c.lockService,
	)

	switch data.Trigger.ConditionType {
	case "THROTTLE":
		throttle := NewThrottleService(
			c.lockService,
			data.Trigger.TriggerID+":"+data.Trigger.ConditionName,
			time.Duration(data.Trigger.ConditionTimeout)*time.Millisecond,
		)

		throttle.ScheduleAction(
			func() {
				c.process(wvm)
			},
			func() {
				go c.endEventProcess(data)
			},
		)

	case "DEBOUNCE":
		debounce := NewDebounceService(
			c.lockService,
			c.natsService,
			data.Trigger.TriggerID+":"+data.Trigger.ConditionName,
			time.Duration(data.Trigger.ConditionTimeout)*time.Millisecond,
		)

		debounce.ScheduleAction(
			func() {
				c.process(wvm)
			},
			func() {
				go c.endEventProcess(data)
			},
		)

	case "BASIC":
		c.process(wvm)

	default:
		go c.errorEventProcess(data, fmt.Errorf("unknown trigger condition type : %s", data.Trigger.ConditionType))
	}
}

func (c *EventsManagerService) process(wvm *VmWrapped) {
	wvm.LoadSharedScript()

	ok, err := wvm.ExecuteCondition()

	if err != nil {
		go c.errorEventProcess(wvm.data, err)
	} else if ok {
		wvm.LoadVars()
		wvm.LockChannel()
		go c.reactionOkEventProcess(wvm.data)
		if err := wvm.ExecuteReaction(); err != nil {
			go c.errorEventProcess(wvm.data, err)
		} else {
			go c.endEventProcess(wvm.data)
		}
		wvm.UnlockChannel()
	} else {
		go c.endEventProcess(wvm.data)
	}
}

func (c *EventsManagerService) reactionOkEventProcess(data *model.VmData) {
	ctx := context.Background()

	err := c.processService.UpdateExecutedForTriggerIDAndEventID(ctx, data.ProcessID, data.Trigger.TriggerID, data.Event.ID)
	if err != nil {
		log.Println(err)
	}

	eventCh := utils.GChOrgaEvent(data.Trigger.OrganizationID, data.Event.ID)

	if err := c.natsService.Nats.Publish(eventCh, nil); err != nil {
		log.Println(err)
	}

	log.Printf("[%s] %s : Reaction start process [%s] %s\n", data.Event.ID, data.Event.Name, data.Trigger.TriggerID, data.Trigger.TriggerName)
}

func (c *EventsManagerService) startEventProcess(data *model.VmData) {
	ctx := context.Background()

	err := c.processService.UpdateStartDateForTriggerIDAndEventID(ctx, data.ProcessID, data.Trigger.TriggerID, data.Event.ID)
	if err != nil {
		log.Println(err)
	}

	eventCh := utils.GChOrgaEvent(data.Trigger.OrganizationID, data.Event.ID)

	if err := c.natsService.Nats.Publish(eventCh, nil); err != nil {
		log.Println(err)
	}

	log.Printf("[%s] %s : Start process [%s] %s\n", data.Event.ID, data.Event.Name, data.Trigger.TriggerID, data.Trigger.TriggerName)
}

func (c *EventsManagerService) endEventProcess(data *model.VmData) {
	ctx := context.Background()

	err := c.processService.UpdateEndDateForTriggerIDAndEventID(ctx, data.ProcessID, data.Trigger.TriggerID, data.Event.ID)
	if err != nil {
		log.Println(err)
	}

	_ = c.eventService.UpdateStatusEventByID(data.Event.ID, "CONSUMED", "DONE")

	eventCh := utils.GChOrgaEvent(data.Trigger.OrganizationID, data.Event.ID)

	if err := c.natsService.Nats.Publish(eventCh, nil); err != nil {
		log.Println(err)
	}

	log.Printf("[%s] %s : End process [%s] %s\n", data.Event.ID, data.Event.Name, data.Trigger.TriggerID, data.Trigger.TriggerName)
}

func (c *EventsManagerService) errorEventProcess(data *model.VmData, error error) {
	ctx := context.Background()

	err := c.processService.UpdateErrorForTriggerIDAndEventID(ctx, data.ProcessID, data.Trigger.TriggerID, data.Event.ID, error.Error())
	if err != nil {
		log.Println(err)
	}

	_ = c.eventService.UpdateStatusEventByID(data.Event.ID, "CONSUMED", "DONE")

	eventCh := utils.GChOrgaEvent(data.Trigger.OrganizationID, data.Event.ID)

	if err := c.natsService.Nats.Publish(eventCh, nil); err != nil {
		log.Println(err)
	}

	log.Printf("[%s] %s : Error process [%s] %s\n", data.Event.ID, data.Event.Name, data.Trigger.TriggerID, data.Trigger.TriggerName)
}
