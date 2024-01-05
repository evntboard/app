package model

import "time"

type Event struct {
	ID             string    `db:"id"`
	OrganizationID string    `db:"organization_id"`
	Name           string    `db:"name"`
	Payload        any       `db:"payload"`
	EmitterCode    string    `db:"emitter_code"`
	EmitterName    string    `db:"emitter_name"`
	EmittedAt      time.Time `db:"emitted_at"`
}
