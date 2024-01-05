package service

import (
	"context"
	"log"
	"time"
)

type ProcessService struct {
	dbService *DbService
}

func NewProcessService(dbService *DbService) *ProcessService {
	return &ProcessService{dbService}
}

func (p *ProcessService) CreateProcessForTriggerIDAndEventID(ctx context.Context, processID, triggerID, eventID string) error {
	_, err := p.dbService.Db.Exec(ctx, `
        INSERT INTO process (id, trigger_id, event_id)
        VALUES ($1, $2, $3)
    `, processID, triggerID, eventID)

	if err != nil {
		log.Println("Error creating process :", err)
		return err
	}

	return nil
}

func (p *ProcessService) UpdateStartDateForTriggerIDAndEventID(ctx context.Context, processID, triggerID, eventID string) error {
	_, err := p.dbService.Db.Exec(ctx, `
        INSERT INTO process (id, trigger_id, event_id, start_date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET start_date = EXCLUDED.start_date
    `, processID, triggerID, eventID, time.Now())

	if err != nil {
		log.Println("Error updating process StartDate:", err)
		return err
	}

	return nil
}

func (p *ProcessService) UpdateEndDateForTriggerIDAndEventID(ctx context.Context, processID, triggerID, eventID string) error {
	_, err := p.dbService.Db.Exec(ctx, `
        INSERT INTO process (id, trigger_id, event_id, end_date)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET end_date = EXCLUDED.end_date
    `, processID, triggerID, eventID, time.Now())

	if err != nil {
		log.Println("Error updating process EndDate:", err)
		return err
	}

	return nil
}

func (p *ProcessService) UpdateErrorForTriggerIDAndEventID(ctx context.Context, processID, triggerID, eventID, errorMsg string) error {
	_, err := p.dbService.Db.Exec(ctx, `
        INSERT INTO process (id, trigger_id, event_id, end_date, error)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE
        SET
            end_date = EXCLUDED.end_date,
            error = EXCLUDED.error
    `, processID, triggerID, eventID, time.Now(), errorMsg)

	if err != nil {
		log.Println("Error updating process EndDate and Error:", err)
		return err
	}

	return nil
}

func (p *ProcessService) UpdateExecutedForTriggerIDAndEventID(ctx context.Context, processID, triggerID, eventID string) error {
	_, err := p.dbService.Db.Exec(ctx, `
        INSERT INTO process (id, trigger_id, event_id, executed)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET executed = EXCLUDED.executed
    `, processID, triggerID, eventID, true)

	if err != nil {
		log.Println("Error updating process Executed:", err)
		return err
	}

	return nil
}
