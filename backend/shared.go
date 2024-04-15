package main

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/models"
	"strings"
)

type ExportShared struct {
	Entity string `json:"entity"`
	Code   string `json:"code"`
	Name   string `json:"name"`
}

func (app *application) getSharedByPath(organizationId string, path string) ([]*models.Record, error) {
	validatePath := func(path string) string {
		keywords := strings.Split(path, "/")
		if keywords[len(keywords)-1] != "/" {
			keywords = keywords[:len(keywords)-1]
		}

		res := make([]string, len(keywords))

		for i := range keywords {
			wantedKeywords := keywords[:(i + 1)]
			res[i] = "(name ~ \"" + strings.Join(wantedKeywords, "/") + "/%\" && name !~ \"" + strings.Join(wantedKeywords, "/") + "/%/%\" )"
		}
		return "(" + strings.Join(res, " || ") + ")"
	}

	records, err := app.pb.Dao().FindRecordsByFilter(
		"shareds",
		"organization = {:organization} && "+validatePath(path),
		"-created",
		500,
		0,
		dbx.Params{"organization": organizationId},
	)

	return records, err
}

func (app *application) CreateSharedFromExport(organizationId, path string, export ExportShared) error {
	collectionShared, err := app.pb.Dao().FindCollectionByNameOrId("shareds")
	if err != nil {
		return err
	}

	record := models.NewRecord(collectionShared)

	record.Set("organization", organizationId)
	record.Set("name", RemoveLastChar(path)+export.Name)
	record.Set("code", export.Code)

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return err
	}

	return nil
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
