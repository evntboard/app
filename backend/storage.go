package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/models"
)

func (app *application) GetStorageByKey(organizationId string, key string) (*models.Record, error) {
	return app.pb.Dao().FindFirstRecordByFilter(
		"storages",
		"organization = {:organizationId} && key = {:key}",
		dbx.Params{
			"organizationId": organizationId,
			"key":            key,
		},
	)
}

func (app *application) SetStorageByKey(organizationId string, key string, value any) (*models.Record, error) {
	valueJSON, err := json.Marshal(value)
	if err != nil {
		return nil, err
	}

	// check if key already exists
	record, err := app.pb.Dao().FindFirstRecordByFilter(
		"storages",
		"organization = {:organizationId} && key = {:key}",
		dbx.Params{
			"organizationId": organizationId,
			"key":            key,
		},
	)

	if record == nil || errors.Is(err, sql.ErrNoRows) {
		collection, err := app.pb.Dao().FindCollectionByNameOrId("storages")
		if err != nil {
			return nil, err
		}

		record = models.NewRecord(collection)
		record.Set("organization", organizationId)
		record.Set("key", key)
		record.Set("value", valueJSON)
	} else {
		record.Set("value", valueJSON)
	}

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return nil, err
	}

	return record, nil
}
