package model

type PersistentStorage struct {
	ID             string `gorm:"primaryKey" json:"id"`
	Key            string `json:"key"`
	Value          []byte `gorm:"type:jsonb" json:"value"`
	OrganizationId string `gorm:"column:organization_id"`
}

func (PersistentStorage) TableName() string {
	return "storage"
}
