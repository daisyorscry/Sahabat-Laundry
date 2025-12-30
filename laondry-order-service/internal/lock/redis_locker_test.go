package lock

import (
    "context"
    "os"
    "testing"
    "time"

    redis "github.com/redis/go-redis/v9"
)

func redisClientForTest(t *testing.T) *redis.Client {
    addr := os.Getenv("REDIS_ADDR")
    if addr == "" { addr = "localhost:6379" }
    client := redis.NewClient(&redis.Options{Addr: addr})
    if err := client.Ping(context.Background()).Err(); err != nil {
        t.Skipf("skipping redis tests, cannot connect to %s: %v", addr, err)
    }
    return client
}

func TestRedisLocker_ConnectionAndLocking(t *testing.T) {
    ctx := context.Background()
    client := redisClientForTest(t)
    locker := NewRedisLocker(client)

    unlock, ok, err := locker.TryLock(ctx, "test:lock", 2*time.Second)
    if err != nil { t.Fatalf("TryLock error: %v", err) }
    if !ok { t.Fatalf("expected to acquire lock") }
    // second attempt should fail while held
    if _, ok2, _ := locker.TryLock(ctx, "test:lock", 2*time.Second); ok2 {
        t.Fatalf("expected second lock attempt to fail while first held")
    }
    if err := unlock(); err != nil { t.Fatalf("unlock error: %v", err) }
    // after unlock, should succeed
    if _, ok3, _ := locker.TryLock(ctx, "test:lock", 2*time.Second); !ok3 {
        t.Fatalf("expected to acquire lock after release")
    }
}

