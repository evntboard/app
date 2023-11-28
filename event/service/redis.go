package service

import (
	"fmt"
	"github.com/redis/go-redis/v9"
	"log"
)

type RedisService struct {
	Client        *redis.Client
	configService *ConfigService
}

func NewRedisService(configService *ConfigService) *RedisService {
	db := &RedisService{
		configService: configService,
	}
	db.InitDB()
	return db
}

func (c *RedisService) InitDB() {
	log.Printf("Load REDIS\n")

	newClient := redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:%d", c.configService.GlobalConfig.Redis.Host, c.configService.GlobalConfig.Redis.Port),
		Password: c.configService.GlobalConfig.Redis.Password,
		DB:       c.configService.GlobalConfig.Redis.DB,
	})

	c.Client = newClient
}
