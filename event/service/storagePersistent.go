package service

import (
	"errors"
	"github.com/evntboard/app/event/model"
	"github.com/lucsky/cuid"
	"gorm.io/gorm"
)

type StoragePersistentService struct {
	dbService *DbService
}

func NewStoragePersistent(dbService *DbService) *StoragePersistentService {
	return &StoragePersistentService{dbService}
}

func (c *StoragePersistentService) GetAllPersistentStorage() ([]model.PersistentStorage, error) {
	var Storages []model.PersistentStorage
	result := c.dbService.Db.Find(&Storages)
	if result.Error != nil {
		return nil, result.Error
	}
	return Storages, nil
}

func (c *StoragePersistentService) GetPersistentStorage(organizationId string, key string) (*model.PersistentStorage, error) {
	var storage model.PersistentStorage

	result := c.dbService.Db.Where("key = ? AND organization_id = ?", key, organizationId).Limit(1).Find(&storage)

	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, errors.New("no result found")
	}

	return &storage, nil
}

func (c *StoragePersistentService) CreateOrUpdatePersistentStorage(organizationId string, key string, value string) (*model.PersistentStorage, error) {
	var newItem *model.PersistentStorage

	var existingItem model.PersistentStorage
	result := c.dbService.Db.Where("key = ? AND organization_id = ?", key, organizationId).Limit(1).Find(&existingItem)

	if result.Error != nil && !errors.Is(result.Error, gorm.ErrRecordNotFound) {
		return nil, result.Error
	}

	if result.RowsAffected > 0 {
		result = c.dbService.Db.Model(&existingItem).Update("value", value)
		if result.Error != nil {
			return nil, result.Error
		}

		return &existingItem, nil
	}

	newItem = &model.PersistentStorage{
		ID:             cuid.New(),
		OrganizationId: organizationId,
		Key:            key,
		Value:          value,
	}
	result = c.dbService.Db.Create(newItem)
	if result.Error != nil {
		return nil, result.Error
	}

	return newItem, nil
}
