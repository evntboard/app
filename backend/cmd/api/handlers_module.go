package main

import (
	"encoding/json"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"time"
)

func (app *application) deleteEjectModule(c echo.Context) error {
	organizationId := c.PathParam("organizationId")
	moduleId := c.PathParam("moduleId")
	info := apis.RequestInfo(c)

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

	module, err := app.GetModuleByOrganizationIdAndModuleId(organizationId, moduleId)

	msgJson, err := json.Marshal(map[string]any{
		"type":   "module",
		"action": "eject",
	})
	if err != nil || module == nil {
		return apis.NewApiError(404, "no module found ...", nil)
	}

	_, err = app.realtime.Request(app.realtime.GetChannelForModule(module.GetString("session")), msgJson, time.Second*3)

	// module is not connect but session is set
	if err != nil {
		if err := app.ResetModuleSession(moduleId); err != nil {
			return apis.NewApiError(500, "can't reset module session ...", nil)
		}
	}

	return c.JSON(200, nil)
}
