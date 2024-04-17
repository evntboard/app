package model

type Storage struct {
	Id    string `json:"id"`
	Key   string `json:"key"`
	Value any    `json:"value"`
}
