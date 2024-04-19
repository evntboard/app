package database

import (
	"fmt"
	"github.com/evntboard/app/backend/internal/model"
	"github.com/pluja/pocketbase"
	"strings"
)

func (app *PocketBaseClient) GetSharedByPath(organizationId string, triggerName string) ([]*model.Shared, error) {
	validatePath := func(path string) string {
		keywords := strings.Split(path, "/")
		if keywords[len(keywords)-1] != "/" {
			keywords = keywords[:len(keywords)-1]
		}

		res := make([]string, len(keywords))

		for i := range keywords {
			wantedKeywords := keywords[:(i + 1)]
			res[i] = "(name ~ \"" + strings.Join(wantedKeywords, "/") + "/%\" && name !~ \"" + strings.Join(wantedKeywords, "/") + "/%/%\" )"
		}
		return "(" + strings.Join(res, " || ") + ")"
	}

	collection := pocketbase.CollectionSet[*model.Shared](app.pb, "shareds")

	filterStr := fmt.Sprintf("organization = \"%s\" && %s", organizationId, validatePath(triggerName))

	records, err := collection.List(
		pocketbase.ParamsList{
			Page:    0,
			Size:    500,
			Filters: filterStr,
			Sort:    "-created",
			Expand:  "",
			Fields:  "",
		},
	)

	return records.Items, err
}
