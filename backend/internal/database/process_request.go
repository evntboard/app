package database

import (
	"encoding/json"
	"time"
)

func (app *PocketBaseClient) CreateProcessRequest(proccesId string, moduleId string, method string, params any, isNotification bool) (string, error) {
	create, err := app.pb.Create(
		"event_process_requests",
		map[string]any{
			"event_process": proccesId,
			"module":        moduleId,
			"method":        method,
			"params":        params,
			"notification":  isNotification,
			"request_date":  time.Now().Format(time.RFC3339Nano),
		})
	if err != nil {
		return "", err
	}

	return create.ID, err
}

func (app *PocketBaseClient) UpdateErrorProcessRequest(processRequestRecordId string, error json.RawMessage) error {
	err := app.pb.Update(
		"event_process_requests",
		processRequestRecordId,
		map[string]any{
			"error":         error,
			"response_date": time.Now().Format(time.RFC3339Nano),
		},
	)
	if err != nil {
		return err
	}

	return nil
}

func (app *PocketBaseClient) UpdateSuccessProcessRequest(processRequestRecordId string, result json.RawMessage) error {
	err := app.pb.Update(
		"event_process_requests",
		processRequestRecordId,
		map[string]any{
			"result":        result,
			"response_date": time.Now().Format(time.RFC3339Nano),
		},
	)
	if err != nil {
		return err
	}

	return nil
}
