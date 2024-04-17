package main

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/models"
)

func (app *application) GetModulesWithSessionByOrganizationIdAndStorageKey(organizationId string, storageKey string) ([]*models.Record, error) {
	return app.pb.Dao().FindRecordsByFilter(
		"modules",
		"session != \"\" && organization = {:organizationId} && sub ~ {:storageKey}",
		"-created",
		100,
		0,
		dbx.Params{
			"organizationId": organizationId,
			"storageKey":     storageKey,
		},
	)
}

func (app *application) GetModuleByOrganizationIdAndModuleId(organizationId string, moduleId string) (*models.Record, error) {
	resp, err := app.pb.Dao().FindFirstRecordByFilter(
		"modules",
		"session != \"\" && organization = {:organizationId} && id = {:moduleId}",
		dbx.Params{
			"organizationId": organizationId,
			"moduleId":       moduleId,
		},
	)

	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (app *application) ResetModuleSession(moduleId string) error {
	record, err := app.pb.Dao().FindFirstRecordByFilter(
		"modules",
		"id = {:moduleId}",
		dbx.Params{
			"moduleId": moduleId,
		},
	)

	if err != nil {
		return err
	}

	record.Set("session", "")

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return err
	}
	return nil
}
