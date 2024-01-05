package main

import (
	"github.com/evntboard/app/event/service"
	"github.com/joho/godotenv"
	"log"
)

func main() {
	_ = godotenv.Load()

	globalConfig := service.NewConfigService()

	databaseService := service.NewDbService(globalConfig)
	natsService := service.NewNatsService(globalConfig)

	storageService := service.NewStorage(databaseService)
	sharedService := service.NewSharedService(databaseService)
	triggerService := service.NewTriggerService(databaseService)
	eventService := service.NewEventService(databaseService)
	processService := service.NewProcessService(databaseService)
	moduleSessionService := service.NewModuleSessionService(databaseService)
	processRequestService := service.NewProcessRequestService(databaseService)
	processLogService := service.NewProcessLogService(databaseService)
	lockService := service.NewLockService(databaseService)

	evt := service.NewEventsManagerService(
		sharedService,
		triggerService,
		eventService,
		processService,
		storageService,
		moduleSessionService,
		processRequestService,
		processLogService,
		natsService,
		lockService,
	)

	err := evt.StartProcessEvents()
	if err != nil {
		log.Fatalln(err)
	}
}
