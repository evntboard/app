package main

import (
	"context"
	"encoding/json"
	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/sourcegraph/jsonrpc2"
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
	session := h.app.GetModuleSession(c)

	if session == nil {
		if !r.Notif {
			err := &jsonrpc2.Error{Code: jsonrpc2.CodeInvalidRequest, Message: "Authentication needed"}
			if err := c.ReplyWithError(ctx, r.ID, err); err != nil {
				h.app.pb.Logger().Error(err.Error())
			}
		}
		return
	}

	var data InputNewEventData

	err := json.Unmarshal(*r.Params, &data)
	if err != nil {
		errorData := jsonrpc2.Error{
			Code:    jsonrpc2.CodeInternalError,
			Message: "Error when unmarshal params",
		}
		if err := c.ReplyWithError(ctx, r.ID, &errorData); err != nil {
			h.app.pb.Logger().Error(err.Error())
			return
		}
	}

	if err := data.Validate(); err != nil {
		if !r.Notif {
			errorData := jsonrpc2.Error{
				Code:    jsonrpc2.CodeInternalError,
				Message: err.Error(),
			}
			if err := c.ReplyWithError(ctx, r.ID, &errorData); err != nil {
				h.app.pb.Logger().Error(err.Error())
			}
		}
		return
	}

	createdEvent, err := h.app.CreateEvent(
		session.GetString("organization"),
		data.Name,
		data.Payload,
		session.GetString("code"),
		session.GetString("name"),
	)

	if err != nil {
		if !r.Notif {
			errorData := jsonrpc2.Error{
				Code:    jsonrpc2.CodeInternalError,
				Message: err.Error(),
			}
			if err := c.ReplyWithError(ctx, r.ID, &errorData); err != nil {
				h.app.pb.Logger().Error(err.Error())
			}
		}
		return
	}

	if !r.Notif {
		if err := c.Reply(ctx, r.ID, createdEvent); err != nil {
			h.app.pb.Logger().Error(err.Error())
		}
	}
}
