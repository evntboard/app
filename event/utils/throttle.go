package utils

import (
	"context"
	"fmt"
	"github.com/redis/go-redis/v9"
	"time"
)

type Throttle struct {
	redisClient *redis.Client
	key         string
	timeout     time.Duration
}

func NewThrottle(redisClient *redis.Client, key string, timeout time.Duration) *Throttle {
	return &Throttle{
		redisClient: redisClient,
		key:         key,
		timeout:     timeout,
	}
}

func (t *Throttle) ShouldExecute() bool {
	lastExecutionTime, err := t.redisClient.Get(context.Background(), t.key).Result()
	if err != nil && err != redis.Nil {
		fmt.Printf("Error getting last execution time from Redis: %v\n", err)
		return false
	}

	if lastExecutionTime == "" {
		// First execution or no previous execution recorded
		return true
	}

	lastTime, err := time.Parse(time.RFC3339Nano, lastExecutionTime)
	if err != nil {
		fmt.Printf("Error parsing last execution time: %v\n", err)
		return false
	}

	elapsedTime := time.Since(lastTime)
	return elapsedTime >= t.timeout
}

func (t *Throttle) RecordExecutionTime() {
	currentTime := time.Now().Format(time.RFC3339Nano)
	err := t.redisClient.Set(context.Background(), t.key, currentTime, 0).Err()
	if err != nil {
		fmt.Printf("Error recording execution time to Redis: %v\n", err)
	}
}
