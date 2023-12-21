package model

import "time"

type Process struct {
	TriggerID string     `db:"trigger_id"`
	EventID   string     `db:"event_id"`
	Logs      []string   `db:"logs"`
	StartDate *time.Time `db:"start_date"`
	EndDate   *time.Time `db:"end_date"`
	Error     *string    `db:"error"`
	Executed  bool       `db:"executed"`
}
