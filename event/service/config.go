package service

import (
	"errors"
	"github.com/evntboard/app/event/model"
	"os"
	"strconv"
)

type ConfigService struct {
	GlobalConfig *model.AppConfig
}

func NewConfigService() *ConfigService {
	sc := &ConfigService{
		GlobalConfig: &model.AppConfig{
			DatabaseUrl: "postgres://tilican:1234@localhost:5432/evntboard?schema=public",
			NatsUrl:     "localhost:4222",
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
	if databaseUrl, err := c.getenvStr("DATABASE_URL"); err == nil {
		c.GlobalConfig.DatabaseUrl = databaseUrl
	}
	if natsUrl, err := c.getenvStr("NATS_URL"); err == nil {
		c.GlobalConfig.NatsUrl = natsUrl
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
