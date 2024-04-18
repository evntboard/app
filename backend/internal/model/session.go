package model

import (
	"github.com/nats-io/nats.go"
)

type ModuleSession struct {
	Module       *Module
	Subscription *nats.Subscription
}
