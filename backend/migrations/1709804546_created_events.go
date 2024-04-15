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
			"id": "8l5w6ox66w2yy6t",
			"created": "2024-03-07 09:42:26.561Z",
			"updated": "2024-03-07 09:42:26.561Z",
			"name": "events",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "ds4hoo17",
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
					"id": "ehrdazoz",
					"name": "name",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 4,
						"max": null,
						"pattern": "^[a-z_-]+$"
					}
				},
				{
					"system": false,
					"id": "evjzgls5",
					"name": "payload",
					"type": "json",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"maxSize": 2000000
					}
				},
				{
					"system": false,
					"id": "pizpt1m3",
					"name": "emitter_code",
					"type": "text",
					"required": true,
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
					"id": "mbtnboju",
					"name": "emitter_name",
					"type": "text",
					"required": true,
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
					"id": "lpvklck6",
					"name": "emitted_at",
					"type": "date",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": "",
						"max": ""
					}
				}
			],
			"indexes": [
				"CREATE INDEX ` + "`" + `idx_sEsk4dy` + "`" + ` ON ` + "`" + `events` + "`" + ` (` + "`" + `name` + "`" + `)"
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

		collection, err := dao.FindCollectionByNameOrId("8l5w6ox66w2yy6t")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
