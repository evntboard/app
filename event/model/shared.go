package model

type Shared struct {
	ID     string `gorm:"column:id;primaryKey"`
	Name   string `gorm:"column:name;unique;index"`
	Enable bool   `gorm:"column:enable"`
	Code   string `gorm:"column:code"`
}

func (Shared) TableName() string {
	return "shared"
}
