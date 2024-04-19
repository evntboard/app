package main

import (
	"github.com/evntboard/app/backend/internal/env"
	"github.com/evntboard/app/backend/internal/realtime"
	_ "github.com/evntboard/app/backend/migrations"
	"github.com/nats-io/nats.go"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
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

	app.pb.OnModelAfterCreate("events").Add(app.onCreateEvent)
	app.pb.OnModelAfterCreate("storages").Add(app.onModelStorage)
	app.pb.OnModelAfterUpdate("storages").Add(app.onModelStorage)
	app.pb.OnModelAfterDelete("storages").Add(app.onModelStorage)
	app.pb.OnRecordAfterCreateRequest("organizations").Add(app.onCreateOrganization)

	app.pb.OnModelBeforeCreate("triggers").Add(app.onBeforeCreateTrigger)
	app.pb.OnModelBeforeCreate("shareds").Add(app.onBeforeCreateShared)

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
