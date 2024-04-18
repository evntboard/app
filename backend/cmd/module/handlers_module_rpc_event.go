package main

import (
	"context"
	"encoding/json"
	"github.com/evntboard/app/backend/internal/model"
	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/sourcegraph/jsonrpc2"
	"time"
)

type InputNewEventData struct {
	Name    string          `json:"name"`
	Payload json.RawMessage `json:"payload"`
}

func (a InputNewEventData) Validate() error {
	return validation.ValidateStruct(
		&a,
		validation.Field(&a.Name, validation.Required, validation.Length(3, 100)),
		validation.Field(&a.Payload, validation.Required),
	)
}

func (h *rpcMethodHandler) eventNew(ctx context.Context, c *jsonrpc2.Conn, r *jsonrpc2.Request) {
	session := h.app.GetSession(c)

	if session == nil {
		if !r.Notif {
			_ = c.ReplyWithError(
				ctx,
				r.ID,
				&jsonrpc2.Error{
					Code:    jsonrpc2.CodeInvalidRequest,
					Message: "Authentication needed",
				},
			)
		}
		return
	}

	var data InputNewEventData

	if err := json.Unmarshal(*r.Params, &data); err != nil {
		if !r.Notif {
			_ = c.ReplyWithError(
				ctx,
				r.ID,
				&jsonrpc2.Error{
					Code:    jsonrpc2.CodeInternalError,
					Message: "Error when unmarshal params",
				},
			)
		}
		return
	}

	if err := data.Validate(); err != nil {
		if !r.Notif {
			_ = c.ReplyWithError(
				ctx,
				r.ID,
				&jsonrpc2.Error{
					Code:    jsonrpc2.CodeInternalError,
					Message: "Error on params format " + err.Error(),
				},
			)
		}
		return
	}

	created, err := h.app.pb.CreateEvent(
		model.Event{
			OrganizationId: session.Module.OrganizationId,
			Name:           data.Name,
			Payload:        data.Payload,
			EmitterCode:    session.Module.Code,
			EmitterName:    session.Module.Name,
			EmittedAt:      time.Now().Format(time.RFC3339Nano),
		},
	)

	if err != nil {
		if !r.Notif {
			_ = c.ReplyWithError(
				ctx,
				r.ID,
				&jsonrpc2.Error{
					Code:    jsonrpc2.CodeInternalError,
					Message: "Error creating event",
				},
			)
		}
		return
	}

	if !r.Notif {
		_ = c.Reply(ctx, r.ID, created)
	}
}
