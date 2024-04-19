package main

import (
	"database/sql"
	"errors"
	"github.com/evntboard/app/backend/utils"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
)

type ExportShared struct {
	Entity string `json:"entity"`
	Code   string `json:"code"`
	Name   string `json:"name"`
}

func NewExportSharedFromAny(entity map[string]interface{}) ExportShared {
	var shared ExportShared
	for key, value := range entity {
		switch key {
		case "entity":
			if v, ok := value.(string); ok {
				shared.Entity = v
			}
		case "code":
			if v, ok := value.(string); ok {
				shared.Code = v
			}
		case "name":
			if v, ok := value.(string); ok {
				shared.Name = v
			}
		}
	}
	return shared
}

func (app *application) CreateSharedFromExport(organizationId, path string, export ExportShared) error {
	collectionShared, err := app.pb.Dao().FindCollectionByNameOrId("shareds")
	if err != nil {
		return err
	}

	record := models.NewRecord(collectionShared)

	record.Set("organization", organizationId)
	record.Set("name", utils.RemoveLastChar(path)+export.Name)
	record.Set("code", export.Code)

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return err
	}

	return nil
}

func (app *application) onBeforeCreateShared(e *core.ModelEvent) error {
	record, _ := e.Model.(*models.Record)

	_, err := app.pb.Dao().FindFirstRecordByFilter(
		"triggers",
		"organization = {:organizationId} && name = {:name}",
		dbx.Params{
			"organizationId": record.GetString("organization"),
			"name":           record.GetString("name"),
		},
	)

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}

	return errors.New("a trigger already exists with this name")
}
