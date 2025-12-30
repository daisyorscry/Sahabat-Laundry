package lock

import (
    "context"
    "time"

    "github.com/google/uuid"
    redis "github.com/redis/go-redis/v9"
)

// RedisLocker implements a distributed lock over Redis using SET NX PX and a release script.
type RedisLocker struct {
    client *redis.Client
}

func NewRedisLocker(client *redis.Client) *RedisLocker {
    return &RedisLocker{client: client}
}

func (r *RedisLocker) TryLock(ctx context.Context, key string, ttl time.Duration) (func() error, bool, error) {
    token := uuid.NewString()
    ok, err := r.client.SetNX(ctx, key, token, ttl).Result()
    if err != nil || !ok {
        return nil, ok, err
    }
    unlock := func() error {
        // Release only if token matches
        const lua = `if redis.call('get', KEYS[1]) == ARGV[1] then
  return redis.call('del', KEYS[1])
else
  return 0
end`
        _ = r.client.Eval(ctx, lua, []string{key}, token).Err()
        return nil
    }
    return unlock, true, nil
}

