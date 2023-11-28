package model

type AppConfigDatabase struct {
	Port     int
	Host     string
	Username string
	Password string
	DB       string
}

type AppConfigRedis struct {
	Port     int
	Host     string
	Password string
	DB       int
}

type AppConfig struct {
	Database *AppConfigDatabase
	Redis    *AppConfigRedis
}
