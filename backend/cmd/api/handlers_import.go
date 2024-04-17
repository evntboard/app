package main

import (
	"encoding/json"
	"fmt"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"io"
	"net/http"
)

func (app *application) postImport(c echo.Context) error {
	organizationId := c.PathParam("organizationId")
	info := apis.RequestInfo(c)

	// verify if user can access this organization
	record, err := app.pb.Dao().FindFirstRecordByFilter(
		"user_organization",
		"user.id ?= {:userId} && organization.id ?= {:organizationId} && role ?= \"CREATOR\"",
		dbx.Params{
			"userId":         info.AuthRecord.Id,
			"organizationId": organizationId,
		},
	)

	if err != nil || record == nil {
		return apis.NewApiError(401, "you can't access to this organization", nil)
	}

	path := c.FormValue("path")
	fileData, err := c.FormFile("file")

	if err != nil || path == "" {
		return apis.NewApiError(500, "body error ...", nil)
	}

	file, err := fileData.Open()
	defer file.Close()

	fileContent, _ := io.ReadAll(file)

	var entities []map[string]any

	if err := json.Unmarshal(fileContent, &entities); err != nil {
		fmt.Println("Error:", err)
	}

	result := make(map[string]any, 0)

	for _, entity := range entities {
		cast, ok := entity["entity"].(string)
		if !ok {
			fmt.Println("Error: missing or invalid entity type")
			continue
		}

		switch cast {
		case "trigger":
			trigger := NewExportTriggerFromAny(entity)
			err := app.CreateTriggerFromExport(
				organizationId,
				path,
				trigger,
			)
			if err != nil {
				result[trigger.Name] = err.Error()
			} else {
				result[trigger.Name] = "OK"
			}
		case "shared":
			shared := NewExportSharedFromAny(entity)
			err := app.CreateSharedFromExport(
				organizationId,
				path,
				shared,
			)
			if err != nil {
				result[shared.Name] = err.Error()
			} else {
				result[shared.Name] = "OK"
			}
		default:
			fmt.Println("Unknown entity type:", cast)
		}
	}

	return c.JSON(http.StatusOK, result)

}
