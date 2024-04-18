package database

import (
	"fmt"
	"github.com/evntboard/app/backend/internal/model"
	"github.com/pluja/pocketbase"
)

func (c *PocketBaseClient) GetConditionsForOrganizationAndEventName(organizationId string, eventName string) ([]*model.TriggerCondition, error) {
	collection := pocketbase.CollectionSet[*model.TriggerCondition](c.pb, "trigger_conditions")
	filterStr := fmt.Sprintf("trigger.organization = \"%s\" && trigger.enable = true && name = \"%s\" && enable = true", organizationId, eventName)
	resp, err := collection.List(pocketbase.ParamsList{
		Page:    0,
		Size:    500,
		Filters: filterStr,
		Sort:    "",
		Expand:  "trigger",
		Fields:  "",
	})

	return resp.Items, err
}
