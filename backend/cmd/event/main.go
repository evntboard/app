package main

import (
	"encoding/json"
	"github.com/evntboard/app/backend/internal/database"
	"github.com/evntboard/app/backend/internal/env"
	"github.com/evntboard/app/backend/internal/model"
	"github.com/evntboard/app/backend/internal/realtime"
	"github.com/evntboard/app/backend/utils"
	"github.com/nats-io/nats.go"
	"log/slog"
	"os"
	"runtime/debug"
	"sync"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))

	err := run(logger)
	if err != nil {
		trace := string(debug.Stack())
		logger.Error(err.Error(), "trace", trace)
		os.Exit(1)
	}
}

type config struct {
	natsUrl                 string
	natsQueueName           string
	pocketBaseURL           string
	pocketBaseAdminEmail    string
	pocketBaseAdminPassword string
}

type application struct {
	realtime *realtime.Client
	pb       *database.PocketBaseClient
	config   config
	logger   *slog.Logger

	throttleData   map[string]*utils.Throttle
	throttleDataMu *sync.Mutex

	debounceData   map[string]*utils.Debounce
	debounceDataMu *sync.Mutex

	channels   map[string]*sync.Mutex
	channelsMu *sync.Mutex
}

func run(logger *slog.Logger) error {
	var cfg config

	cfg.pocketBaseURL = env.GetString("POCKETBASE_URL", "http://localhost:8090")
	cfg.pocketBaseAdminEmail = env.GetString("POCKETBASE_ADMIN_EMAIL", "admin@admin.com")
	cfg.pocketBaseAdminPassword = env.GetString("POCKETBASE_ADMIN_PASSWORD", "admin")
	cfg.natsUrl = env.GetString("NATS_URL", nats.DefaultURL)
	cfg.natsQueueName = env.GetString("NAME", "events")

	app := &application{
		config:         cfg,
		logger:         logger,
		realtime:       realtime.NewRealtimeClient(cfg.natsUrl),
		pb:             database.NewPocketBaseClient(cfg.pocketBaseURL, cfg.pocketBaseAdminEmail, cfg.pocketBaseAdminPassword),
		throttleData:   make(map[string]*utils.Throttle),
		throttleDataMu: &sync.Mutex{},
		debounceData:   make(map[string]*utils.Debounce),
		debounceDataMu: &sync.Mutex{},
		channels:       make(map[string]*sync.Mutex),
		channelsMu:     &sync.Mutex{},
	}

	funcOnMsg := func(msg *nats.Msg) {
		var event *model.EventReceived

		// just omit event not valid :)
		if err := json.Unmarshal(msg.Data, &event); err != nil {
			app.logger.Error(
				"error unmarshal event",
				slog.Group("event",
					slog.String("id", event.Id),
					slog.String("name", event.Name),
					slog.String("organization", event.OrganizationId),
				),
				"error",
				err,
			)
			return
		}

		app.logger.Debug(
			"receive an event",
			slog.Group("event",
				slog.String("id", event.Id),
				slog.String("name", event.Name),
				slog.String("organization", event.OrganizationId),
			),
		)

		conditions, err := app.pb.GetConditionsForOrganizationAndEventName(event.OrganizationId, event.Name)

		if err != nil {
			return
		}

		for _, condition := range conditions {
			go app.processEvent(
				event,
				condition,
			)
		}
	}

	if _, err := app.realtime.Subscribe(cfg.natsQueueName, funcOnMsg); err != nil {
		app.logger.Error(
			"error subscribe queue",
			slog.String("error", err.Error()),
		)
	}

	select {}

	return nil
}
