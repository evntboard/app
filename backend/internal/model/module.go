package model

type Module struct {
	Id             string       `json:"id"`
	SessionId      string       `json:"session"`
	OrganizationId string       `json:"organization"`
	Sub            string       `json:"sub"`
	Code           string       `json:"code"`
	Name           string       `json:"name"`
	Expand         ModuleExpand `json:"expand"`
}

type ModuleExpand struct {
	Params []ModuleParam `json:"module_params_via_module"`
}

type ModuleParam struct {
	Key   string `json:"key"`
	Value any    `json:"value"`
}
