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
			"id": "hwab0n5oeinwmjz",
			"created": "2024-03-07 09:42:26.562Z",
			"updated": "2024-03-07 09:42:26.562Z",
			"name": "user_organization",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "uu91hso3",
					"name": "user",
					"type": "relation",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"collectionId": "_pb_users_auth_",
						"cascadeDelete": false,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "qqx0mvz5",
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
					"id": "okz8brzm",
					"name": "role",
					"type": "select",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"maxSelect": 1,
						"values": [
							"CREATOR",
							"READ",
							"WRITE"
						]
					}
				}
			],
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_lZwweKP` + "`" + ` ON ` + "`" + `user_organization` + "`" + ` (\n  ` + "`" + `user` + "`" + `,\n  ` + "`" + `organization` + "`" + `\n)"
			],
			"listRule": "@request.auth.id != \"\" && \n(\n  @request.auth.id = user.id || (\n    @collection.user_organization.user.id ?= @request.auth.id &&\n    @collection.user_organization.organization.id ?= organization.id\n  )\n)",
			"viewRule": "@request.auth.id != \"\" && \n(\n  @request.auth.id = user.id || (\n    @collection.user_organization.user.id ?= @request.auth.id &&\n    @collection.user_organization.organization.id ?= organization.id\n  )\n)",
			"createRule": "@request.auth.id != \"\" && \n@collection.user_organization.user.id ?= @request.auth.id &&\n@collection.user_organization.organization.id ?= organization.id &&\n@collection.user_organization.role ?= \"CREATOR\"",
			"updateRule": "@request.auth.id != \"\" && \n@collection.user_organization.user.id ?= @request.auth.id &&\n@collection.user_organization.organization.id ?= organization.id &&\n@collection.user_organization.role ?= \"CREATOR\"",
			"deleteRule": "@request.auth.id != \"\" && \n@collection.user_organization.user.id ?= @request.auth.id &&\n@collection.user_organization.organization.id ?= organization.id &&\n@collection.user_organization.role ?= \"CREATOR\"",
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("hwab0n5oeinwmjz")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
