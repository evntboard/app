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
			"id": "vg93csibbyxn00k",
			"created": "2024-03-07 09:42:26.562Z",
			"updated": "2024-03-07 09:42:26.562Z",
			"name": "triggers",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "fhwfmjx9",
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
					"id": "svsyj3rq",
					"name": "name",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 3,
						"max": null,
						"pattern": "^\\/(?:[^/]+\\/)*[^/]+$"
					}
				},
				{
					"system": false,
					"id": "p3b0yc3f",
					"name": "code",
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
					"id": "mllaiyf0",
					"name": "enable",
					"type": "bool",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "0smk6kau",
					"name": "channel",
					"type": "text",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 4,
						"max": null,
						"pattern": ""
					}
				}
			],
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_VB91Xan` + "`" + ` ON ` + "`" + `triggers` + "`" + ` (\n  ` + "`" + `organization` + "`" + `,\n  ` + "`" + `name` + "`" + `\n)",
				"CREATE INDEX ` + "`" + `idx_z6tTJ5s` + "`" + ` ON ` + "`" + `triggers` + "`" + ` (` + "`" + `name` + "`" + `)"
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
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("vg93csibbyxn00k")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
