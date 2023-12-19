package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/evntboard/app/event/utils"
	"log"
)

type StorageTemporaryService struct {
	redisService *RedisService
}

func NewStorageTemporary(redisService *RedisService) *StorageTemporaryService {
	return &StorageTemporaryService{
		redisService: redisService,
	}
}

func (c *StorageTemporaryService) GetTemporaryStorage(orgaId string, key string) (any, error) {
	ctx := context.Background()
	storage, err := c.redisService.Client.HGet(ctx, utils.GKeyOrgaStorage(orgaId), key).Result()
	if err != nil {
		fmt.Println("Error retrieving data from Redis:", err)
		return "", errors.New("error retrieving storage key: " + key)
	}

	var data any

	err = json.Unmarshal([]byte(storage), &data)
	if err != nil {
		return nil, fmt.Errorf("Storage decoding %s error: %s", key, err.Error())
	}

	return data, nil
}

func (c *StorageTemporaryService) CreateOrUpdateTemporaryStorage(orgaId string, key string, value any) (any, error) {
	ctx := context.Background()

	valueJSON, err := json.Marshal(value)
	if err != nil {
		log.Println("Erreur de codage JSON de la requête:", err)
	}

	_, err = c.redisService.Client.HSet(ctx, utils.GKeyOrgaStorage(orgaId), key, valueJSON).Result()
	if err != nil {
		fmt.Println("Error retrieving data from Redis:", err)
		return "", errors.New("error retrieving storage key: " + key)
	}

	return value, nil
}

func (c *StorageTemporaryService) DeleteTemporaryStorage(orgaId string, key string) error {
	ctx := context.Background()
	_, err := c.redisService.Client.HDel(ctx, utils.GKeyOrgaStorage(orgaId), key).Result()

	if err != nil {
		fmt.Println("Error delete data from Redis:", err)
		return errors.New("error delete storage key: " + key)
	}

	return nil
}
