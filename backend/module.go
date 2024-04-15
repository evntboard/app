package main

import (
	"errors"
	"github.com/google/uuid"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/models"
)

func (app *application) GetModuleByCodeNameToken(code, name, token string) (*models.Record, error) {
	return app.pb.Dao().FindFirstRecordByFilter(
		"modules",
		"code = {:code} && name = {:name} && token = {:token}",
		dbx.Params{
			"code":  code,
			"name":  name,
			"token": token,
		},
	)
}

func (app *application) GetModuleByOrganizationIdAndNameOrCode(organizationId, nameOrCode string) (*models.Record, error) {
	record, err := app.pb.Dao().FindFirstRecordByFilter(
		"modules",
		"organization = {:organizationId} && (name = {:nameOrCode} || code = {:nameOrCode})",
		dbx.Params{
			"organizationId": organizationId,
			"nameOrCode":     nameOrCode,
		},
	)
	if err != nil {
		return nil, err
	}
	return record, nil
}

func (app *application) CreateModuleSession(moduleId string) (*models.Record, error) {
	record, err := app.pb.Dao().FindRecordById("modules", moduleId)

	if err != nil {
		return nil, err
	}

	if record == nil {
		return nil, errors.New("not found module")
	}

	record.Set("session", uuid.NewString())

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return nil, err
	}

	return record, nil
}

func (app *application) ResetModuleSessionByID(moduleId string) error {
	record, err := app.pb.Dao().FindRecordById("modules", moduleId)

	if err != nil {
		return err
	}

	record.Set("session", nil)

	if err := app.pb.Dao().SaveRecord(record); err != nil {
		return err
	}

	return nil
}

func (app *application) ResetAllModuleSession() error {
	records, err := app.pb.Dao().FindRecordsByExpr("modules")
	if err != nil {
		return err
	}

	for _, record := range records {
		record.Set("session", nil)
		if err := app.pb.Dao().SaveRecord(record); err != nil {
			return err
		}
	}

	return nil
}

func (app *application) GetModuleParamsById(moduleId string) ([]*models.Record, error) {
	return app.pb.Dao().FindRecordsByFilter(
		"module_params",
		"module = {:moduleId}",
		"-created",
		100,
		0,
		dbx.Params{"moduleId": moduleId},
	)
}
