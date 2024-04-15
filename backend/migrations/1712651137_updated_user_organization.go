package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
	"github.com/pocketbase/pocketbase/models/schema"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("hwab0n5oeinwmjz")
		if err != nil {
			return err
		}

		// update
		edit_user := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "uu91hso3",
			"name": "user",
			"type": "relation",
			"required": true,
			"presentable": false,
			"unique": false,
			"options": {
				"collectionId": "_pb_users_auth_",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": null
			}
		}`), edit_user)
		collection.Schema.AddField(edit_user)

		// update
		edit_organization := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "qqx0mvz5",
			"name": "organization",
			"type": "relation",
			"required": true,
			"presentable": false,
			"unique": false,
			"options": {
				"collectionId": "sy0qvvpo60siidq",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": null
			}
		}`), edit_organization)
		collection.Schema.AddField(edit_organization)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("hwab0n5oeinwmjz")
		if err != nil {
			return err
		}

		// update
		edit_user := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
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
		}`), edit_user)
		collection.Schema.AddField(edit_user)

		// update
		edit_organization := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
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
		}`), edit_organization)
		collection.Schema.AddField(edit_organization)

		return dao.SaveCollection(collection)
	})
}
