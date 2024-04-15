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
			"id": "w51w37x6amh03jc",
			"created": "2024-03-07 09:42:26.561Z",
			"updated": "2024-03-07 09:42:26.561Z",
			"name": "module_params",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "ahmx7as3",
					"name": "module",
					"type": "relation",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"collectionId": "sqj645vi14kmjv7",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "rtm81fzb",
					"name": "key",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 4,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "nutptiru",
					"name": "value",
					"type": "json",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"maxSize": 2000000
					}
				}
			],
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_FYVhw8O` + "`" + ` ON ` + "`" + `module_params` + "`" + ` (\n  ` + "`" + `module` + "`" + `,\n  ` + "`" + `key` + "`" + `\n)",
				"CREATE INDEX ` + "`" + `idx_qLpDR9z` + "`" + ` ON ` + "`" + `module_params` + "`" + ` (` + "`" + `key` + "`" + `)"
			],
			"listRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= module.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"READ\" ||\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"viewRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= module.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"READ\" ||\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"createRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= module.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"updateRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= module.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"deleteRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= module.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("w51w37x6amh03jc")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
