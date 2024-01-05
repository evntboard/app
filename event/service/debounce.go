package service

import (
	"context"
	"fmt"
	"github.com/nats-io/nats.go"
	"log"
	"time"
)

type DebounceService struct {
	keyLock   string
	keyCancel string
	timeout   time.Duration
	lock      *LockService
	nats      *NatsService
}

func NewDebounceService(lock *LockService, nats *NatsService, key string, timeout time.Duration) *DebounceService {
	return &DebounceService{
		lock:      lock,
		keyLock:   fmt.Sprintf("%s:debounce-lock", key),
		keyCancel: fmt.Sprintf("%s:debounce-cancel", key),
		timeout:   timeout,
		nats:      nats,
	}
}

func (d *DebounceService) ScheduleAction(action func(), cancelAction func()) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	d.nats.Nats.Publish(d.keyCancel, []byte(""))

	msgChan := make(chan struct{})

	go func() {
		sub, err := d.nats.Nats.SubscribeSync(d.keyCancel)
		if err != nil {
			log.Fatal(err)
		}

		for {
			_, err := sub.NextMsg(time.Second * 10)
			if err != nil {
				if err == nats.ErrTimeout {
					continue
				}
				log.Fatal(err)
			}

			msgChan <- struct{}{}
		}
	}()

	select {
	case <-ctx.Done():
		cancelAction()
	case <-msgChan:
		cancelAction()
	case <-time.After(d.timeout):
		lastExecutionTime, err := d.lock.GetLastExecutionTime(ctx, d.keyLock)

		if err != nil {
			fmt.Printf("Error getting last execution time from PostgreSQL: %v\n", err)
			cancelAction()
			break
		}

		if lastExecutionTime == nil {
			err = d.lock.InsertLockRecord(ctx, d.keyLock)
			if err != nil {
				fmt.Printf("Error inserting execution time to PostgreSQL: %v\n", err)
				cancelAction()
				break
			}

			action()
			return
		}

		if err != nil {
			fmt.Printf("Error parsing last execution time: %v\n", err)
			cancelAction()
			return
		}

		if time.Since(*lastExecutionTime) >= d.timeout {
			if err := d.lock.UpdateLockRecord(ctx, d.keyLock); err != nil {
				fmt.Printf("Error recording execution time to PostgreSQL: %v\n", err)
				cancelAction()
				return
			}
			action()
		} else {
			cancelAction()
		}
	}
}
