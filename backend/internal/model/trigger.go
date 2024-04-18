package model

type Trigger struct {
	Id             string `json:"id"`
	OrganizationId string `json:"organization"`
	Code           string `json:"code"`
	Name           string `json:"name"`
	Enable         bool   `json:"enable"`
	Channel        string `json:"channel"`
}

type TriggerConditionExpand struct {
	Trigger Trigger `json:"trigger"`
}

type TriggerCondition struct {
	Id      string                 `json:"id"`
	Code    string                 `json:"code"`
	Name    string                 `json:"name"`
	Enable  bool                   `json:"enable"`
	Type    string                 `json:"type"`
	Timeout int                    `json:"timeout"`
	Expand  TriggerConditionExpand `json:"expand"`
}
