package utils

import (
	"sync"
	"time"
)

type Debounce struct {
	mu            sync.Mutex
	lastExecution time.Time
	timeout       time.Duration
	timer         *time.Timer
}

func NewDebounce(timeout time.Duration) *Debounce {
	return &Debounce{
		lastExecution: time.Now(),
		timeout:       timeout,
	}
}

func (d *Debounce) ScheduleAction(action func(), cancel func()) {
	d.mu.Lock()
	defer d.mu.Unlock()

	if d.timer != nil {
		d.timer.Stop()
		if cancel != nil {
			cancel()
		}
	}

	d.timer = time.AfterFunc(d.timeout, func() {
		action()
	})
}
