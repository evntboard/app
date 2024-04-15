package main

import (
	"context"
	"encoding/json"
	"fmt"
	_ "github.com/evntboard/evntboard/migrations"
	"github.com/evntboard/evntboard/utils"
	"github.com/gorilla/websocket"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/sourcegraph/jsonrpc2"
	"log"
	"os"
	"sync"
)

type application struct {
	pb *pocketbase.PocketBase

	upgrader websocket.Upgrader

	ch chan *models.Record

	throttleData   map[string]*utils.Throttle
	throttleDataMu *sync.Mutex

	debounceData   map[string]*utils.Debounce
	debounceDataMu *sync.Mutex

	channels   map[string]*sync.Mutex
	channelsMu *sync.Mutex

	sessions   map[*jsonrpc2.Conn]*models.Record
	sessionsMu *sync.RWMutex
}

func main() {
	app := &application{
		pb: pocketbase.New(),

		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},

		ch:             make(chan *models.Record),
		throttleData:   make(map[string]*utils.Throttle),
		throttleDataMu: &sync.Mutex{},
		debounceData:   make(map[string]*utils.Debounce),
		debounceDataMu: &sync.Mutex{},
		channels:       make(map[string]*sync.Mutex),
		channelsMu:     &sync.Mutex{},
		sessions:       make(map[*jsonrpc2.Conn]*models.Record),
		sessionsMu:     &sync.RWMutex{},
	}

	go app.StartProcessEvents()

	migratecmd.MustRegister(app.pb, app.pb.RootCmd, migratecmd.Config{
		TemplateLang: migratecmd.TemplateLangGo,
		// enable auto creation of migration files when making collection changes in the Admin UI
		// (the isGoRun check is to enable it only during development)
		Automigrate: os.Getenv("MIGRATE") == "1",
	})

	app.pb.OnModelAfterCreate("events").Add(func(e *core.ModelEvent) error {
		record, _ := e.Model.(*models.Record)
		app.ch <- record
		return nil
	})

	app.pb.OnRecordAfterCreateRequest("organizations").Add(func(e *core.RecordCreateEvent) error {
		collection, err := app.pb.Dao().FindCollectionByNameOrId("user_organization")
		if err != nil {
			return err
		}

		record := models.NewRecord(collection)

		record.Set("user", apis.RequestInfo(e.HttpContext).AuthRecord.Id)
		record.Set("organization", e.Record.Id)
		record.Set("role", "CREATOR")

		if err := app.pb.Dao().SaveRecord(record); err != nil {
			return err
		}

		return nil
	})

	app.pb.OnModelAfterCreate("storages").Add(func(e *core.ModelEvent) error {
		record, _ := e.Model.(*models.Record)

		key := record.GetString("key")

		var valueRaw any
		if err := json.Unmarshal([]byte(record.GetString("value")), &valueRaw); err != nil {
			fmt.Println("Error:", err)
		}

		for _, cons := range app.GetMatchingConns(record.GetString("organization"), record.GetString("key")) {
			_ = cons.Notify(
				context.Background(),
				"storage.sync",
				map[string]any{
					"key":   key,
					"value": valueRaw,
				},
			)
		}
		return nil
	})

	app.pb.OnModelAfterUpdate("storages").Add(func(e *core.ModelEvent) error {
		record, _ := e.Model.(*models.Record)

		key := record.GetString("key")

		var valueRaw any
		if err := json.Unmarshal([]byte(record.GetString("value")), &valueRaw); err != nil {
			fmt.Println("Error:", err)
		}

		for _, cons := range app.GetMatchingConns(record.GetString("organization"), record.GetString("key")) {
			_ = cons.Notify(
				context.Background(),
				"storage.sync",
				map[string]any{
					"key":   key,
					"value": valueRaw,
				},
			)
		}
		return nil
	})

	app.pb.OnModelAfterDelete("storages").Add(func(e *core.ModelEvent) error {
		record, _ := e.Model.(*models.Record)

		key := record.GetString("key")

		var valueRaw any
		if err := json.Unmarshal([]byte(record.GetString("value")), &valueRaw); err != nil {
			fmt.Println("Error:", err)
		}

		for _, cons := range app.GetMatchingConns(record.GetString("organization"), record.GetString("key")) {
			_ = cons.Notify(
				context.Background(),
				"storage.sync",
				map[string]any{
					"key":   key,
					"value": valueRaw,
				},
			)
		}
		return nil
	})

	app.pb.OnModelAfterDelete("modules").Add(func(e *core.ModelEvent) error {
		record, _ := e.Model.(*models.Record)

		go func() {
			// have to do it in goroutine otherwise it just crash
			// cause of sessionMu :)
			con, err := app.GetConnFromModuleNameAndCode(
				record.GetString("organization"),
				record.GetString("code"),
				record.GetString("name"),
			)

			if err != nil {
				return
			}

			if con != nil {
				_ = con.Close()
			}
		}()

		return nil
	})

	app.pb.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		if err := app.ResetAllModuleSession(); err != nil {
			log.Fatal(err)
		}

		g := e.Router.Group("/api")

		g.GET("/module", app.moduleRPC)
		g.POST("/module", app.modulePostEvent)

		g.GET("/organization/:organizationId/tree", app.getTree)
		g.DELETE("/organization/:organizationId/tree", app.deleteTree)
		g.GET("/organization/:organizationId/tree/disable", app.disableTree)
		g.GET("/organization/:organizationId/tree/enable", app.enableTree)
		g.GET("/organization/:organizationId/tree/move", app.moveTree)
		g.GET("/organization/:organizationId/tree/duplicate", app.duplicateTree)
		g.GET("/organization/:organizationId/export", app.getExport)
		g.POST("/organization/:organizationId/import", app.postImport)

		g.GET("/organization/:organizationId/event/available", app.getAvailableEventNames)

		g.DELETE("/organization/:organizationId/modules/:moduleId/eject", app.moduleEject)

		return nil
	})

	if err := app.pb.Start(); err != nil {
		log.Fatal(err)
	}
}
