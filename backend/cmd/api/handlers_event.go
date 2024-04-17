package main

import (
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"slices"
)

func (app *application) getAvailableEventNames(c echo.Context) error {
	organizationId := c.PathParam("organizationId")
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

	eventsNames, err := app.GetAvailableEventNames(organizationId)

	if err != nil {
		return apis.NewApiError(400, "error when trying to get event names ...", nil)
	}

	conditionNames, err := app.GetAvailableConditionNames(organizationId)

	if err != nil {
		return apis.NewApiError(400, "error when trying to get conditions names ...", nil)
	}

	var names = make([]string, 0)

	for _, event := range eventsNames {
		if !slices.Contains(names, event.Name) {
			names = append(names, event.Name)
		}
	}

	for _, condition := range conditionNames {
		if !slices.Contains(names, condition.Name) {
			names = append(names, condition.Name)
		}
	}

	return c.JSON(200, names)
}
