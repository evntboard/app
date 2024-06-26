package main

import (
	"database/sql"
	"errors"
	"github.com/evntboard/app/backend/utils"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
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
	recordT.Set("name", utils.RemoveLastChar(path)+export.Name)
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

func (app *application) onBeforeCreateTrigger(e *core.ModelEvent) error {
	record, _ := e.Model.(*models.Record)

	_, err := app.pb.Dao().FindFirstRecordByFilter(
		"shareds",
		"organization = {:organizationId} && name = {:name}",
		dbx.Params{
			"organizationId": record.GetString("organization"),
			"name":           record.GetString("name"),
		},
	)

	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		return err
	}

	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}

	return errors.New("a shared already exists with this name")
}
