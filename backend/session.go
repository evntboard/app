package main

import (
	"errors"
	"github.com/pocketbase/pocketbase/models"
	"github.com/sourcegraph/jsonrpc2"
	"strings"
)

func (app *application) AddModuleSession(client *jsonrpc2.Conn, module *models.Record) error {
	app.sessionsMu.Lock()
	defer app.sessionsMu.Unlock()

	newModule, err := app.CreateModuleSession(module.Id)

	if err != nil {
		_ = client.Close()
		return err
	}

	app.sessions[client] = newModule

	return nil
}

func (app *application) RemoveModuleSession(client *jsonrpc2.Conn) error {
	app.sessionsMu.Lock()
	defer app.sessionsMu.Unlock()

	if currentClient, ok := app.sessions[client]; ok {
		if err := app.ResetModuleSessionByID(currentClient.Id); err != nil {
			return err
		}
		delete(app.sessions, client)
	}
	return nil
}

func (app *application) GetModuleSession(client *jsonrpc2.Conn) *models.Record {
	app.sessionsMu.RLock()
	defer app.sessionsMu.RUnlock()
	if currentClient, ok := app.sessions[client]; ok {
		return currentClient
	}
	return nil
}

func (app *application) GetModuleSessionBySessionID(organization string, sessionID string) *jsonrpc2.Conn {
	app.sessionsMu.RLock()
	defer app.sessionsMu.RUnlock()

	for conn, session := range app.sessions {
		if session.GetString("session") == sessionID && session.GetString("organization") == organization {
			return conn
		}
	}

	return nil
}

func (app *application) GetMatchingConns(organization string, subsContains string) []*jsonrpc2.Conn {
	var matchingConns []*jsonrpc2.Conn

	app.sessionsMu.RLock()
	defer app.sessionsMu.RUnlock()

	for conn, session := range app.sessions {
		if containsString(strings.Split(session.GetString("sub"), ";"), subsContains) && session.GetString("organization") == organization {
			matchingConns = append(matchingConns, conn)
		}
	}

	return matchingConns
}

func (app *application) GetConnFromModuleSession(session string) (*jsonrpc2.Conn, error) {
	app.sessionsMu.RLock()
	defer app.sessionsMu.RUnlock()

	for conn, m := range app.sessions {
		if m.GetString("session") == session {
			return conn, nil
		}
	}
	return nil, errors.New("there is no module for this session")
}

func (app *application) GetConnFromModuleNameAndCode(orgaId, code, name string) (*jsonrpc2.Conn, error) {
	app.sessionsMu.RLock()
	defer app.sessionsMu.RUnlock()

	for conn, m := range app.sessions {
		if m.GetString("organization") == orgaId && m.GetString("code") == code && m.GetString("name") == name {
			return conn, nil
		}
	}
	return nil, errors.New("there is no module for this session")
}

func containsString(slice []string, target string) bool {
	for _, s := range slice {
		if s == target {
			return true
		}
	}
	return false
}
