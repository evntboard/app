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
			"id": "yecumyhdy7tdsi8",
			"created": "2024-03-07 09:42:26.562Z",
			"updated": "2024-03-07 09:42:26.562Z",
			"name": "trigger_conditions",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "lo4xeeop",
					"name": "trigger",
					"type": "relation",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"collectionId": "vg93csibbyxn00k",
						"cascadeDelete": true,
						"minSelect": null,
						"maxSelect": 1,
						"displayFields": null
					}
				},
				{
					"system": false,
					"id": "yfiwlsip",
					"name": "name",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 2,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "rpeeynqr",
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
					"id": "eimlazzr",
					"name": "enable",
					"type": "bool",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {}
				},
				{
					"system": false,
					"id": "ginswvib",
					"name": "timeout",
					"type": "number",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 0,
						"max": null,
						"noDecimal": true
					}
				},
				{
					"system": false,
					"id": "pb4qebmo",
					"name": "type",
					"type": "select",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"maxSelect": 1,
						"values": [
							"BASIC",
							"THROTTLE",
							"DEBOUNCE"
						]
					}
				}
			],
			"indexes": [],
			"listRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= trigger.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"READ\" ||\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"viewRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= trigger.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"READ\" ||\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"createRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= trigger.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"updateRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= trigger.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"deleteRule": "@request.auth.id != \"\" &&\n@collection.user_organization.organization.id ?= trigger.organization.id &&\n@collection.user_organization.user.id ?= @request.auth.id &&\n(\n  @collection.user_organization.role ?= \"WRITE\" ||\n  @collection.user_organization.role ?= \"CREATOR\"\n)",
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("yecumyhdy7tdsi8")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
