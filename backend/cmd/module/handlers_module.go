package main

import (
	"encoding/json"
	"github.com/evntboard/app/backend/internal/model"
	"github.com/evntboard/app/backend/internal/response"
	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/sourcegraph/jsonrpc2"
	ws "github.com/sourcegraph/jsonrpc2/websocket"
	"net/http"
	"time"
)

func (app *application) rpc(w http.ResponseWriter, r *http.Request) {
	conn, err := app.upgrader.Upgrade(w, r, nil)
	if err != nil {
		app.serverError(w, r, err)
		return
	}

	client := jsonrpc2.NewConn(r.Context(), ws.NewObjectStream(conn), jsonrpc2.AsyncHandler(newRPCMethodHandler(app)))

	time.AfterFunc(10*time.Second, func() {
		app.logger.Debug("rpc check session")
		currentClientState := app.GetSession(client)

		if currentClientState == nil {
			_ = client.Close()
			app.RemoveSession(client)
			return
		}

		if currentClientState.Module.SessionId == "" {
			_ = client.Close()
			app.RemoveSession(client)
		}
	})

	<-client.DisconnectNotify()
	app.RemoveSession(client)
	app.logger.Info("rpc unknown disconnected")
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

func (app *application) modulePostEvent(w http.ResponseWriter, r *http.Request) {
	var postData InputModulePostRequestData

	if err := json.NewDecoder(r.Body).Decode(&postData); err != nil {
		app.badRequest(w, r, err)
		return
	}

	if err := postData.Validate(); err != nil {
		app.badRequest(w, r, err)
		return
	}

	module, err := app.pb.GetModuleByCodeNameToken(
		postData.Module.Code,
		postData.Module.Name,
		postData.Module.Token,
	)

	if err != nil {
		app.badRequest(w, r, err)
		return
	}

	created, err := app.pb.CreateEvent(
		model.Event{
			OrganizationId: module.OrganizationId,
			Name:           postData.Event.Name,
			Payload:        postData.Event.Payload,
			EmitterCode:    module.Code,
			EmitterName:    module.Name,
			EmittedAt:      time.Now().Format(time.RFC3339Nano),
		},
	)

	if err != nil {
		app.badRequest(w, r, err)
		return
	}

	err = response.JSON(w, http.StatusCreated, created)
	if err != nil {
		app.badRequest(w, r, err)
	}
}
