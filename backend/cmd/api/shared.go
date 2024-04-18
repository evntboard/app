package main

import (
	"github.com/evntboard/app/backend/utils"
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
