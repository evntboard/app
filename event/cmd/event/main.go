package main

import (
	"github.com/evntboard/app/event/service"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	globalConfig := service.NewConfigService()

	databaseService := service.NewDbService(globalConfig)
	redisService := service.NewRedisService(globalConfig)

	storageTempService := service.NewStorageTemporary()
	storagePersistentService := service.NewStoragePersistent(databaseService)
	sharedService := service.NewSharedService(databaseService)
	triggerService := service.NewTriggerService(databaseService)

	evt := service.NewEventsManagerService(
		sharedService,
		triggerService,
		storagePersistentService,
		storageTempService,
		redisService,
	)

	evt.StartProcessEvents()
}
