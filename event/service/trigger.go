package service

import "C"
import (
	"errors"
	"github.com/evntboard/cloud/event/model"
)

type TriggerService struct {
	dbService *DbService
}

func NewTriggerService(dbService *DbService) *TriggerService {
	return &TriggerService{dbService}
}

func (c *TriggerService) EventForTriggerCondition(event string, organizationId string) []*model.TriggerCondition {
	var conditions []*model.TriggerCondition
	c.dbService.Db.Preload("Trigger").Joins("INNER JOIN trigger ON condition.trigger_id = trigger.id").
		Where("trigger.organization_id = ? AND condition.name = ? AND condition.enable = true AND trigger.enable = true", organizationId, event).
		Find(&conditions)
	return conditions
}

func (c *TriggerService) GetTriggerByID(id string) (*model.Trigger, error) {
	var trigger *model.Trigger
	result := c.dbService.Db.Preload("Conditions").Where("id = ?", id).Limit(1).Find(&trigger)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, errors.New("No result found")
	}
	return trigger, nil
}

func (c *TriggerService) GetTriggersByIDs(ids []string) ([]*model.Trigger, error) {
	var triggers []*model.Trigger
	result := c.dbService.Db.Preload("Conditions").Where("id IN (?)", ids).Find(&triggers)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, errors.New("No result found")
	}
	return triggers, nil
}
