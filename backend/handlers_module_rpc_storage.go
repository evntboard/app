package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	validation "github.com/go-ozzo/ozzo-validation/v4"
	"github.com/sourcegraph/jsonrpc2"
)

type InputStorageGetData struct {
	Key string `json:"key"`
}

func (a InputStorageGetData) Validate() error {
	return validation.ValidateStruct(
		&a,
		validation.Field(&a.Key, validation.Required, validation.Length(3, 100)),
	)
}

func (h *rpcMethodHandler) storageGet(ctx context.Context, c *jsonrpc2.Conn, r *jsonrpc2.Request) {
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

	var data InputStorageGetData

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

	storageData, err := h.app.GetStorageByKey(
		session.GetString("organization"),
		data.Key,
	)

	if errors.Is(err, sql.ErrNoRows) {
		if !r.Notif {
			if err := c.Reply(ctx, r.ID, nil); err != nil {
				h.app.pb.Logger().Error(err.Error())
			}
		}
		return
	} else if err != nil {
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
		var valueRaw any
		if err := json.Unmarshal([]byte(storageData.GetString("value")), &valueRaw); err != nil {
			fmt.Println("Error:", err)
		}

		if err := c.Reply(ctx, r.ID, valueRaw); err != nil {
			h.app.pb.Logger().Error(err.Error())
		}
	}
}

type InputStorageSetData struct {
	Key   string          `json:"key"`
	Value json.RawMessage `json:"value"`
}

func (a InputStorageSetData) Validate() error {
	return validation.ValidateStruct(
		&a,
		validation.Field(&a.Key, validation.Required, validation.Length(3, 100)),
		validation.Field(&a.Value, validation.Required),
	)
}

func (h *rpcMethodHandler) storageSet(ctx context.Context, c *jsonrpc2.Conn, r *jsonrpc2.Request) {
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

	var data InputStorageSetData

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

	storageData, err := h.app.SetStorageByKey(
		session.GetString("organization"),
		data.Key,
		data.Value,
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
		var valueRaw any
		if err := json.Unmarshal([]byte(storageData.GetString("value")), &valueRaw); err != nil {
			fmt.Println("Error:", err)
		}

		if err := c.Reply(ctx, r.ID, valueRaw); err != nil {
			h.app.pb.Logger().Error(err.Error())
		}
	}
}
