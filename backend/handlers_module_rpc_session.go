package main

import (
	"context"
	"encoding/json"
	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/sourcegraph/jsonrpc2"
	"log"
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

	err := json.Unmarshal(*r.Params, &data)
	if err != nil {
		if !r.Notif {
			errorData := jsonrpc2.Error{
				Code:    jsonrpc2.CodeInternalError,
				Message: "Error when unmarshal params",
			}
			if err := c.ReplyWithError(ctx, r.ID, &errorData); err != nil {
				log.Println(err)
				return
			}
		}
		return
	}

	if err := data.Validate(); err != nil {
		if !r.Notif {
			errorData := jsonrpc2.Error{
				Code:    jsonrpc2.CodeInternalError,
				Message: "Params not valid",
			}
			if err := c.ReplyWithError(ctx, r.ID, &errorData); err != nil {
				log.Println(err)
				return
			}
		}
		return
	}

	// check if module exist
	module, err := h.app.GetModuleByCodeNameToken(data.Code, data.Name, data.Token)

	if err != nil || module == nil || module.GetString("session") != "" {
		_ = c.Close()
		return
	}

	if err := h.app.AddModuleSession(c, module); err != nil {
		if !r.Notif {
			errorData := jsonrpc2.Error{
				Code:    jsonrpc2.CodeInternalError,
				Message: "Error creating session",
			}
			if err := c.ReplyWithError(ctx, r.ID, &errorData); err != nil {
				log.Println(err)
				return
			}
		}
		return
	}

	if !r.Notif {
		records, err := h.app.GetModuleParamsById(module.Id)

		if err != nil {
			errorData := jsonrpc2.Error{
				Code:    jsonrpc2.CodeInternalError,
				Message: "Error when getting module params",
			}
			if err := c.ReplyWithError(ctx, r.ID, &errorData); err != nil {
				log.Println(err)
				return
			}
		}

		if err := c.Reply(ctx, r.ID, records); err != nil {
			log.Println(err)
			return
		}
	}
}
