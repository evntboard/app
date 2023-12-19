package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/evntboard/app/event/model"
	"github.com/lucsky/cuid"
	"gorm.io/gorm"
	"log"
)

type StoragePersistentService struct {
	dbService *DbService
}

func NewStoragePersistent(dbService *DbService) *StoragePersistentService {
	return &StoragePersistentService{dbService}
}

func (c *StoragePersistentService) GetPersistentStorage(organizationId string, key string) (any, error) {
	var storage model.PersistentStorage

	result := c.dbService.Db.Where("key = ? AND organization_id = ?", key, organizationId).Limit(1).Find(&storage)

	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, errors.New("no result found")
	}

	var decodedValue interface{}
	err := json.Unmarshal(storage.Value, &decodedValue)
	if err != nil {
		return nil, fmt.Errorf("Storage decoding %s error: %s", key, err.Error())
	}

	return decodedValue, nil
}

func (c *StoragePersistentService) CreateOrUpdatePersistentStorage(organizationId string, key string, value any) (any, error) {
	var newItem *model.PersistentStorage

	var existingItem model.PersistentStorage
	result := c.dbService.Db.Where("key = ? AND organization_id = ?", key, organizationId).Limit(1).Find(&existingItem)

	if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, result.Error
	}

	valueJSON, err := json.Marshal(value)
	if err != nil {
		log.Println("Erreur de codage JSON de la requête:", err)
	}

	if result.RowsAffected > 0 {
		result = c.dbService.Db.Model(&existingItem).Update("value", valueJSON)
		if result.Error != nil {
			return nil, result.Error
		}

		return value, nil
	}

	newItem = &model.PersistentStorage{
		ID:             cuid.New(),
		OrganizationId: organizationId,
		Key:            key,
		Value:          valueJSON,
	}
	result = c.dbService.Db.Create(newItem)
	if result.Error != nil {
		return nil, result.Error
	}

	return value, nil
}
