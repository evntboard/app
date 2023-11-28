package utils

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
	"sync"
	"time"
)

type Debounce struct {
	redisClient *redis.Client
	key         string
	timeout     time.Duration
	mu          sync.Mutex
}

func NewDebounce(redis *redis.Client, key string, timeout time.Duration) *Debounce {
	return &Debounce{
		redisClient: redis,
		key:         key,
		timeout:     timeout,
	}
}

func (d *Debounce) ScheduleAction(action func(), cancelAction func()) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.timeout > 0 {
		// If a timeout is specified, schedule the action for later
		go func() {
			time.Sleep(d.timeout)
			d.executeAction(action)
		}()
	} else {
		// If no timeout is specified, execute the action immediately
		d.executeAction(action)
	}
}

func (d *Debounce) executeAction(action func()) {
	cancelledKey := d.key + ":cancelled"
	d.mu.Lock()
	defer d.mu.Unlock()

	// Check if the action has been cancelled
	cancelled, err := d.redisClient.Get(context.Background(), cancelledKey).Bool()
	if err != nil && err != redis.Nil {
		fmt.Printf("Error getting cancellation status from Redis: %v\n", err)
		return
	}

	if !cancelled {
		// Execute the action only if it has not been cancelled
		action()

		// Reset the cancellation status
		err = d.redisClient.Set(context.Background(), cancelledKey, false, 0).Err()
		if err != nil {
			fmt.Printf("Error resetting cancellation status in Redis: %v\n", err)
		}
	}
}

func (d *Debounce) CancelAction() {
	d.mu.Lock()
	defer d.mu.Unlock()

	// Set the cancellation status to true
	err := d.redisClient.Set(context.Background(), d.key+":cancelled", true, 0).Err()
	if err != nil {
		fmt.Printf("Error setting cancellation status in Redis: %v\n", err)
	}
}
