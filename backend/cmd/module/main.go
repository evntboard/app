package main

import (
	"github.com/evntboard/app/backend/internal/database"
	"github.com/evntboard/app/backend/internal/env"
	"github.com/evntboard/app/backend/internal/model"
	"github.com/evntboard/app/backend/internal/realtime"
	"github.com/gorilla/websocket"
	"github.com/nats-io/nats.go"
	"github.com/sourcegraph/jsonrpc2"
	"log/slog"
	"net/http"
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
	baseURL                 string
	httpPort                int
	natsUrl                 string
	pocketBaseURL           string
	pocketBaseAdminEmail    string
	pocketBaseAdminPassword string
}

type application struct {
	realtime   *realtime.Client
	pb         *database.PocketBaseClient
	config     config
	logger     *slog.Logger
	upgrader   websocket.Upgrader
	sessions   map[*jsonrpc2.Conn]*model.ModuleSession
	sessionsMu sync.RWMutex
}

func run(logger *slog.Logger) error {
	var cfg config

	cfg.baseURL = env.GetString("BASE_URL", "http://localhost:4444")
	cfg.httpPort = env.GetInt("HTTP_PORT", 4444)
	cfg.pocketBaseURL = env.GetString("POCKETBASE_URL", "http://localhost:8090")
	cfg.pocketBaseAdminEmail = env.GetString("POCKETBASE_ADMIN_EMAIL", "admin@admin.com")
	cfg.pocketBaseAdminPassword = env.GetString("POCKETBASE_ADMIN_PASSWORD", "admin")
	cfg.natsUrl = env.GetString("NATS_URL", nats.DefaultURL)

	app := &application{
		config:     cfg,
		logger:     logger,
		realtime:   realtime.NewRealtimeClient(cfg.natsUrl),
		pb:         database.NewPocketBaseClient(cfg.pocketBaseURL, cfg.pocketBaseAdminEmail, cfg.pocketBaseAdminPassword),
		sessions:   make(map[*jsonrpc2.Conn]*model.ModuleSession),
		sessionsMu: sync.RWMutex{},
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}

	return app.serveHTTP()
}
