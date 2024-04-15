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

		collection, err := dao.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"allowEmailAuth": true,
			"allowOAuth2Auth": false,
			"allowUsernameAuth": false,
			"exceptEmailDomains": null,
			"manageRule": null,
			"minPasswordLength": 8,
			"onlyEmailDomains": null,
			"onlyVerified": true,
			"requireEmail": true
		}`), &options)
		collection.SetOptions(options)

		json.Unmarshal([]byte(`[
			"CREATE UNIQUE INDEX ` + "`" + `idx_f4NALZ3` + "`" + ` ON ` + "`" + `users` + "`" + ` (` + "`" + `name` + "`" + `)"
		]`), &collection.Indexes)

		return dao.SaveCollection(collection)
	}, func(db dbx.Builder) error {
		dao := daos.New(db);

		collection, err := dao.FindCollectionByNameOrId("_pb_users_auth_")
		if err != nil {
			return err
		}

		options := map[string]any{}
		json.Unmarshal([]byte(`{
			"allowEmailAuth": true,
			"allowOAuth2Auth": true,
			"allowUsernameAuth": false,
			"exceptEmailDomains": null,
			"manageRule": null,
			"minPasswordLength": 8,
			"onlyEmailDomains": null,
			"onlyVerified": false,
			"requireEmail": false
		}`), &options)
		collection.SetOptions(options)

		json.Unmarshal([]byte(`[]`), &collection.Indexes)

		return dao.SaveCollection(collection)
	})
}
