package utils

import (
	"sync"
	"time"
)

type Throttle struct {
	mu            sync.Mutex
	lastExecution time.Time
	timeout       time.Duration
	timer         *time.Timer
}

func NewThrottle(timeout time.Duration) *Throttle {
	return &Throttle{
		lastExecution: time.Now(),
		timeout:       timeout,
	}
}

func (t *Throttle) ScheduleAction(action func(), cancel func()) {
	t.mu.Lock()
	defer t.mu.Unlock()

	if t.timer != nil {
		t.timer.Stop()
	}

	elapsed := time.Since(t.lastExecution)
	if elapsed >= t.timeout {
		action()
		t.lastExecution = time.Now()
	} else {
		duration := t.timeout - elapsed
		t.timer = time.AfterFunc(duration, func() {
			action()
			t.mu.Lock()
			defer t.mu.Unlock()
			t.lastExecution = time.Now()
		})
		if cancel != nil {
			cancel()
		}
	}
}
