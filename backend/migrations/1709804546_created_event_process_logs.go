package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		jsonData := `{
			"id": "bauq1v5h7c45d94",
			"created": "2024-03-07 09:42:26.560Z",
			"updated": "2024-03-07 09:42:26.560Z",
			"name": "event_process_logs",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "jsrygdcb",
					"name": "event_process",
					"type": "relation",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"collectionId": "k6am2xon4a97e8a",
						"cascadeDelete": true,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "9qqfhyb6",
					"name": "log",
					"type": "text",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				}
			],
			"indexes": [],
			"listRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= event_process.trigger.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"READ\" ||\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"viewRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= event_process.trigger.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"READ\" ||\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"createRule": null,
			"updateRule": null,
			"deleteRule": null,
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("bauq1v5h7c45d94")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
