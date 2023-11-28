package model

type PersistentStorage struct {
	ID             string `gorm:"primaryKey" json:"id"`
	Key            string `json:"key"`
	Value          string `json:"value"` // store only JSON !
	OrganizationId string `gorm:"column:organization_id"`
}

func (PersistentStorage) TableName() string {
	return "storage"
}
