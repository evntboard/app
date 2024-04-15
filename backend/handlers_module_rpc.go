package main

import (
	"context"
	"github.com/sourcegraph/jsonrpc2"
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
	if r.Notif {
		return
	}

	err := &jsonrpc2.Error{Code: jsonrpc2.CodeMethodNotFound, Message: "Method not found"}
	if err := c.ReplyWithError(ctx, r.ID, err); err != nil {
		h.app.pb.Logger().Error(err.Error())
		return
	}
}
