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

		collection, err := dao.FindCollectionByNameOrId("vi5uqe47c028dm2")
		if err != nil {
			return err
		}

		// update
		edit_organization := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "kz1bdzo6",
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

		collection, err := dao.FindCollectionByNameOrId("vi5uqe47c028dm2")
		if err != nil {
			return err
		}

		// update
		edit_organization := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "kz1bdzo6",
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
