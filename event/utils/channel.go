package utils

import (
	"context"
	"errors"
	"fmt"
	"github.com/redis/go-redis/v9"
	"time"
)

type ChannelLock struct {
	redisClient *redis.Client
	lockKey     string
	timeout     time.Duration
}

func NewChannelLock(redisClient *redis.Client, lockKey string, timeout time.Duration) *ChannelLock {
	return &ChannelLock{
		redisClient: redisClient,
		timeout:     timeout,
		lockKey:     lockKey,
	}
}

func (c *ChannelLock) Lock(ctx context.Context, value string) error {
	chResult := make(chan bool)

	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	go func() {
		for {
			select {
			case <-ctx.Done():
				chResult <- false
				return
			default:
				lockAcquired, err := c.redisClient.SetNX(ctx, c.lockKey, value, 0).Result()

				if err != nil {
					fmt.Printf("Erreur lors de l'acquisition du verrou : %v\n", err)
				}

				if lockAcquired {
					chResult <- true
					return
				} else {
					time.Sleep(100 * time.Millisecond)
				}
			}
		}
	}()

	if ok := <-chResult; !ok {
		return errors.New("TIMEOUT")
	}

	return nil
}

func (c *ChannelLock) Unlock(ctx context.Context) error {
	// Libération du verrou
	_, err := c.redisClient.Del(ctx, c.lockKey).Result()
	return err
}
