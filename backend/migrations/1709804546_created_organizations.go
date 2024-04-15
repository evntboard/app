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
			"id": "sy0qvvpo60siidq",
			"created": "2024-03-07 09:42:26.562Z",
			"updated": "2024-03-07 09:42:26.562Z",
			"name": "organizations",
			"type": "base",
			"system": false,
			"schema": [
				{
					"system": false,
					"id": "lw0eq7ow",
					"name": "name",
					"type": "text",
					"required": true,
					"presentable": false,
					"unique": false,
					"options": {
						"min": 5,
						"max": null,
						"pattern": ""
					}
				},
				{
					"system": false,
					"id": "i5pgcu9z",
					"name": "avatar",
					"type": "file",
					"required": false,
					"presentable": false,
					"unique": false,
					"options": {
						"mimeTypes": [
							"image/png",
							"image/vnd.mozilla.apng",
							"image/jpeg",
							"image/gif",
							"image/webp",
							"image/tiff",
							"image/bmp",
							"image/svg+xml"
						],
						"thumbs": [],
						"maxSelect": 1,
						"maxSize": 5242880,
						"protected": false
					}
				}
			],
			"indexes": [
				"CREATE UNIQUE INDEX ` + "`" + `idx_p2FseEr` + "`" + ` ON ` + "`" + `organizations` + "`" + ` (` + "`" + `name` + "`" + `)"
			],
			"listRule": "@request.auth.id != \"\" &&\nuser_organization_via_organization.user ?= @request.auth.id",
			"viewRule": "@request.auth.id != \"\" &&\nuser_organization_via_organization.user ?= @request.auth.id",
			"createRule": "@request.auth.id != \"\"",
			"updateRule": "@request.auth.id != \"\" &&\nuser_organization_via_organization.user ?= @request.auth.id &&\n(\n  user_organization_via_organization.role ?= \"WRITE\" ||\n  user_organization_via_organization.role ?= \"CREATOR\"\n)",
			"deleteRule": "@request.auth.id != \"\" &&\nuser_organization_via_organization.user ?= @request.auth.id &&\n(\n  user_organization_via_organization.role ?= \"WRITE\" ||\n  user_organization_via_organization.role ?= \"CREATOR\"\n)",
			"options": {}
		}`

		collection := &models.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return daos.New(db).SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("sy0qvvpo60siidq")
		if err != nil {
			return err
		}

		return dao.DeleteCollection(collection)
	})
}
