package service

import (
	"context"
	"github.com/evntboard/app/event/model"
	"log"
)

type TriggerService struct {
	dbService *DbService
}

func NewTriggerService(dbService *DbService) *TriggerService {
	return &TriggerService{dbService}
}

func (c *TriggerService) EventForTriggerCondition(organizationID string, eventName string) ([]*model.TriggerConditionResult, error) {
	ctx := context.Background()

	query := `
		SELECT trigger.organization_id as organization_id,
		       trigger.id              as trigger_id,
		       trigger.name            as trigger_name,
		       trigger.code            as trigger_code,
		       trigger.channel         as trigger_channel,
		       condition.id            as condition_id,
		       condition.name          as condition_name,
		       condition.code          as condition_code,
		       condition.type          as condition_type,
		       condition.timeout       as condition_timeout
		FROM condition
		         INNER JOIN trigger ON condition.trigger_id = trigger.id
		WHERE trigger.organization_id = $1
		  AND condition.name = $2
		  AND condition.enable = true
		  AND trigger.enable = true
	`

	rows, err := c.dbService.Db.Query(ctx, query, organizationID, eventName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []*model.TriggerConditionResult

	for rows.Next() {
		var result = &model.TriggerConditionResult{}
		err := rows.Scan(
			&result.OrganizationID,
			&result.TriggerID,
			&result.TriggerName,
			&result.TriggerCode,
			&result.TriggerChannel,
			&result.ConditionID,
			&result.ConditionName,
			&result.ConditionCode,
			&result.ConditionType,
			&result.ConditionTimeout,
		)
		if err != nil {
			log.Println(err)
		}
		results = append(results, result)
	}

	return results, rows.Err()
}
