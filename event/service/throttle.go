package service

import (
	"context"
	"fmt"
	"time"
)

type ThrottleService struct {
	key     string
	timeout time.Duration
	lock    *LockService
}

func NewThrottleService(lock *LockService, key string, timeout time.Duration) *ThrottleService {
	return &ThrottleService{
		lock:    lock,
		key:     fmt.Sprintf("%s:throttle:lock", key),
		timeout: timeout,
	}
}

func (t *ThrottleService) ScheduleAction(action func(), cancelAction func()) {
	ctx := context.Background()

	lastExecutionTime, err := t.lock.GetLastExecutionTime(ctx, t.key)

	if err != nil {
		fmt.Printf("Error getting execution time to PostgreSQL: %v\n", err)
		cancelAction()
		return
	}

	if lastExecutionTime == nil {
		err = t.lock.InsertLockRecord(ctx, t.key)
		if err != nil {
			fmt.Printf("Error inserting execution time to PostgreSQL: %v\n", err)
			cancelAction()
			return
		}

		action()
		return
	}

	if err != nil {
		fmt.Printf("Error parsing last execution time: %v\n", err)
		cancelAction()
		return
	}

	if time.Since(*lastExecutionTime) >= t.timeout {
		if err := t.lock.UpdateLockRecord(ctx, t.key); err != nil {
			fmt.Printf("Error recording execution time to PostgreSQL: %v\n", err)
			cancelAction()
			return
		}
		action()
		return
	}

	cancelAction()
}
