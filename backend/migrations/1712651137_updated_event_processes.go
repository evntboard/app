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

		collection, err := dao.FindCollectionByNameOrId("k6am2xon4a97e8a")
		if err != nil {
			return err
		}

		// update
		edit_trigger := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "a5djqov2",
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
		}`), edit_trigger)
		collection.Schema.AddField(edit_trigger)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("k6am2xon4a97e8a")
		if err != nil {
			return err
		}

		// update
		edit_trigger := &schema.SchemaField{}
		json.Unmarshal([]byte(`{
			"system": false,
			"id": "a5djqov2",
			"name": "trigger",
			"type": "relation",
			"required": true,
			"presentable": false,
			"unique": false,
			"options": {
				"collectionId": "vg93csibbyxn00k",
				"cascadeDelete": false,
				"minSelect": null,
				"maxSelect": 1,
				"displayFields": null
			}
		}`), edit_trigger)
		collection.Schema.AddField(edit_trigger)

		return dao.SaveCollection(collection)
	})
}
