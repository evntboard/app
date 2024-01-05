package service

import (
	"context"
	"encoding/json"
	"time"
)

type ProcessRequestService struct {
	dbService *DbService
}

func NewProcessRequestService(dbService *DbService) *ProcessRequestService {
	return &ProcessRequestService{dbService}
}

func (s *ProcessRequestService) CreateProcessRequest(
	requestID string,
	method string,
	params interface{},
	notification bool,
	moduleID string,
	processID string,
) error {
	ctx := context.Background()

	_, err := s.dbService.Db.Exec(
		ctx,
		`INSERT INTO process_request (id, method, params, notification, request_date, module_id, process_id) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		requestID,
		method,
		params,
		notification,
		time.Now(),
		moduleID,
		processID,
	)

	return err
}

func (s *ProcessRequestService) UpdateResult(
	result interface{},
	requestID string,
) error {
	ctx := context.Background()

	resultJSON, err := json.Marshal(result)
	if err != nil {
		return err
	}

	_, err = s.dbService.Db.Exec(
		ctx,
		`UPDATE process_request SET result = $1, response_date = $2 WHERE id = $3`,
		resultJSON,
		time.Now(),
		requestID,
	)

	return err
}

func (s *ProcessRequestService) UpdateError(
	errValue interface{},
	requestID string,
) error {
	ctx := context.Background()

	errJSON, err := json.Marshal(errValue)
	if err != nil {
		return err
	}

	_, err = s.dbService.Db.Exec(
		ctx,
		`UPDATE process_request SET error = $1, response_date = $2 WHERE id = $3`,
		errJSON,
		time.Now(),
		requestID,
	)

	return err
}
