package service

import (
	"context"
	"errors"
	"github.com/jackc/pgx/v5"
	"time"
)

type LockService struct {
	dbService *DbService
}

func NewLockService(dbService *DbService) *LockService {
	return &LockService{
		dbService: dbService,
	}
}

func (ls *LockService) InsertLockRecord(ctx context.Context, key string) error {
	_, err := ls.dbService.Db.Exec(ctx, "INSERT INTO lock (key, date) VALUES ($1, CURRENT_TIMESTAMP)", key)
	return err
}

func (ls *LockService) GetLastExecutionTime(ctx context.Context, key string) (*time.Time, error) {
	var lastExecutionTime *time.Time
	if err := ls.dbService.Db.QueryRow(ctx, "SELECT date FROM lock WHERE key = $1", key).Scan(&lastExecutionTime); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, err
	}
	return lastExecutionTime, nil
}

func (ls *LockService) UpdateLockRecord(ctx context.Context, key string) error {
	_, err := ls.dbService.Db.Exec(ctx, "UPDATE lock SET date = CURRENT_TIMESTAMP WHERE key = $1", key)
	return err
}

func (ls *LockService) DeleteLockRecord(ctx context.Context, key string) error {
	_, err := ls.dbService.Db.Exec(ctx, "DELETE FROM lock WHERE key = $1", key)
	return err
}

func (ls *LockService) Lock(ctx context.Context, lockKey string, timeout time.Duration) error {
	chResult := make(chan bool)

	ctx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	go func() {
		for {
			select {
			case <-ctx.Done():
				chResult <- false
				return
			default:
				if err := ls.InsertLockRecord(ctx, lockKey); err != nil {
					time.Sleep(100 * time.Millisecond)
					continue
				}

				chResult <- true
				return
			}
		}
	}()

	if ok := <-chResult; !ok {
		return errors.New("TIMEOUT")
	}

	return nil
}

func (ls *LockService) Unlock(ctx context.Context, lockKey string) error {
	return ls.DeleteLockRecord(ctx, lockKey)
}
