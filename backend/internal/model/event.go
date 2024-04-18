package model

import (
	"encoding/json"
)

type Event struct {
	OrganizationId string          `json:"organization"`
	Name           string          `json:"name"`
	Payload        json.RawMessage `json:"payload"`
	EmitterCode    string          `json:"emitter_code"`
	EmitterName    string          `json:"emitter_name"`
	EmittedAt      string          `json:"emitted_at"`
}

type EventReceived struct {
	Id string `json:"id"`
	Event
}
