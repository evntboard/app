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
			"id": "sqj645vi14kmjv7",
			"created": "2024-03-07 09:42:26.561Z",
			"updated": "2024-03-07 09:42:26.561Z",
			"name": "modules",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "vxheyocp",
					"name": "organization",
					"type": "relation",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"collectionId": "sy0qvvpo60siidq",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "tdqygfhb",
					"name": "code",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 3,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "ggkp3las",
					"name": "name",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 3,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "mkmfuqq5",
					"name": "token",
					"type": "text",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "tg9wl9d3",
					"name": "session",
					"type": "text",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": null,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "nr92rygd",
					"name": "sub",
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
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_q7Hxmfg` + "`" + ` ON ` + "`" + `modules` + "`" + ` (\n  ` + "`" + `organization` + "`" + `,\n  ` + "`" + `code` + "`" + `,\n  ` + "`" + `name` + "`" + `\n)",
				"CREATE INDEX ` + "`" + `idx_8bCn7mu` + "`" + ` ON ` + "`" + `modules` + "`" + ` (\n  ` + "`" + `name` + "`" + `,\n  ` + "`" + `organization` + "`" + `\n)"
			],
			"listRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"READ\" ||\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"viewRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"READ\" ||\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"createRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"updateRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"deleteRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db)

		collection, err := dao.FindCollectionByNameOrId("sqj645vi14kmjv7")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
