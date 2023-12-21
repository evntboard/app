package model

type TriggerConditionResult struct {
	OrganizationID   string `db:"organization_id"`
	TriggerID        string `db:"trigger_id"`
	TriggerName      string `db:"trigger_name"`
	TriggerCode      string `db:"trigger_code"`
	TriggerChannel   string `db:"trigger_channel"`
	ConditionID      string `db:"condition_id"`
	ConditionName    string `db:"condition_name"`
	ConditionCode    string `db:"condition_code"`
	ConditionType    string `db:"condition_type"`
	ConditionTimeout int    `db:"condition_timeout"`
}
