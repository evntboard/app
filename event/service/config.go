package service

import (
	"errors"
	"github.com/evntboard/cloud/event/model"
	"os"
	"strconv"
)

type ConfigService struct {
	GlobalConfig *model.AppConfig
}

func NewConfigService() *ConfigService {
	sc := &ConfigService{
		GlobalConfig: &model.AppConfig{
			Database: &model.AppConfigDatabase{
				Port:     5432,
				Host:     "localhost",
				Username: "tilican",
				Password: "1234",
				DB:       "evntboard",
			},
			Redis: &model.AppConfigRedis{
				Port:     6379,
				Host:     "localhost",
				Password: "",
				DB:       0,
			},
		},
	}
	err := sc.Load()
	if err != nil {
		panic(err)
	}
	return sc
}

var ErrEnvVarEmpty = errors.New("getenv: environment variable empty")

func (c *ConfigService) Load() error {
	if host, err := c.getenvStr("DB_HOST"); err == nil {
		c.GlobalConfig.Database.Host = host
	}

	if port, err := c.getenvInt("DB_PORT"); err == nil {
		c.GlobalConfig.Database.Port = port
	}

	if username, err := c.getenvStr("DB_USERNAME"); err == nil {
		c.GlobalConfig.Database.Username = username
	}

	if password, err := c.getenvStr("DB_PASSWORD"); err == nil {
		c.GlobalConfig.Database.Password = password
	}

	if dbName, err := c.getenvStr("DB_NAME"); err == nil {
		c.GlobalConfig.Database.DB = dbName
	}

	if host, err := c.getenvStr("REDIS_HOST"); err == nil {
		c.GlobalConfig.Redis.Host = host
	}

	if port, err := c.getenvInt("REDIS_PORT"); err == nil {
		c.GlobalConfig.Redis.Port = port
	}

	if password, err := c.getenvStr("REDIS_PASSWORD"); err == nil {
		c.GlobalConfig.Redis.Password = password
	}

	if dbNumber, err := c.getenvInt("REDIS_DB"); err == nil {
		c.GlobalConfig.Redis.DB = dbNumber
	}
	return nil
}

func (c *ConfigService) getenvStr(key string) (string, error) {
	v := os.Getenv(key)
	if v == "" {
		return v, ErrEnvVarEmpty
	}
	return v, nil
}

func (c *ConfigService) getenvInt(key string) (int, error) {
	s, err := c.getenvStr(key)
	if err != nil {
		return 0, err
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return 0, err
	}
	return v, nil
}

func (c *ConfigService) getenvBool(key string) (bool, error) {
	s, err := c.getenvStr(key)
	if err != nil {
		return false, err
	}
	v, err := strconv.ParseBool(s)
	if err != nil {
		return false, err
	}
	return v, nil
}
