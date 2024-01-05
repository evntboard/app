package service

import (
	"github.com/nats-io/nats.go"
	"log"
)

type NatsService struct {
	Nats          *nats.Conn
	configService *ConfigService
}

func NewNatsService(configService *ConfigService) *NatsService {
	db := &NatsService{
		configService: configService,
	}
	db.InitNats()
	return db
}

func (c *NatsService) InitNats() {
	nc, err := nats.Connect(c.configService.GlobalConfig.NatsUrl)
	if err != nil {
		log.Fatal(err)
	}

	c.Nats = nc
}
