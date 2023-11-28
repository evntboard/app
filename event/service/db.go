package service

import (
	"fmt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
)

type DbService struct {
	Db            *gorm.DB
	configService *ConfigService
}

func NewDbService(configService *ConfigService) *DbService {
	db := &DbService{
		configService: configService,
	}
	db.InitDB()
	return db
}

func (c *DbService) InitDB() {
	log.Printf("Load database %s from %s:%d\n", c.configService.GlobalConfig.Database.DB, c.configService.GlobalConfig.Database.Host, c.configService.GlobalConfig.Database.Port)

	dbUrl := fmt.Sprintf(
		"postgresql://%s:%s@%s:%d/%s",
		c.configService.GlobalConfig.Database.Username,
		c.configService.GlobalConfig.Database.Password,
		c.configService.GlobalConfig.Database.Host,
		c.configService.GlobalConfig.Database.Port,
		c.configService.GlobalConfig.Database.DB,
	)

	newDB, err := gorm.Open(postgres.Open(dbUrl), &gorm.Config{})
	if err != nil {
		panic(fmt.Sprintln("Error when opening the database:", err.Error()))
	}

	c.Db = newDB
}
