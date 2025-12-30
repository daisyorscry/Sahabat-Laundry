package lock

import (
    "context"
    "sync"
    "time"
)

// MemoryLocker is a simple in-process locker suitable for tests/development.
type MemoryLocker struct {
    mu   sync.Mutex
    held map[string]struct{}
}

func NewMemoryLocker() *MemoryLocker {
    return &MemoryLocker{held: make(map[string]struct{})}
}

func (m *MemoryLocker) TryLock(ctx context.Context, key string, ttl time.Duration) (func() error, bool, error) {
    m.mu.Lock()
    defer m.mu.Unlock()
    if _, exists := m.held[key]; exists {
        return nil, false, nil
    }
    m.held[key] = struct{}{}
    unlock := func() error {
        m.mu.Lock()
        delete(m.held, key)
        m.mu.Unlock()
        return nil
    }
    return unlock, true, nil
}

