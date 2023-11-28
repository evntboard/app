package service

import (
	"errors"
	"sync"
)

type StorageTemporaryService struct {
	temporaryStorage   map[string]string
	temporaryStorageMu sync.RWMutex
}

func NewStorageTemporary() *StorageTemporaryService {
	return &StorageTemporaryService{
		temporaryStorage:   make(map[string]string),
		temporaryStorageMu: sync.RWMutex{},
	}
}

func (c *StorageTemporaryService) GetTemporaryStorage(key string) (string, error) {
	c.temporaryStorageMu.RLock()
	defer c.temporaryStorageMu.RUnlock()

	if _, keyExists := c.temporaryStorage[key]; !keyExists {
		return "", errors.New("not found")
	}
	return c.temporaryStorage[key], nil
}

func (c *StorageTemporaryService) CreateOrUpdateTemporaryStorage(key string, value string) (string, error) {
	c.temporaryStorageMu.Lock()
	defer c.temporaryStorageMu.Unlock()

	c.temporaryStorage[key] = value

	return c.temporaryStorage[key], nil
}

func (c *StorageTemporaryService) DeleteTemporaryStorage(key string) error {
	c.temporaryStorageMu.Lock()
	defer c.temporaryStorageMu.Unlock()

	if _, keyExists := c.temporaryStorage[key]; !keyExists {
		return errors.New("not found")
	}

	delete(c.temporaryStorage, key)
	return nil
}

func (c *StorageTemporaryService) GetAllStorageTemporary() []map[string]string {
	c.temporaryStorageMu.RLock()
	defer c.temporaryStorageMu.RUnlock()

	responseArray := make([]map[string]string, 0)
	for key, value := range c.temporaryStorage {
		responseArray = append(responseArray, map[string]string{"key": key, "value": value})
	}

	return responseArray
}
