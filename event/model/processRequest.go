package model

import "time"

type ProcessRequest struct {
	Notification    bool      `db:"notification"`
	Method          string    `db:"method"`
	Params          any       `db:"params"`
	Result          any       `db:"result"`
	Error           any       `db:"error"`
	RequestDate     time.Time `db:"request_date"`
	ResponseDate    time.Time `db:"response_date"`
	ModuleSessionID string    `db:"module_session_id"`
	TriggerID       string    `db:"trigger_id"`
	EventID         string    `db:"event_id"`
}
