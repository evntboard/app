package main

import (
	"encoding/json"
	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/labstack/echo/v5"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/sourcegraph/jsonrpc2"
	ws "github.com/sourcegraph/jsonrpc2/websocket"
	"net/http"
	"time"
)

func (app *application) moduleRPC(c echo.Context) error {
	app.upgrader.CheckOrigin = func(r *http.Request) bool { return true }

	app.pb.Logger().Debug("rpc new session")

	conn, err := app.upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		app.pb.Logger().Error(err.Error())
		return err
	}

	client := jsonrpc2.NewConn(c.Request().Context(), ws.NewObjectStream(conn), jsonrpc2.AsyncHandler(newRPCMethodHandler(app)))

	time.AfterFunc(10*time.Second, func() {
		app.pb.Logger().Debug("rpc check session")
		currentClientState := app.GetModuleSession(client)

		if currentClientState == nil {
			_ = client.Close()
			app.RemoveModuleSession(client)
			return
		}

		if currentClientState.GetString("session") == "" {
			_ = client.Close()
			app.RemoveModuleSession(client)
		}
	})

	<-client.DisconnectNotify()
	app.RemoveModuleSession(client)
	app.pb.Logger().Info("rpc session disconnected")

	return nil
}

type InputModulePostRequestData struct {
	Module struct {
		Name  string `json:"name"`
		Code  string `json:"code"`
		Token string `json:"token"`
	} `json:"module"`
	Event struct {
		Name    string          `json:"name"`
		Payload json.RawMessage `json:"payload"`
	} `json:"event"`
}

func (m *InputModulePostRequestData) Validate() error {
	err := validation.ValidateStruct(
		&m.Module,
		validation.Field(&m.Module.Name, validation.Required, validation.Length(4, 100)),
		validation.Field(&m.Module.Code, validation.Required, validation.Length(4, 100)),
		validation.Field(&m.Module.Token, validation.Required),
	)

	if err != nil {
		return err
	}

	err = validation.ValidateStruct(
		&m.Event,
		validation.Field(&m.Event.Name, validation.Required, validation.Length(4, 100)),
		validation.Field(&m.Event.Payload, validation.Required),
	)

	if err != nil {
		return err
	}

	return nil
}

func (app *application) modulePostEvent(c echo.Context) error {
	var postData InputModulePostRequestData

	if err := json.NewDecoder(c.Request().Body).Decode(&postData); err != nil {
		app.pb.Logger().Error(err.Error())
		return err
	}

	if err := postData.Validate(); err != nil {
		app.pb.Logger().Error(err.Error())
		app.pb.Logger().Error("Validation error: ", err)
		return err
	}

	moduleRecord, err := app.pb.Dao().FindFirstRecordByFilter(
		"modules",
		"code = {:code} && name = {:name} && token = {:token}",
		dbx.Params{
			"code":  postData.Module.Code,
			"name":  postData.Module.Name,
			"token": postData.Module.Token,
		},
	)

	if err != nil {
		app.pb.Logger().Error(err.Error())
		return err
	}

	createdEvent, err := app.CreateEvent(
		moduleRecord.GetString("organization"),
		postData.Event.Name,
		postData.Event.Payload,
		moduleRecord.GetString("code"),
		moduleRecord.GetString("name"),
	)

	return c.JSON(http.StatusCreated, createdEvent)
}

func (app *application) moduleEject(c echo.Context) error {
	organizationId := c.PathParam("organizationId")
	moduleId := c.PathParam("moduleId")

	// verify if user can access this module
	moduleRecord, err := app.pb.Dao().FindFirstRecordByFilter(
		"modules",
		"id = {:moduleId} && organization.id = {:organizationId} && session != \"\"",
		dbx.Params{
			"moduleId":       moduleId,
			"organizationId": organizationId,
		},
	)

	if err != nil || moduleRecord == nil {
		return apis.NewApiError(401, "you can't access to this organization", nil)
	}

	con := app.GetModuleSessionBySessionID(organizationId, moduleRecord.GetString("session"))

	if con != nil {
		_ = con.Close()
	}

	return c.JSON(200, map[string]any{"OK": true})
}
