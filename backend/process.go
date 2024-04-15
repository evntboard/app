package main

import (
	"github.com/pocketbase/pocketbase/models"
	"time"
)

func (app *application) CreateProcess(OrganizationID string, eventID string, triggerID string) (*models.Record, error) {
	collection, err := app.pb.Dao().FindCollectionByNameOrId("event_processes")
	if err != nil {
		return nil, err
	}

	processRecord := models.NewRecord(collection)

	processRecord.Set("organization", OrganizationID)
	processRecord.Set("event", eventID)
	processRecord.Set("trigger", triggerID)
	processRecord.Set("executed", false)
	processRecord.Set("start_at", time.Now().Format(time.RFC3339Nano))

	if err := app.pb.Dao().SaveRecord(processRecord); err != nil {
		return nil, err
	}

	return processRecord, err
}

func (app *application) StopProcess(record *models.Record) (*models.Record, error) {
	record.Set("end_at", time.Now().Format(time.RFC3339Nano))

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return nil, err
	}

	return record, nil
}

func (app *application) StopErrorProcess(record *models.Record, err error) (*models.Record, error) {
	record.Set("end_at", time.Now().Format(time.RFC3339Nano))
	record.Set("error", err.Error())

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return nil, err
	}

	return record, nil
}

func (app *application) StopExecutedProcess(record *models.Record) (*models.Record, error) {
	record.Set("end_at", time.Now().Format(time.RFC3339Nano))
	record.Set("executed", true)

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return nil, err
	}

	return record, nil
}

func (app *application) StopErrorExecutedProcess(record *models.Record, err error) (*models.Record, error) {
	record.Set("end_at", time.Now().Format(time.RFC3339Nano))
	record.Set("error", err.Error())
	record.Set("executed", true)

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return nil, err
	}

	return record, nil
}
