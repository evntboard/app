package main

import (
	"encoding/json"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
)

func (app *application) onModelStorage(e *core.ModelEvent) error {
	record, _ := e.Model.(*models.Record)

	moduleRecords, err := app.GetModulesWithSessionByOrganizationIdAndStorageKey(
		record.GetString("organization"),
		record.GetString("key"),
	)
	if err != nil {
		return err
	}

	msgJson, err := json.Marshal(map[string]any{
		"type":    "storage",
		"payload": record,
	})
	if err != nil {
		return err
	}

	for _, moduleRecord := range moduleRecords {
		if err := app.realtime.Publish(app.realtime.GetChannelForModule(moduleRecord.GetString("session")), msgJson); err != nil {
			return err
		}
	}

	return nil
}
