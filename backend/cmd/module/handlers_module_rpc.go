package main

import (
	"context"
	"github.com/sourcegraph/jsonrpc2"
	"log/slog"
)

type rpcMethodHandler struct {
	app *application
}

func newRPCMethodHandler(app *application) *rpcMethodHandler {
	return &rpcMethodHandler{
		app: app,
	}
}

func (h *rpcMethodHandler) Handle(ctx context.Context, c *jsonrpc2.Conn, r *jsonrpc2.Request) {
	switch r.Method {
	case "session.register":
		h.sessionRegister(ctx, c, r)
	case "event.new":
		h.eventNew(ctx, c, r)
	case "storage.get":
		h.storageGet(ctx, c, r)
	case "storage.set":
		h.storageSet(ctx, c, r)
	default:
		h.defaultCase(ctx, c, r)
	}
}

func (h *rpcMethodHandler) defaultCase(ctx context.Context, c *jsonrpc2.Conn, r *jsonrpc2.Request) {
	session := h.app.GetSession(c)

	h.app.logger.Error(
		"rpc method not found",
		slog.Group("module",
			slog.String("organization", session.Module.OrganizationId),
			slog.String("code", session.Module.Code),
			slog.String("name", session.Module.Name),
		),
		slog.Group("rpc",
			slog.String("method", r.Method),
		),
	)

	if r.Notif {
		return
	}

	_ = c.ReplyWithError(
		ctx,
		r.ID,
		&jsonrpc2.Error{
			Code:    jsonrpc2.CodeMethodNotFound,
			Message: "Method not found",
		},
	)
}
