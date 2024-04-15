package main

import (
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/models"
)

type TriggerCondition struct {
	OrganizationID   string `db:"organization_id"`
	TriggerID        string `db:"trigger_id"`
	TriggerName      string `db:"trigger_name"`
	TriggerCode      string `db:"trigger_code"`
	TriggerChannel   string `db:"trigger_channel"`
	ConditionID      string `db:"condition_id"`
	ConditionName    string `db:"condition_name"`
	ConditionCode    string `db:"condition_code"`
	ConditionType    string `db:"condition_type"`
	ConditionTimeout int    `db:"condition_timeout"`
}

type ExportTrigger struct {
	Entity     string                   `json:"entity"`
	Code       string                   `json:"code"`
	Name       string                   `json:"name"`
	Channel    string                   `json:"channel"`
	Conditions []ExportTriggerCondition `json:"conditions"`
}

type ExportTriggerCondition struct {
	Code    string `json:"code"`
	Name    string `json:"name"`
	Timeout int32  `json:"timeout"`
	Type    string `json:"type"`
}

func (app *application) getConditionsForOrganizationAndEventName(organizationId string, eventName string) ([]*TriggerCondition, error) {
	var conditions []*TriggerCondition

	err := app.pb.Dao().DB().
		Select(
			"triggers.organization as organization_id",
			"triggers.id as trigger_id",
			"triggers.name as trigger_name",
			"triggers.code as trigger_code",
			"triggers.channel as trigger_channel",
			"trigger_conditions.id as condition_id",
			"trigger_conditions.name as condition_name",
			"trigger_conditions.code as condition_code",
			"trigger_conditions.type as condition_type",
			"trigger_conditions.timeout as condition_timeout",
		).
		From("trigger_conditions").
		InnerJoin("triggers", dbx.NewExp("trigger_conditions.trigger = triggers.id")).
		Where(dbx.HashExp{
			"triggers.organization":     organizationId,
			"trigger_conditions.name":   eventName,
			"trigger_conditions.enable": true,
			"triggers.enable":           true,
		}).
		All(&conditions)

	if err != nil {
		return nil, err
	}

	return conditions, nil
}

func (app *application) GetAvailableConditionNames(organizationId string) ([]*EventName, error) {
	var conditions []*EventName

	err := app.pb.Dao().DB().
		Select("trigger_conditions.name as name").
		From("trigger_conditions").
		InnerJoin("triggers", dbx.NewExp("trigger_conditions.trigger = triggers.id")).
		Where(dbx.HashExp{
			"triggers.organization": organizationId,
		}).
		All(&conditions)

	if err != nil {
		return nil, err
	}

	return conditions, nil
}

func (app *application) CreateTriggerFromExport(organizationId, path string, export ExportTrigger) error {
	collectionTrigger, err := app.pb.Dao().FindCollectionByNameOrId("triggers")
	if err != nil {
		return err
	}

	collectionCondition, err := app.pb.Dao().FindCollectionByNameOrId("trigger_conditions")
	if err != nil {
		return err
	}

	recordT := models.NewRecord(collectionTrigger)

	recordT.Set("organization", organizationId)
	recordT.Set("name", RemoveLastChar(path)+export.Name)
	recordT.Set("code", export.Code)
	recordT.Set("channel", export.Channel)

	if err := app.pb.Dao().SaveRecord(recordT); err != nil {
		return err
	}

	for _, condition := range export.Conditions {
		recordC := models.NewRecord(collectionCondition)
		recordC.Set("trigger", recordT.Id)
		recordC.Set("name", condition.Name)
		recordC.Set("code", condition.Code)
		recordC.Set("type", condition.Type)
		recordC.Set("timeout", condition.Timeout)

		if err := app.pb.Dao().SaveRecord(recordC); err != nil {
			return err
		}
	}

	return nil
}

func NewExportTriggerFromAny(entity map[string]interface{}) ExportTrigger {
	var trigger ExportTrigger
	for key, value := range entity {
		switch key {
		case "entity":
			if v, ok := value.(string); ok {
				trigger.Entity = v
			}
		case "code":
			if v, ok := value.(string); ok {
				trigger.Code = v
			}
		case "name":
			if v, ok := value.(string); ok {
				trigger.Name = v
			}
		case "channel":
			if v, ok := value.(string); ok {
				trigger.Channel = v
			}
		case "conditions":
			if conditions, ok := value.([]interface{}); ok {
				for _, condition := range conditions {
					if conditionMap, ok := condition.(map[string]interface{}); ok {
						var conditionStruct ExportTriggerCondition
						for conditionKey, conditionValue := range conditionMap {
							switch conditionKey {
							case "code":
								if v, ok := conditionValue.(string); ok {
									conditionStruct.Code = v
								}
							case "name":
								if v, ok := conditionValue.(string); ok {
									conditionStruct.Name = v
								}
							case "timeout":
								if v, ok := conditionValue.(int32); ok {
									conditionStruct.Timeout = v
								}
							case "type":
								if v, ok := conditionValue.(string); ok {
									conditionStruct.Type = v
								}
							}
						}
						trigger.Conditions = append(trigger.Conditions, conditionStruct)
					}
				}
			}
		}
	}
	return trigger
}
