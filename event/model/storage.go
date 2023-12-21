package model

type Storage struct {
	ID             string `db:"id"`
	Key            string `db:"key"`
	Value          any    `db:"value"`
	OrganizationId string `db:"organization_id"`
}
