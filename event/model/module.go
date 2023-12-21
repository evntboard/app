package model

type ModuleRequest struct {
	Notification bool   `json:"notification"`
	Method       string `json:"method"`
	Params       any    `json:"params"`
}

type ModuleResponse struct {
	Result any    `json:"result"`
	Error  string `json:"error"`
}

type ModuleSession struct {
	ModuleID        string `db:"module_id"`
	ModuleSessionID string `db:"id"`
}
