package main

import (
	"encoding/json"
	"github.com/evntboard/app/backend/internal/env"
	"github.com/evntboard/app/backend/internal/realtime"
	_ "github.com/evntboard/app/backend/migrations"
	"github.com/nats-io/nats.go"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"log"
	"os"
)

type config struct {
	natsUrl string
}

type application struct {
	config   config
	pb       *pocketbase.PocketBase
	realtime *realtime.Client
}

func main() {
	var cfg config

	cfg.natsUrl = env.GetString("NATS_URL", nats.DefaultURL)

	app := &application{
		config:   cfg,
		realtime: realtime.NewRealtimeClient(cfg.natsUrl),
		pb:       pocketbase.New(),
	}

	migratecmd.MustRegister(app.pb, app.pb.RootCmd, migratecmd.Config{
		TemplateLang: migratecmd.TemplateLangGo,
		// enable auto creation of migration files when making collection changes in the Admin UI
		// (the isGoRun check is to enable it only during development)
		Automigrate: os.Getenv("MIGRATE") == "1",
	})

	funcEventPublish := func(e *core.ModelEvent) error {
		record, _ := e.Model.(*models.Record)
		msgJson, err := record.MarshalJSON()
		if err != nil {
			return err
		}

		if err := app.realtime.Publish("events", msgJson); err != nil {
			return err
		}
		return nil
	}

	funcStoragePublish := func(e *core.ModelEvent) error {
		record, _ := e.Model.(*models.Record)

		moduleRecords, err := app.GetModulesWithSessionByOrganizationIdAndStorageKey(
			record.GetString("organization"),
			record.GetString("key"),
		)
		if err != nil {
			return err
		}

		msgJson, err := json.Marshal(map[string]any{
			"type":    "storage",
			"payload": record,
		})
		if err != nil {
			return err
		}

		for _, moduleRecord := range moduleRecords {
			if err := app.realtime.Publish(app.realtime.GetChannelForModule(moduleRecord.GetString("session")), msgJson); err != nil {
				return err
			}
		}

		return nil
	}

	funcCreatedOrga := func(e *core.RecordCreateEvent) error {
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
	}

	app.pb.OnModelAfterCreate("events").Add(funcEventPublish)
	app.pb.OnModelAfterCreate("storages").Add(funcStoragePublish)
	app.pb.OnModelAfterUpdate("storages").Add(funcStoragePublish)
	app.pb.OnModelAfterDelete("storages").Add(funcStoragePublish)
	app.pb.OnRecordAfterCreateRequest("organizations").Add(funcCreatedOrga)

	app.pb.OnBeforeServe().Add(func(e *core.ServeEvent) error {
		g := e.Router.Group("/api")
		g.GET("/organization/:organizationId/tree", app.getTree)
		g.DELETE("/organization/:organizationId/tree", app.deleteTree)
		g.GET("/organization/:organizationId/tree/disable", app.disableTree)
		g.GET("/organization/:organizationId/tree/enable", app.enableTree)
		g.GET("/organization/:organizationId/tree/move", app.moveTree)
		g.GET("/organization/:organizationId/tree/duplicate", app.duplicateTree)
		g.GET("/organization/:organizationId/export", app.getExport)
		g.POST("/organization/:organizationId/import", app.postImport)
		g.GET("/organization/:organizationId/event/available", app.getAvailableEventNames)
		g.DELETE("/organization/:organizationId/modules/:moduleId/eject", app.deleteEjectModule)
		return nil
	})

	if err := app.pb.Start(); err != nil {
		log.Fatal(err)
	}
}
