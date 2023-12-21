package model

type Shared struct {
	ID     string `db:"id"`
	Name   string `db:"name"`
	Enable bool   `db:"enable"`
	Code   string `db:"code"`
}
