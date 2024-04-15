package main

import (
	"github.com/pocketbase/pocketbase/models"
)

func (app *application) CreateProcessLog(processId string, log any) (*models.Record, error) {
	collection, err := app.pb.Dao().FindCollectionByNameOrId("event_process_logs")
	if err != nil {
		return nil, err
	}

	record := models.NewRecord(collection)

	record.Set("event_process", processId)
	record.Set("log", log)

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return nil, err
	}

	return record, nil
}
