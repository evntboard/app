package main

import (
	"encoding/json"
	"github.com/pocketbase/pocketbase/models"
	"time"
)

func (app *application) CreateProcessRequest(proccesId string, moduleId string, method string, params any, isNotification bool) (*models.Record, error) {
	collection, err := app.pb.Dao().FindCollectionByNameOrId("event_process_requests")
	if err != nil {
		return nil, err
	}

	processRequestRecord := models.NewRecord(collection)

	processRequestRecord.Set("event_process", proccesId)
	processRequestRecord.Set("module", moduleId)
	processRequestRecord.Set("method", method)
	processRequestRecord.Set("params", params)
	processRequestRecord.Set("notification", isNotification)
	processRequestRecord.Set("request_date", time.Now().Format(time.RFC3339Nano))

	if err := app.pb.Dao().SaveRecord(processRequestRecord); err != nil {
		return nil, err
	}

	return processRequestRecord, nil
}

func (app *application) UpdateErrorProcessRequest(processRequestRecord *models.Record, error json.RawMessage) (*models.Record, error) {
	processRequestRecord.Set("error", error)
	processRequestRecord.Set("response_date", time.Now().Format(time.RFC3339Nano))

	if err := app.pb.Dao().SaveRecord(processRequestRecord); err != nil {
		return nil, err
	}

	return processRequestRecord, nil
}

func (app *application) UpdateSuccessProcessRequest(processRequestRecord *models.Record, result json.RawMessage) (*models.Record, error) {
	processRequestRecord.Set("result", result)
	processRequestRecord.Set("response_date", time.Now().Format(time.RFC3339Nano))

	if err := app.pb.Dao().SaveRecord(processRequestRecord); err != nil {
		return nil, err
	}

	return processRequestRecord, nil
}
