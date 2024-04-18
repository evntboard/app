package main

import (
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"net/http"
	"strings"
)

func (app *application) getExport(c echo.Context) error {
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

	if strings.HasSuffix(path, "/") {
		triggerRecords, _ := app.pb.Dao().FindRecordsByFilter(
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

		conditionsRecords, _ := app.pb.Dao().FindRecordsByFilter(
			"trigger_conditions",
			"trigger.organization.id = {:organizationId}",
			"-created",
			500,
			0,
			dbx.Params{
				"organizationId": organizationId,
			},
		)

		sharedRecords, _ := app.pb.Dao().FindRecordsByFilter(
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

		datas := make([]any, 0)

		for _, triggerRecord := range triggerRecords {
			triggerExport := ExportTrigger{
				Entity:     "trigger",
				Code:       triggerRecord.GetString("code"),
				Name:       triggerRecord.GetString("name"),
				Channel:    triggerRecord.GetString("channel"),
				Conditions: make([]ExportTriggerCondition, 0),
			}

			for _, cRecord := range conditionsRecords {
				if cRecord.GetString("trigger") == triggerRecord.Id {
					triggerExport.Conditions = append(triggerExport.Conditions, ExportTriggerCondition{
						Code:    cRecord.GetString("code"),
						Name:    cRecord.GetString("name"),
						Type:    cRecord.GetString("type"),
						Timeout: int32(cRecord.GetInt("timeout")),
					})
				}
			}
			datas = append(datas, triggerExport)
		}

		for _, sharedRecord := range sharedRecords {
			datas = append(datas, ExportShared{
				Entity: "shared",
				Code:   sharedRecord.GetString("code"),
				Name:   sharedRecord.GetString("name"),
			})
		}

		return c.JSON(http.StatusOK, datas)
	}

	// search if path is a trigger or a shared
	triggerRecord, _ := app.pb.Dao().FindFirstRecordByFilter(
		"triggers",
		"name ~ {:path} && organization.id = {:organizationId}",
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	conditionsRecords, _ := app.pb.Dao().FindRecordsByFilter(
		"trigger_conditions",
		"trigger.id = {:triggerId} && trigger.organization.id = {:organizationId}",
		"-created",
		500,
		0,
		dbx.Params{
			"organizationId": organizationId,
			"triggerId":      triggerRecord.Id,
		},
	)

	sharedRecord, _ := app.pb.Dao().FindFirstRecordByFilter(
		"shareds",
		"name ~ {:path} && organization.id = {:organizationId}",
		dbx.Params{
			"path":           path,
			"organizationId": organizationId,
		},
	)

	datas := make([]any, 0)

	if triggerRecord != nil {
		triggerExport := ExportTrigger{
			Entity:     "trigger",
			Code:       triggerRecord.GetString("code"),
			Name:       triggerRecord.GetString("name"),
			Channel:    triggerRecord.GetString("channel"),
			Conditions: make([]ExportTriggerCondition, 0),
		}

		for _, cRecord := range conditionsRecords {
			triggerExport.Conditions = append(triggerExport.Conditions, ExportTriggerCondition{
				Code:    cRecord.GetString("code"),
				Name:    cRecord.GetString("name"),
				Type:    cRecord.GetString("type"),
				Timeout: int32(cRecord.GetInt("timeout")),
			})
		}

		datas = append(datas, triggerExport)
	}

	if sharedRecord != nil {
		datas = append(datas, ExportTrigger{
			Entity: "shared",
			Code:   sharedRecord.GetString("code"),
			Name:   sharedRecord.GetString("name"),
		})
	}

	return c.JSON(http.StatusOK, datas)
}
