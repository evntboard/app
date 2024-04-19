package main

import (
	"encoding/json"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"time"
)

type EventName struct {
	Name string `db:"name" json:"name"`
}

func (app *application) CreateEvent(organizationID string, name string, payload json.RawMessage, emitterCode, emitterName string) (*models.Record, error) {
	collection, err := app.pb.Dao().FindCollectionByNameOrId("events")
	if err != nil {
		return nil, err
	}

	record := models.NewRecord(collection)

	record.Set("organization", organizationID)
	record.Set("name", name)
	record.Set("payload", payload)
	record.Set("emitter_code", emitterCode)
	record.Set("emitter_name", emitterName)
	record.Set("emitted_at", time.Now().Format(time.RFC3339Nano))

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return nil, err
	}

	return record, nil
}

func (app *application) GetAvailableEventNames(organizationId string) ([]*EventName, error) {
	var eventsNames []*EventName

	err := app.pb.Dao().DB().
		Select(
			"name",
		).
		Distinct(true).
		From("events").
		Where(dbx.HashExp{
			"organization": organizationId,
		}).
		All(&eventsNames)
	return eventsNames, err
}

func (app *application) onCreateEvent(e *core.ModelEvent) error {
	record, _ := e.Model.(*models.Record)
	msgJson, err := record.MarshalJSON()
	if err != nil {
		return err
	}

	if err := app.realtime.Publish("events", msgJson); err != nil {
		return err
	}
	return nil
}
