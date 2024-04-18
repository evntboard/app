package database

import (
	"github.com/evntboard/app/backend/internal/model"
	"github.com/pluja/pocketbase"
)

func (c *PocketBaseClient) CreateEvent(event model.Event) (*model.Event, error) {
	collection := pocketbase.CollectionSet[model.Event](c.pb, "events")
	resp, err := collection.Create(event)

	one, err := collection.One(resp.ID)
	if err != nil {
		return nil, err
	}

	return &one, err
}
