package realtime

import (
	"github.com/nats-io/nats.go"
	"log"
)

type Client struct {
	*nats.Conn
}

func NewRealtimeClient(natsUrl string) *Client {
	nc, err := nats.Connect(natsUrl)

	if err != nil {
		log.Fatal(err)
	}

	return &Client{
		nc,
	}
}
