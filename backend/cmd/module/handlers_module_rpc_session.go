package main

import (
	"context"
	"encoding/json"
	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/sourcegraph/jsonrpc2"
)

type InputSessionRegisterData struct {
	Code  string `json:"code"`
	Name  string `json:"name"`
	Token string `json:"token"`
}

func (a InputSessionRegisterData) Validate() error {
	return validation.ValidateStruct(
		&a,
		validation.Field(&a.Code, validation.Required),
		validation.Field(&a.Name, validation.Required),
		validation.Field(&a.Token, validation.Required),
	)
}

func (h *rpcMethodHandler) sessionRegister(ctx context.Context, c *jsonrpc2.Conn, r *jsonrpc2.Request) {
	var data InputSessionRegisterData

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

	// check if module exist
	module, err := h.app.pb.GetModuleByCodeNameToken(data.Code, data.Name, data.Token)

	if err != nil || module == nil || module.SessionId != "" {
		if !r.Notif {
			_ = c.ReplyWithError(
				ctx,
				r.ID,
				&jsonrpc2.Error{
					Code:    jsonrpc2.CodeInternalError,
					Message: "Module doesn't exist or is already connected",
				},
			)
		}
		_ = c.Close()
		return
	}
	if err := h.app.AddSession(c, module); err != nil {
		if !r.Notif {
			_ = c.ReplyWithError(
				ctx,
				r.ID,
				&jsonrpc2.Error{
					Code:    jsonrpc2.CodeInternalError,
					Message: "Error creating module session",
				},
			)
		}
		_ = c.Close()
		return
	}
	if !r.Notif {
		_ = c.Reply(ctx, r.ID, module.Expand.Params)
	}
}
