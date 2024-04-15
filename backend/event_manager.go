package main

import (
	"errors"
	"fmt"
	"github.com/evntboard/evntboard/utils"
	"github.com/pocketbase/pocketbase/models"
	"github.com/sourcegraph/conc/pool"
	"strings"
	"sync"
	"time"
)

func (app *application) StartProcessEvents() {
	p := pool.New().WithMaxGoroutines(100)
	for eventRecord := range app.ch {
		p.Go(func() {
			app.pb.Logger().Info("Nouvel événement [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"))

			conditions, err := app.getConditionsForOrganizationAndEventName(eventRecord.GetString("organization"), eventRecord.GetString("name"))

			if err != nil {
				return
			}

			for _, condition := range conditions {
				go app.processEvent(
					eventRecord,
					condition,
				)
			}
		})
	}
	p.Wait()
}

func (app *application) processEvent(eventRecord *models.Record, condition *TriggerCondition) {
	app.pb.Logger().Info("[%s] %s : Start process trigger [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName)

	processRecord, err := app.CreateProcess(condition.OrganizationID, eventRecord.Id, condition.TriggerID)

	if err != nil {
		app.pb.Logger().Info("[%s] %s : Error create process [%s] %s\n", eventRecord.Id, condition.TriggerID)
		return
	}

	vmContext := NewVMContext(
		app,
		processRecord,
		eventRecord,
		condition,
	)

	switch condition.ConditionType {
	case "THROTTLE":
		app.throttleDataMu.Lock()
		defer app.throttleDataMu.Unlock()

		throttle, ok := app.throttleData[condition.TriggerID+":"+condition.ConditionName]

		currentTimeout := time.Duration(condition.ConditionTimeout) * time.Millisecond

		if !ok {
			throttle = utils.NewThrottle(currentTimeout)
			app.throttleData[condition.TriggerID+":"+condition.ConditionName] = throttle
		}

		throttle.ScheduleAction(
			func() {
				app.processCondition(vmContext, processRecord, eventRecord, condition)
			},
			func() {
				app.pb.Logger().Info("[%s] %s : Cancel process [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName)
				processRecord, err = app.StopProcess(processRecord)
				if err != nil {
					app.pb.Logger().Info("[%s] %s : Error update process [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName)
				}
			},
		)

	case "DEBOUNCE":
		app.debounceDataMu.Lock()
		defer app.debounceDataMu.Unlock()

		debounce, ok := app.debounceData[condition.TriggerID+":"+condition.ConditionName]
		currentTimeout := time.Duration(condition.ConditionTimeout) * time.Millisecond

		if !ok {
			debounce = utils.NewDebounce(currentTimeout)
			app.debounceData[condition.TriggerID+":"+condition.ConditionName] = debounce
		}

		debounce.ScheduleAction(
			func() {
				app.processCondition(vmContext, processRecord, eventRecord, condition)
			},
			func() {
				app.pb.Logger().Info("[%s] %s : Cancel process [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName)
				processRecord, err = app.StopProcess(processRecord)
				if err != nil {
					app.pb.Logger().Info("[%s] %s : Error update process [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName)
				}
			},
		)

	case "BASIC":
		app.processCondition(vmContext, processRecord, eventRecord, condition)

	default:
		err := errors.New(fmt.Sprintf("Event %s: Unknown condition type %s\n", eventRecord.Id, condition.ConditionType))
		app.pb.Logger().Info("[%s] %s : Error process [%s] %s -> %s\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName, err.Error())
		processRecord, err = app.StopErrorProcess(processRecord, err)
		if err != nil {
			app.pb.Logger().Info("[%s] %s : Error update process [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName)
		}
	}
}

func (app *application) processCondition(vmContext *VMContext, processRecord *models.Record, eventRecord *models.Record, condition *TriggerCondition) {
	if shareds, err := app.getSharedByPath(condition.OrganizationID, condition.TriggerName); err == nil {
		for _, s := range shareds {
			if _, err := vmContext.vm.RunString(s.GetString("code")); err != nil {
				fmt.Println("ERROR WHEN EXECUTE SHARED")
			}
		}
	}

	value, err := vmContext.vm.RunString(condition.ConditionCode)
	if err != nil {
		app.pb.Logger().Info("[%s] %s : Error process condition [%s] %s -> %s\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName, err.Error())

		processRecord, err = app.StopErrorProcess(processRecord, err)
		if err != nil {
			app.pb.Logger().Info("[%s] %s : Error update process [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName)
		}
		return
	}

	if vb := value.ToBoolean(); !vb {
		app.pb.Logger().Info("[%s] %s : Stop process condition [%s] %s result is false\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName)

		processRecord, err = app.StopProcess(processRecord)
		if err != nil {
			app.pb.Logger().Info("[%s] %s : Error update process [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), condition.TriggerID, condition.TriggerName)
		}

		return
	}

	app.processReaction(vmContext, processRecord, eventRecord, condition)
}

func (app *application) processReaction(vmContext *VMContext, processRecord *models.Record, eventRecord *models.Record, trigger *TriggerCondition) {
	moduleObj := vmContext.vm.NewObject()

	_ = moduleObj.Set("request", vmContext.vmModuleNameRequestCall)
	_ = moduleObj.Set("notify", vmContext.vmModuleNameNotifyCall)
	_ = vmContext.vm.Set("module", moduleObj)

	storageObj := vmContext.vm.NewObject()

	_ = storageObj.Set("set", vmContext.vmStorageSet)
	_ = storageObj.Set("get", vmContext.vmStorageGet)

	_ = vmContext.vm.Set("storage", storageObj)

	trimTriggerChannel := strings.Trim(trigger.TriggerChannel, " \t\n")

	if trimTriggerChannel != "" {
		v, exist := app.channels[trimTriggerChannel]
		if !exist {
			app.channelsMu.Lock()
			defer app.channelsMu.Unlock()

			v = &sync.Mutex{}
			app.channels[trimTriggerChannel] = v
		}

		app.pb.Logger().Info("[%s] %s : Lock channel trigger [%s] %s -> %s\n", eventRecord.Id, eventRecord.GetString("name"), trigger.TriggerID, trigger.TriggerName, trimTriggerChannel)

		v.Lock()
	}

	if err := vmContext.vm.Set("log", vmContext.vmLog); err != nil {
		app.pb.Logger().Info("[%s] %s : Error trigger [%s] %s -> register sleep\n", eventRecord.Id, eventRecord.GetString("name"), trigger.TriggerID, trigger.TriggerName)
	}

	if err := vmContext.vm.Set("sleep", vmContext.vmSleep); err != nil {
		app.pb.Logger().Info("[%s] %s : Error trigger [%s] %s -> register sleep\n", eventRecord.Id, eventRecord.GetString("name"), trigger.TriggerID, trigger.TriggerName)
	}

	if _, err := vmContext.vm.RunString(trigger.TriggerCode); err != nil {
		app.pb.Logger().Info("[%s] %s : Error process trigger [%s] %s -> %s\n", eventRecord.Id, eventRecord.GetString("name"), trigger.TriggerID, trigger.TriggerName, err.Error())

		processRecord, err = app.StopErrorExecutedProcess(processRecord, err)
		if err != nil {
			app.pb.Logger().Info("[%s] %s : Error update process [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), trigger.TriggerID, trigger.TriggerName)
		}
	} else {
		app.pb.Logger().Info("[%s] %s : End process trigger [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), trigger.TriggerID, trigger.TriggerName)
		processRecord, err = app.StopExecutedProcess(processRecord)
		if err != nil {
			app.pb.Logger().Info("[%s] %s : Error update process [%s] %s\n", eventRecord.Id, eventRecord.GetString("name"), trigger.TriggerID, trigger.TriggerName)
		}
	}

	if trimTriggerChannel != "" {
		v := app.channels[trimTriggerChannel]
		v.Unlock()
	}
}
