package utils

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
	"time"
)

type Debounce struct {
	key         string
	timeout     time.Duration
	redisClient *redis.Client
	lock        *ChannelLock
}

func NewDebounce(redisClient *redis.Client, key string, timeout time.Duration) *Debounce {
	return &Debounce{
		lock:        NewChannelLock(redisClient, fmt.Sprintf("%s:lock", key), timeout),
		redisClient: redisClient,
		key:         key,
		timeout:     timeout,
	}
}

func (d *Debounce) ScheduleAction(action func(), cancelAction func()) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// cancel others !
	d.redisClient.Publish(ctx, fmt.Sprintf("%s:cancel", d.key), "")

	pubsub := d.redisClient.Subscribe(ctx, fmt.Sprintf("%s:cancel", d.key))
	defer pubsub.Close()

	select {
	case <-ctx.Done():
		cancelAction()
	case <-pubsub.Channel():
		cancelAction()
	case <-time.After(d.timeout):
		err := d.lock.Lock(ctx)
		if err != nil {
			cancelAction()
			break
		}
		defer d.lock.Unlock(ctx)

		lastExecutionTime, err := d.redisClient.Get(ctx, d.key).Result()
		if err != nil && err != redis.Nil {
			fmt.Printf("Error getting last execution time from Redis: %v\n", err)
			cancelAction()
			break
		}

		if lastExecutionTime == "" {
			currentTime := time.Now().Format(time.RFC3339Nano)
			err = d.lock.redisClient.Set(ctx, d.key, currentTime, 0).Err()
			if err != nil {
				fmt.Printf("Error recording execution time to Redis: %v\n", err)
				cancelAction()
				break
			}

			action()
			return
		}

		lastTime, err := time.Parse(time.RFC3339Nano, lastExecutionTime)
		if err != nil {
			fmt.Printf("Error parsing last execution time: %v\n", err)
			cancelAction()
			return
		}

		if time.Since(lastTime) >= d.timeout {
			currentTime := time.Now().Format(time.RFC3339Nano)
			err = d.redisClient.Set(ctx, d.key, currentTime, 0).Err()
			if err != nil {
				fmt.Printf("Error recording execution time to Redis: %v\n", err)
				cancelAction()
				return
			}
			action()
		} else {
			cancelAction()
		}
	}
}
