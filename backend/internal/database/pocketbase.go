package database

import "github.com/pluja/pocketbase"

type PocketBaseClient struct {
	pb *pocketbase.Client
}

func NewPocketBaseClient(pocketBaseURL, pocketBaseAdminEmail, pocketBaseAdminPassword string) *PocketBaseClient {
	client := pocketbase.NewClient(
		pocketBaseURL,
		pocketbase.WithAdminEmailPassword(
			pocketBaseAdminEmail,
			pocketBaseAdminPassword,
		),
	)

	return &PocketBaseClient{
		pb: client,
	}
}
