package main

import (
	"github.com/google/uuid"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/models"
)

func (app *application) onCreateOrganization(e *core.RecordCreateEvent) error {
	collectionUO, err := app.pb.Dao().FindCollectionByNameOrId("user_organization")
	if err != nil {
		return err
	}

	collectionModule, err := app.pb.Dao().FindCollectionByNameOrId("modules")
	if err != nil {
		return err
	}

	collectionTrigger, err := app.pb.Dao().FindCollectionByNameOrId("triggers")
	if err != nil {
		return err
	}

	collectionTriggerCondition, err := app.pb.Dao().FindCollectionByNameOrId("trigger_conditions")
	if err != nil {
		return err
	}

	collectionShared, err := app.pb.Dao().FindCollectionByNameOrId("shareds")
	if err != nil {
		return err
	}

	recordUO := models.NewRecord(collectionUO)

	recordUO.Set("user", apis.RequestInfo(e.HttpContext).AuthRecord.Id)
	recordUO.Set("organization", e.Record.Id)
	recordUO.Set("role", "CREATOR")

	if err := app.pb.Dao().SaveRecord(recordUO); err != nil {
		return err
	}

	// create module board
	recordModuleBoard := models.NewRecord(collectionModule)
	recordModuleBoard.Set("organization", e.Record.Id)
	recordModuleBoard.Set("code", "board")
	recordModuleBoard.Set("name", "board")
	recordModuleBoard.Set("token", uuid.NewString())
	recordModuleBoard.Set("sub", "board;tmp:board")

	if err := app.pb.Dao().SaveRecord(recordModuleBoard); err != nil {
		return err
	}

	// create module media
	recordModuleMedia := models.NewRecord(collectionModule)
	recordModuleMedia.Set("organization", e.Record.Id)
	recordModuleMedia.Set("code", "media")
	recordModuleMedia.Set("name", "media")
	recordModuleMedia.Set("token", uuid.NewString())
	recordModuleMedia.Set("sub", "")

	if err := app.pb.Dao().SaveRecord(recordModuleMedia); err != nil {
		return err
	}

	// create README shared for board
	recordSharedReadme := models.NewRecord(collectionShared)
	recordSharedReadme.Set("organization", e.Record.Id)
	recordSharedReadme.Set("name", "/example/board/README")
	recordSharedReadme.Set("code", "/*\n\nThis is a basic example for board :)\n\nThis example just change the text of the btn-1 on click and the color of txt-1\n\nThe btn-2 on click launch a sound if you are connected to media module\n\n*/\n\n")
	recordSharedReadme.Set("enable", false)

	if err := app.pb.Dao().SaveRecord(recordSharedReadme); err != nil {
		return err
	}

	// create utils shared for board
	recordSharedUtils := models.NewRecord(collectionShared)
	recordSharedUtils.Set("organization", e.Record.Id)
	recordSharedUtils.Set("name", "/example/board/utils")
	recordSharedUtils.Set("code", "const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);\nconst randomByte = () => randomNumber(0, 255)\nconst randomPercent = () => (randomNumber(50, 100) * 0.01).toFixed(2)\nconst randomCssRgba = () => `rgba(${[randomByte(), randomByte(), randomByte(), randomPercent()].join(',')})`")
	recordSharedUtils.Set("enable", true)

	if err := app.pb.Dao().SaveRecord(recordSharedUtils); err != nil {
		return err
	}

	// create trigger btn-1 for board
	recordTriggerBtn1 := models.NewRecord(collectionTrigger)
	recordTriggerBtn1.Set("organization", e.Record.Id)
	recordTriggerBtn1.Set("name", "/example/board/btn-1")
	recordTriggerBtn1.Set("code", "// module.notify doesn't block the trigger execution\nconst result = module.notify(\n    \"board\",\n    \"updateText\",\n    {\n        \"text\": `${randomNumber(0,100)}`,\n        \"slug\": \"btn-1\"\n    }\n)\n\n// result is always null, module.notify return nothing\nlog('result', result)\n\n// wait for 100 ms\n\nsleep(100)\n\n// module.notify doesn't block the trigger execution\nmodule.notify(\n    \"board\",\n    \"updateColor\",\n    {\n        \"color\": `${randomCssRgba()}`,\n        \"slug\": \"txt-1\"\n    }\n)\n")
	recordTriggerBtn1.Set("enable", true)
	recordTriggerBtn1.Set("channel", "")

	if err := app.pb.Dao().SaveRecord(recordTriggerBtn1); err != nil {
		return err
	}

	// create trigger condition btn-1 for board
	recordTriggerConditionBtn1 := models.NewRecord(collectionTriggerCondition)
	recordTriggerConditionBtn1.Set("trigger", recordTriggerBtn1.Id)
	recordTriggerConditionBtn1.Set("name", "board-button-click")
	recordTriggerConditionBtn1.Set("code", "event.payload.slug === 'btn-1'")
	recordTriggerConditionBtn1.Set("enable", true)
	recordTriggerConditionBtn1.Set("timeout", 0)
	recordTriggerConditionBtn1.Set("type", "BASIC")

	if err := app.pb.Dao().SaveRecord(recordTriggerConditionBtn1); err != nil {
		return err
	}

	// create trigger btn-2 for board
	recordTriggerBtn2 := models.NewRecord(collectionTrigger)
	recordTriggerBtn2.Set("organization", e.Record.Id)
	recordTriggerBtn2.Set("name", "/example/board/btn-2")
	recordTriggerBtn2.Set("code", "// module.request block the trigger execution until module finish function execution\n// in that case we are waiting for the media play to finish\n// if no media module connected the trigger crash\nmodule.request(\n    \"media\",\n    \"play\",\n    {\n        url: \"https://www.myinstants.com/media/sounds/discord-sounds.mp3\",\n        volumne: 100\n    }\n)")
	recordTriggerBtn2.Set("enable", true)
	recordTriggerBtn2.Set("channel", "")

	if err := app.pb.Dao().SaveRecord(recordTriggerBtn2); err != nil {
		return err
	}

	// create trigger condition btn-2 for board
	recordTriggerConditionBtn2 := models.NewRecord(collectionTriggerCondition)
	recordTriggerConditionBtn2.Set("trigger", recordTriggerBtn2.Id)
	recordTriggerConditionBtn2.Set("name", "board-button-click")
	recordTriggerConditionBtn2.Set("code", "event.payload.slug === 'btn-2'")
	recordTriggerConditionBtn2.Set("enable", true)
	recordTriggerConditionBtn2.Set("timeout", 0)
	recordTriggerConditionBtn2.Set("type", "BASIC")

	if err := app.pb.Dao().SaveRecord(recordTriggerConditionBtn2); err != nil {
		return err
	}

	return nil
}
