package model

import "time"

type Event struct {
	ID             string    `json:"id"`
	OrganizationId string    `json:"organizationId"`
	Name           string    `json:"name"`
	Payload        any       `json:"payload"`
	EmittedAt      time.Time `json:"emitted_at"`
	EmitterCode    string    `json:"emitter_code"`
	EmitterName    string    `json:"emitter_name"`
}

type ModuleRequest struct {
	Notification bool   `json:"notification"`
	Channel      string `json:"channel"`
	Method       string `json:"method"`
	Params       any    `json:"params"`
}

type ModuleResponse struct {
	Result any    `json:"result"`
	Error  string `json:"error"`
}
