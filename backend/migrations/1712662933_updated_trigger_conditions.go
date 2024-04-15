package migrations

import (
	"encoding/json"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/daos"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("yecumyhdy7tdsi8")
		if err != nil {
			return err
		}

		json.Unmarshal([]byte(`[
			"CREATE UNIQUE INDEX ` + "`" + `idx_OdffFJI` + "`" + ` ON ` + "`" + `trigger_conditions` + "`" + ` (\n  ` + "`" + `trigger` + "`" + `,\n  ` + "`" + `name` + "`" + `\n)"
		]`), &collection.Indexes)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("yecumyhdy7tdsi8")
		if err != nil {
			return err
		}

		json.Unmarshal([]byte(`[]`), &collection.Indexes)

		return dao.SaveCollection(collection)
	})
}
