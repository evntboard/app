package service

import (
	"context"
	"encoding/json"
	"errors"
	"github.com/evntboard/app/event/model"
	"github.com/jackc/pgx/v5"
	"log"
)

type StorageService struct {
	dbService *DbService
}

func NewStorage(dbService *DbService) *StorageService {
	return &StorageService{dbService}
}

func (c *StorageService) GetStorage(organizationId string, key string) (interface{}, error) {
	ctx := context.Background()
	var storage = &model.Storage{}

	query := "SELECT value FROM storage WHERE key = $1 AND organization_id = $2 LIMIT 1"
	err := c.dbService.Db.QueryRow(ctx, query, key, organizationId).
		Scan(&storage.Value)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errors.New("no result found")
		}
		return nil, err
	}

	return storage.Value, nil
}

func (c *StorageService) CreateOrUpdateStorage(organizationId string, key string, value interface{}) (interface{}, error) {
	ctx := context.Background()
	var newItem *model.Storage

	valueJSON, err := json.Marshal(value)
	if err != nil {
		log.Println("Erreur de codage JSON de la requête:", err)
		return nil, err
	}

	query := `
		INSERT INTO storage (organization_id, key, value)
		VALUES ($1, $2, $3)
		ON CONFLICT (organization_id, key) DO UPDATE
		SET value = EXCLUDED.value
		RETURNING value
	`

	if err = c.dbService.Db.QueryRow(ctx, query, organizationId, key, valueJSON).Scan(&newItem.Value); err != nil {
		return nil, err
	}

	return newItem.Value, nil
}
