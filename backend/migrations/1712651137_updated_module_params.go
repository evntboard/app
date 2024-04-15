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

		collection, err := dao.FindCollectionByNameOrId("w51w37x6amh03jc")
		if err != nil {
			return err
		}

		// update
		edit_module := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "ahmx7as3",
			"name": "module",
			"type": "relation",
			"required": true,
			"presentable": false,
			"unique": false,
			"options": {
				"collectionId": "sqj645vi14kmjv7",
				"cascadeDelete": true,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": null
			}
		}`), edit_module)
		collection.Schema.AddField(edit_module)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("w51w37x6amh03jc")
		if err != nil {
			return err
		}

		// update
		edit_module := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
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
		}`), edit_module)
		collection.Schema.AddField(edit_module)

		return dao.SaveCollection(collection)
	})
}
