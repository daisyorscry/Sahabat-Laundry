package lock

import (
    "context"
    "time"
)

// Locker provides a best-effort distributed lock primitive.
// TryLock returns an unlock function, whether the lock was acquired, and an error.
// Call unlock when done if ok is true.
type Locker interface {
    TryLock(ctx context.Context, key string, ttl time.Duration) (unlock func() error, ok bool, err error)
}

