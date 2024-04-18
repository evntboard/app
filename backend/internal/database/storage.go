package database

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/evntboard/app/backend/internal/model"
	"github.com/pluja/pocketbase"
)

func (app *PocketBaseClient) GetStorageByKey(organizationId string, key string) (*model.Storage, error) {
	resp, err := pocketbase.CollectionSet[*model.Storage](app.pb, "storages").List(pocketbase.ParamsList{
		Page:    0,
		Size:    1,
		Filters: fmt.Sprintf("organization = \"%s\" && key = \"%s\"", organizationId, key),
		Sort:    "",
		Expand:  "",
		Fields:  "",
	})

	if resp.TotalItems != 1 {
		return nil, sql.ErrNoRows
	}

	return resp.Items[0], err
}

func (app *PocketBaseClient) SetStorageByKey(organizationId string, key string, value any) (*model.Storage, error) {
	// check if key already exists
	record, err := app.GetStorageByKey(organizationId, key)

	if record == nil || errors.Is(err, sql.ErrNoRows) {
		created, err := app.pb.Create(
			"storages",
			map[string]any{
				"organization": organizationId,
				"key":          key,
				"value":        value,
			},
		)
		if err != nil {
			return nil, err
		}
		return pocketbase.CollectionSet[*model.Storage](app.pb, "storages").One(created.ID)
	}

	err = app.pb.Update(
		"storages",
		record.Id,
		map[string]any{
			"value": value,
		},
	)

	if err != nil {
		return nil, err
	}

	record.Value = value

	return record, nil
}
