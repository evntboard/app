package main

import (
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/daos"
	"github.com/pocketbase/pocketbase/models"
	"strings"
)

func (app *application) getTree(c echo.Context) error {
	organizationId := c.PathParam("organizationId")
	info := apis.RequestInfo(c)

	path := "/"
	if value, exists := info.Query["path"]; exists {
		path = value.(string)
	}

	// verify if user can access this organization
	record, err := app.pb.Dao().FindFirstRecordByFilter(
		"user_organization",
		"user.id = {:userId} && organization.id = {:organizationId} && role != null",
		dbx.Params{
			"userId":         info.AuthRecord.Id,
			"organizationId": organizationId,
		},
	)

	if err != nil || record == nil {
		return apis.NewApiError(401, "you can't access to this organization", nil)
	}

	triggerRecords, err := app.pb.Dao().FindRecordsByFilter(
		"triggers",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	conditionsRecords, err := app.pb.Dao().FindRecordsByFilter(
		"trigger_conditions",
		"trigger.organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"organizationId": organizationId,
		},
	)

	sharedRecords, err := app.pb.Dao().FindRecordsByFilter(
		"shareds",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	return c.JSON(200, app.generateTree(path, triggerRecords, conditionsRecords, sharedRecords))
}

func (app *application) deleteTree(c echo.Context) error {
	organizationId := c.PathParam("organizationId")
	info := apis.RequestInfo(c)

	path := "/"
	if value, exists := info.Query["path"]; exists {
		path = value.(string)
	}

	// verify if user can access this organization
	record, err := app.pb.Dao().FindFirstRecordByFilter(
		"user_organization",
		"user.id = {:userId} && organization.id = {:organizationId} && role != null",
		dbx.Params{
			"userId":         info.AuthRecord.Id,
			"organizationId": organizationId,
		},
	)

	if err != nil || record == nil {
		return apis.NewApiError(401, "you can't access to this organization", nil)
	}

	triggerRecords, err := app.pb.Dao().FindRecordsByFilter(
		"triggers",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	sharedRecords, err := app.pb.Dao().FindRecordsByFilter(
		"shareds",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	err = app.pb.Dao().RunInTransaction(func(txDao *daos.Dao) error {
		for _, sharedRecord := range sharedRecords {
			if err := txDao.DeleteRecord(sharedRecord); err != nil {
				return err
			}
		}

		for _, triggerRecord := range triggerRecords {
			if err := txDao.DeleteRecord(triggerRecord); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return apis.NewApiError(500, "An error occurs ...", err)
	}

	return c.JSON(200, map[string]any{"OK": true})
}

func (app *application) disableTree(c echo.Context) error {
	organizationId := c.PathParam("organizationId")
	info := apis.RequestInfo(c)

	path := "/"
	if value, exists := info.Query["path"]; exists {
		path = value.(string)
	}

	// verify if user can access this organization
	record, err := app.pb.Dao().FindFirstRecordByFilter(
		"user_organization",
		"user.id = {:userId} && organization.id = {:organizationId} && role != null",
		dbx.Params{
			"userId":         info.AuthRecord.Id,
			"organizationId": organizationId,
		},
	)

	if err != nil || record == nil {
		return apis.NewApiError(401, "you can't access to this organization", nil)
	}

	triggerRecords, err := app.pb.Dao().FindRecordsByFilter(
		"triggers",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	sharedRecords, err := app.pb.Dao().FindRecordsByFilter(
		"shareds",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	err = app.pb.Dao().RunInTransaction(func(txDao *daos.Dao) error {
		for _, sharedRecord := range sharedRecords {
			sharedRecord.Set("enable", false)
			if err := txDao.SaveRecord(sharedRecord); err != nil {
				return err
			}
		}

		for _, triggerRecord := range triggerRecords {
			triggerRecord.Set("enable", false)
			if err := txDao.SaveRecord(triggerRecord); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return apis.NewApiError(500, "An error occurs ...", err)
	}

	return c.JSON(200, map[string]any{"OK": true})
}

func (app *application) enableTree(c echo.Context) error {
	organizationId := c.PathParam("organizationId")
	info := apis.RequestInfo(c)

	path := "/"
	if value, exists := info.Query["path"]; exists {
		path = value.(string)
	}

	// verify if user can access this organization
	record, err := app.pb.Dao().FindFirstRecordByFilter(
		"user_organization",
		"user.id = {:userId} && organization.id = {:organizationId} && role != null",
		dbx.Params{
			"userId":         info.AuthRecord.Id,
			"organizationId": organizationId,
		},
	)

	if err != nil || record == nil {
		return apis.NewApiError(401, "you can't access to this organization", nil)
	}

	triggerRecords, err := app.pb.Dao().FindRecordsByFilter(
		"triggers",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	sharedRecords, err := app.pb.Dao().FindRecordsByFilter(
		"shareds",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	err = app.pb.Dao().RunInTransaction(func(txDao *daos.Dao) error {
		for _, sharedRecord := range sharedRecords {
			sharedRecord.Set("enable", true)
			if err := txDao.SaveRecord(sharedRecord); err != nil {
				return err
			}
		}

		for _, triggerRecord := range triggerRecords {
			triggerRecord.Set("enable", true)
			if err := txDao.SaveRecord(triggerRecord); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return apis.NewApiError(500, "An error occurs ...", err)
	}

	return c.JSON(200, map[string]any{"OK": true})
}

func (app *application) duplicateTree(c echo.Context) error {
	organizationId := c.PathParam("organizationId")
	info := apis.RequestInfo(c)

	path := "/"
	if value, exists := info.Query["path"]; exists {
		path = value.(string)
	}

	targetPath := "/dup/"
	if value, exists := info.Query["target-path"]; exists {
		targetPath = value.(string)
	}

	// verify if user can access this organization
	record, err := app.pb.Dao().FindFirstRecordByFilter(
		"user_organization",
		"user.id = {:userId} && organization.id = {:organizationId} && role != null",
		dbx.Params{
			"userId":         info.AuthRecord.Id,
			"organizationId": organizationId,
		},
	)

	if err != nil || record == nil {
		return apis.NewApiError(401, "you can't access to this organization", nil)
	}

	triggersCollection, err := app.pb.Dao().FindCollectionByNameOrId("triggers")
	if err != nil {
		return err
	}

	triggerConditionsCollection, err := app.pb.Dao().FindCollectionByNameOrId("trigger_conditions")
	if err != nil {
		return err
	}

	triggerRecords, err := app.pb.Dao().FindRecordsByFilter(
		"triggers",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	sharedsCollection, err := app.pb.Dao().FindCollectionByNameOrId("shareds")
	if err != nil {
		return err
	}

	sharedRecords, err := app.pb.Dao().FindRecordsByFilter(
		"shareds",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	err = app.pb.Dao().RunInTransaction(func(txDao *daos.Dao) error {
		for _, sharedRecord := range sharedRecords {
			newSharedRecord := models.NewRecord(sharedsCollection)
			newSharedRecord.Set("organization", sharedRecord.GetString("organization"))
			newSharedRecord.Set("name", strings.Replace(sharedRecord.GetString("name"), path, targetPath, 1))
			newSharedRecord.Set("code", sharedRecord.GetString("code"))
			newSharedRecord.Set("enable", false)
			if err := txDao.SaveRecord(newSharedRecord); err != nil {
				return err
			}
		}

		for _, triggerRecord := range triggerRecords {
			newTriggerRecord := models.NewRecord(triggersCollection)
			newTriggerRecord.Set("organization", triggerRecord.GetString("organization"))
			newTriggerRecord.Set("name", strings.Replace(triggerRecord.GetString("name"), path, targetPath, 1))
			newTriggerRecord.Set("code", triggerRecord.GetString("code"))
			newTriggerRecord.Set("channel", triggerRecord.GetString("channel"))
			newTriggerRecord.Set("enable", false)
			if err := txDao.SaveRecord(newTriggerRecord); err != nil {
				return err
			}

			// now duplicate all conditions
			triggerConditionRecords, err := txDao.FindRecordsByFilter(
				"trigger_conditions",
				"trigger.id = {:triggerId}",
				"-created",
				500,
				0,
				dbx.Params{
					"triggerId": triggerRecord.Id,
				},
			)

			if err != nil {
				return err
			}

			for _, conditionRecord := range triggerConditionRecords {
				newConditionRecord := models.NewRecord(triggerConditionsCollection)

				newConditionRecord.Set("trigger", newTriggerRecord.Id)
				newConditionRecord.Set("name", conditionRecord.GetString("name"))
				newConditionRecord.Set("code", conditionRecord.GetString("code"))
				newConditionRecord.Set("enable", conditionRecord.GetString("enable"))
				newConditionRecord.Set("timeout", conditionRecord.GetString("timeout"))
				newConditionRecord.Set("type", conditionRecord.GetString("type"))

				if err := txDao.SaveRecord(newConditionRecord); err != nil {
					return err
				}
			}
		}

		return nil
	})
	if err != nil {
		return apis.NewApiError(500, "An error occurs ...", err)
	}

	return c.JSON(200, map[string]any{"OK": true})
}

func (app *application) moveTree(c echo.Context) error {
	organizationId := c.PathParam("organizationId")
	info := apis.RequestInfo(c)

	path := "/"
	if value, exists := info.Query["path"]; exists {
		path = value.(string)
	}

	targetPath := "/dup/"
	if value, exists := info.Query["target-path"]; exists {
		targetPath = value.(string)
	}

	// verify if user can access this organization
	record, err := app.pb.Dao().FindFirstRecordByFilter(
		"user_organization",
		"user.id = {:userId} && organization.id = {:organizationId} && role != null",
		dbx.Params{
			"userId":         info.AuthRecord.Id,
			"organizationId": organizationId,
		},
	)

	if err != nil || record == nil {
		return apis.NewApiError(401, "you can't access to this organization", nil)
	}

	triggerRecords, err := app.pb.Dao().FindRecordsByFilter(
		"triggers",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	sharedRecords, err := app.pb.Dao().FindRecordsByFilter(
		"shareds",
		"name ~ {:path} && organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	err = app.pb.Dao().RunInTransaction(func(txDao *daos.Dao) error {
		for _, sharedRecord := range sharedRecords {
			sharedRecord.Set("name", strings.Replace(sharedRecord.GetString("name"), path, targetPath, 1))
			if err := txDao.SaveRecord(sharedRecord); err != nil {
				return err
			}
		}

		for _, triggerRecord := range triggerRecords {
			triggerRecord.Set("name", strings.Replace(triggerRecord.GetString("name"), path, targetPath, 1))
			if err := txDao.SaveRecord(triggerRecord); err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		return apis.NewApiError(500, "An error occurs ...", err)
	}

	return c.JSON(200, map[string]any{"OK": true})
}
