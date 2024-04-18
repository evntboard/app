package main

import (
	"context"
	"encoding/json"
	"github.com/evntboard/app/backend/internal/model"
	"github.com/nats-io/nats.go"
	"github.com/sourcegraph/jsonrpc2"
)

func (app *application) AddSession(client *jsonrpc2.Conn, module *model.Module) error {
	if err := app.pb.GenerateModuleSession(module); err != nil {
		return err
	}

	app.sessionsMu.Lock()
	defer app.sessionsMu.Unlock()

	sub, err := app.realtime.Subscribe(app.realtime.GetChannelForModule(module.SessionId), func(msg *nats.Msg) {
		var data map[string]any

		msgErrorJson, _ := json.Marshal(map[string]any{
			"error": "not valid message",
		})

		if err := json.Unmarshal(msg.Data, &data); err != nil {
			_ = app.realtime.Publish(msg.Reply, msgErrorJson)
			return
		}

		typeMsg, ok := data["type"]

		if !ok {
			_ = app.realtime.Publish(msg.Reply, msgErrorJson)
			return
		}

		if typeMsg == "module" {
			actionMsg, ok := data["action"]
			if !ok {
				_ = app.realtime.Publish(msg.Reply, msgErrorJson)
				return
			}

			if actionMsg == "request" {
				payload, ok := data["payload"].(map[string]any)

				if !ok {
					_ = app.realtime.Publish(msg.Reply, msgErrorJson)
					return
				}

				var result any
				err := client.Call(
					context.Background(),
					payload["method"].(string),
					payload["params"],
					&result,
				)
				if err != nil {
					msgJson, err := json.Marshal(map[string]any{
						"error": err,
					})

					if err != nil {
						_ = app.realtime.Publish(msg.Reply, nil)
						return
					}

					_ = app.realtime.Publish(msg.Reply, msgJson)
					return
				}

				msgJson, err := json.Marshal(map[string]any{
					"success": result,
				})

				if err != nil {
					_ = app.realtime.Publish(msg.Reply, msgErrorJson)
					return
				}

				_ = app.realtime.Publish(msg.Reply, msgJson)
				return
			}

			if actionMsg == "notify" {
				payload, ok := data["payload"].(map[string]any)

				if !ok {
					return
				}
				_ = client.Notify(
					context.Background(),
					payload["method"].(string),
					payload["params"],
				)
				return
			}

			if actionMsg == "eject" {
				client.Close()
				_ = app.realtime.Publish(msg.Reply, nil)
				return
			}
		}

		if typeMsg == "storage" {
			payload, ok := data["payload"].(map[string]any)
			if !ok {
				return
			}
			_ = client.Notify(
				context.Background(),
				"storage.sync",
				payload,
			)
			return
		}
	})

	if err != nil {
		return err
	}

	app.sessions[client] = &model.ModuleSession{
		Module:       module,
		Subscription: sub,
	}

	return nil
}

func (app *application) RemoveSession(client *jsonrpc2.Conn) {
	app.sessionsMu.Lock()
	defer app.sessionsMu.Unlock()

	session := app.GetSession(client)

	if session == nil {
		return
	}

	if err := app.pb.ResetModuleSessionByModuleId(session.Module.Id); err != nil {
		return
	}

	_ = session.Subscription.Unsubscribe()

	delete(app.sessions, client)
}

func (app *application) GetSession(client *jsonrpc2.Conn) *model.ModuleSession {
	if currentClient, ok := app.sessions[client]; ok {
		return currentClient
	}
	return nil
}

func (app *application) GetSessionBySessionIDConns(organization string, sessionID string) *jsonrpc2.Conn {
	app.sessionsMu.RLock()
	defer app.sessionsMu.RUnlock()

	for conn, session := range app.sessions {
		if session.Module.SessionId == sessionID && session.Module.OrganizationId == organization {
			return conn
		}
	}

	return nil
}
