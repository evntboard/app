package main

import (
	"github.com/evntboard/app/backend/internal/model"
	"github.com/evntboard/app/backend/utils"
	"log/slog"
	"strings"
	"sync"
	"time"
)

func (app *application) logDebugProcess(event *model.EventReceived, condition *model.TriggerCondition, message string) {
	app.logger.Debug(
		message,
		slog.String("organization", event.OrganizationId),
		slog.Group("event",
			slog.String("id", event.Id),
			slog.String("name", event.Name),
		),
		slog.Group("trigger",
			slog.String("id", condition.Expand.Trigger.Id),
			slog.String("name", condition.Expand.Trigger.Name),
		),
		slog.Group("condition",
			slog.String("id", condition.Id),
			slog.String("name", condition.Name),
		),
	)
}

func (app *application) processEvent(event *model.EventReceived, condition *model.TriggerCondition) {
	app.logDebugProcess(event, condition, "start process")

	processRecordId, err := app.pb.CreateProcess(condition.Expand.Trigger.OrganizationId, event.Id, condition.Expand.Trigger.Id)

	if err != nil {
		app.logDebugProcess(event, condition, "error start process")
		return
	}

	vmContext, err := NewVMContext(
		app,
		processRecordId,
		event,
		condition,
	)

	if err != nil {
		app.logDebugProcess(event, condition, "stop process")
		err = app.pb.StopErrorProcess(processRecordId, err)
		if err != nil {
			app.logDebugProcess(event, condition, "error stop process")
		}
		return
	}

	switch condition.Type {
	case "THROTTLE":
		app.throttleDataMu.Lock()
		defer app.throttleDataMu.Unlock()

		throttle, ok := app.throttleData[condition.Expand.Trigger.Id+":"+condition.Name]

		currentTimeout := time.Duration(condition.Timeout) * time.Millisecond

		if !ok {
			throttle = utils.NewThrottle(currentTimeout)
			app.throttleData[condition.Expand.Trigger.Id+":"+condition.Name] = throttle
		}

		throttle.ScheduleAction(
			func() {
				app.processCondition(vmContext, processRecordId, event, condition)
			},
			func() {
				app.logDebugProcess(event, condition, "stop process")

				err = app.pb.StopProcess(processRecordId)
				if err != nil {
					app.logDebugProcess(event, condition, "error stop process")
				}
			},
		)

	case "DEBOUNCE":
		app.debounceDataMu.Lock()
		defer app.debounceDataMu.Unlock()

		debounce, ok := app.debounceData[condition.Expand.Trigger.Id+":"+condition.Name]
		currentTimeout := time.Duration(condition.Timeout) * time.Millisecond

		if !ok {
			debounce = utils.NewDebounce(currentTimeout)
			app.debounceData[condition.Expand.Trigger.Id+":"+condition.Name] = debounce
		}

		debounce.ScheduleAction(
			func() {
				app.processCondition(vmContext, processRecordId, event, condition)
			},
			func() {
				app.logDebugProcess(event, condition, "stop process")
				err = app.pb.StopProcess(processRecordId)
				if err != nil {
					app.logDebugProcess(event, condition, "error stop process")
				}
			},
		)

	case "BASIC":
		app.processCondition(vmContext, processRecordId, event, condition)

	default:
		app.logDebugProcess(event, condition, "stop process")
		err = app.pb.StopErrorProcess(processRecordId, err)
		if err != nil {
			app.logDebugProcess(event, condition, "error stop process")
		}
	}
}

func (app *application) processCondition(vmContext *VMContext, processRecordId string, event *model.EventReceived, condition *model.TriggerCondition) {
	if shareds, err := app.pb.GetSharedByPath(condition.Expand.Trigger.OrganizationId, condition.Expand.Trigger.Name); err == nil {
		for _, s := range shareds {
			if _, err := vmContext.vm.RunString(s.Code); err != nil {
				app.logger.Debug(
					"error executing shared",
					slog.String("organization", event.OrganizationId),
					slog.Group("event",
						slog.String("id", event.Id),
						slog.String("name", event.Name),
					),
					slog.Group("trigger",
						slog.String("id", condition.Expand.Trigger.Id),
						slog.String("name", condition.Expand.Trigger.Name),
					),
					slog.Group("condition",
						slog.String("id", condition.Id),
						slog.String("name", condition.Name),
					),
					slog.Group("shared",
						slog.String("id", s.Id),
						slog.String("name", s.Name),
					),
				)
			}
		}
	}

	value, err := vmContext.vm.RunString(condition.Code)
	if err != nil {
		app.logDebugProcess(event, condition, "stop condition process")

		err = app.pb.StopErrorProcess(processRecordId, err)
		if err != nil {
			app.logDebugProcess(event, condition, "error stop condition process")
		}
		return
	}

	if vb := value.ToBoolean(); !vb {
		app.logDebugProcess(event, condition, "stop condition process false")

		err = app.pb.StopProcess(processRecordId)
		if err != nil {
			app.logDebugProcess(event, condition, "error stop condition process false")
		}

		return
	}

	app.processReaction(vmContext, processRecordId, event, condition)
}

func (app *application) processReaction(vmContext *VMContext, processRecordId string, event *model.EventReceived, condition *model.TriggerCondition) {
	moduleObj := vmContext.vm.NewObject()

	_ = moduleObj.Set("request", vmContext.vmModuleNameRequestCall)
	_ = moduleObj.Set("notify", vmContext.vmModuleNameNotifyCall)
	_ = vmContext.vm.Set("module", moduleObj)

	storageObj := vmContext.vm.NewObject()

	_ = storageObj.Set("set", vmContext.vmStorageSet)
	_ = storageObj.Set("get", vmContext.vmStorageGet)

	_ = vmContext.vm.Set("storage", storageObj)

	trimTriggerChannel := strings.Trim(condition.Expand.Trigger.Channel, " \t\n")

	if trimTriggerChannel != "" {
		v, exist := app.channels[trimTriggerChannel]
		if !exist {
			app.channelsMu.Lock()
			defer app.channelsMu.Unlock()

			v = &sync.Mutex{}
			app.channels[trimTriggerChannel] = v
		}
		app.logDebugProcess(event, condition, "lock channel")
		v.Lock()
	}

	_ = vmContext.vm.Set("log", vmContext.vmLog)
	_ = vmContext.vm.Set("sleep", vmContext.vmSleep)

	if _, err := vmContext.vm.RunString(condition.Expand.Trigger.Code); err != nil {
		app.logDebugProcess(event, condition, "error execute trigger")

		err = app.pb.StopErrorExecutedProcess(processRecordId, err)
		if err != nil {
			app.logDebugProcess(event, condition, "error error execute trigger")
		}
	} else {
		app.logDebugProcess(event, condition, "stop process")
		err = app.pb.StopExecutedProcess(processRecordId)
		if err != nil {
			app.logDebugProcess(event, condition, "error stop process")
		}
	}

	if trimTriggerChannel != "" {
		v := app.channels[trimTriggerChannel]
		v.Unlock()
	}
}
