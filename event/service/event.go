package service

import (
	"context"
	"fmt"
	"github.com/evntboard/app/event/model"
	"log"
)

type EventService struct {
	dbService *DbService
}

func NewEventService(dbService *DbService) *EventService {
	return &EventService{dbService}
}

func (c *EventService) GetEventByID(eventID string) (*model.Event, error) {
	ctx := context.Background()

	query := `
		SELECT
			id,
			organization_id,
			name,
			payload,
			emitter_code,
			emitter_name,
			emitted_at
		FROM
			event
		WHERE
			id = $1
	`

	var event model.Event
	err := c.dbService.Db.QueryRow(ctx, query, eventID).
		Scan(&event.ID, &event.OrganizationID, &event.Name, &event.Payload, &event.EmitterCode, &event.EmitterName, &event.EmittedAt)

	if err != nil {
		log.Println("Error retrieving event:", err)
		return nil, err
	}

	return &event, nil
}

func (c *EventService) UpdateStatusEventByID(eventID string, from string, to string) error {
	ctx := context.Background()

	query := `
		UPDATE event
		SET status = $1
		WHERE id = $2 AND status = $3
		RETURNING id
	`

	var returnedID string
	err := c.dbService.Db.QueryRow(ctx, query, to, eventID, from).Scan(&returnedID)

	if err != nil {
		return err
	}

	if returnedID != eventID {
		return fmt.Errorf("Event with ID %s not found", eventID)
	}

	return nil
}
