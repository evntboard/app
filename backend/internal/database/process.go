package database

import (
	"time"
)

func (app *PocketBaseClient) CreateProcess(OrganizationID string, eventID string, triggerID string) (string, error) {
	create, err := app.pb.Create(
		"event_processes",
		map[string]any{
			"organization": OrganizationID,
			"event":        eventID,
			"trigger":      triggerID,
			"executed":     false,
			"start_at":     time.Now().Format(time.RFC3339Nano),
		})
	if err != nil {
		return "", err
	}

	return create.ID, err
}

func (app *PocketBaseClient) StopProcess(processID string) error {
	err := app.pb.Update(
		"event_processes",
		processID,
		map[string]any{
			"end_at": time.Now().Format(time.RFC3339Nano),
		},
	)
	if err != nil {
		return err
	}

	return nil
}

func (app *PocketBaseClient) StopErrorProcess(processID string, errToSave error) error {
	err := app.pb.Update(
		"event_processes",
		processID,
		map[string]any{
			"end_at": time.Now().Format(time.RFC3339Nano),
			"error":  errToSave.Error(),
		},
	)
	if err != nil {
		return err
	}

	return nil
}

func (app *PocketBaseClient) StopExecutedProcess(processID string) error {
	err := app.pb.Update(
		"event_processes",
		processID,
		map[string]any{
			"end_at":   time.Now().Format(time.RFC3339Nano),
			"executed": true,
		},
	)
	if err != nil {
		return err
	}

	return nil
}

func (app *PocketBaseClient) StopErrorExecutedProcess(processID string, errToSave error) error {
	err := app.pb.Update(
		"event_processes",
		processID,
		map[string]any{
			"end_at":   time.Now().Format(time.RFC3339Nano),
			"executed": true,
			"error":    errToSave.Error(),
		},
	)
	if err != nil {
		return err
	}

	return nil
}
