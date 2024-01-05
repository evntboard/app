package service

import (
	"context"
	"github.com/lucsky/cuid"
	"time"
)

type ProcessLogService struct {
	dbService *DbService
}

func NewProcessLogService(dbService *DbService) *ProcessLogService {
	return &ProcessLogService{dbService}
}

func (s *ProcessLogService) AddProcessLog(
	processId string,
	log any,
) error {
	ctx := context.Background()

	_, err := s.dbService.Db.Exec(
		ctx,
		`
        INSERT INTO process_log (id, process_id, log, date)VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
        SET log = EXCLUDED.log
		`,
		cuid.New(),
		processId,
		log,
		time.Now(),
	)

	if err != nil {
		return err
	}

	return nil
}
