package service

import (
	"context"
	"fmt"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DbService struct {
	Db            *pgxpool.Pool
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
	ctx := context.Background()
	config, err := pgxpool.ParseConfig(c.configService.GlobalConfig.DatabaseUrl)
	if err != nil {
		panic(fmt.Sprintf("Error parsing connection string: %v", err))
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)

	if err != nil {
		panic(fmt.Sprintf("Error connection database : %v", err))
	}

	c.Db = pool
}
