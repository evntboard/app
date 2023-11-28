package model

type Trigger struct {
	ID             string             `gorm:"column:id;primaryKey"`
	OrganizationId string             `gorm:"column:organization_id"`
	Name           string             `gorm:"column:name;unique;index"`
	Enable         bool               `gorm:"column:enable"`
	Channel        string             `gorm:"column:channel"`
	Code           string             `gorm:"column:code"`
	Conditions     []TriggerCondition `gorm:"constraint:OnDelete:CASCADE"`
}

func (Trigger) TableName() string {
	return "trigger"
}

type TriggerCondition struct {
	ID        string `gorm:"column:id;primaryKey"`
	TriggerID string `gorm:"column:trigger_id"`
	Name      string `gorm:"column:name;index"`
	Enable    bool   `gorm:"column:enable"`
	Code      string `gorm:"column:code"`
	Type      string `gorm:"column:type"`
	Timeout   int    `gorm:"column:timeout"`
	Trigger   Trigger
}

func (TriggerCondition) TableName() string {
	return "condition"
}
