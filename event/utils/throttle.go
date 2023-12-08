package utils

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
	"time"
)

type Throttle struct {
	key         string
	timeout     time.Duration
	redisClient *redis.Client
	lock        *ChannelLock
}

func NewThrottle(redisClient *redis.Client, key string, timeout time.Duration) *Throttle {
	return &Throttle{
		lock:        NewChannelLock(redisClient, fmt.Sprintf("%s:lock", key), timeout),
		key:         key,
		timeout:     timeout,
		redisClient: redisClient,
	}
}

func (t *Throttle) ScheduleAction(action func(), cancelAction func()) {
	ctx := context.Background()

	err := t.lock.Lock(ctx)
	if err != nil {
		cancelAction()
		return
	}
	defer t.lock.Unlock(ctx)

	lastExecutionTime, err := t.redisClient.Get(ctx, t.key).Result()
	if err != nil && err != redis.Nil {
		fmt.Printf("Error getting last execution time from Redis: %v\n", err)
		cancelAction()
		return
	}

	if lastExecutionTime == "" {
		currentTime := time.Now().Format(time.RFC3339Nano)
		err = t.redisClient.Set(ctx, t.key, currentTime, 0).Err()
		if err != nil {
			fmt.Printf("Error recording execution time to Redis: %v\n", err)
			cancelAction()
			return
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

	if time.Since(lastTime) >= t.timeout {
		currentTime := time.Now().Format(time.RFC3339Nano)
		err = t.redisClient.Set(ctx, t.key, currentTime, 0).Err()
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
