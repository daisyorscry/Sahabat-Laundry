package service

import (
	"context"
	"os"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	redis "github.com/redis/go-redis/v9"

	"laondry-order-service/internal/entity"
	"laondry-order-service/internal/lock"
)

// Test that Redis-based lock serializes CreateOrder calls on the same process.
func TestOrderService_CreateOrder_RedisLock_AvoidsRace(t *testing.T) {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}
	rdb := redis.NewClient(&redis.Options{Addr: addr})
	if err := rdb.Ping(context.Background()).Err(); err != nil {
		t.Skipf("skipping redis-based service race test, cannot connect to %s: %v", addr, err)
	}

    locker := lock.NewRedisLocker(rdb)

    // mock repo with artificial delay; count create calls
    var createCalls int32
    repo := &mockOrderRepository{}
    repo.createFn = func(ctx context.Context, order *entity.Order) error {
        time.Sleep(200 * time.Millisecond)
        atomic.AddInt32(&createCalls, 1)
        return nil
    }
    repo.findByIDFn = func(ctx context.Context, id uuid.UUID) (*entity.Order, error) { return &entity.Order{ID: id}, nil }

    // prepare DB for user/pricing lookup inside CreateOrder
    db := setupTestDB(t)
    user, outlet, svcEntity, _ := seedPricing(t, db, 1000, 0)

    svc := NewOrderService(repo, db, locker)

    w := 1.0
    req := CreateOrderRequest{
        CustomerID: user.ID, OutletID: outlet.ID, OrderType: "DROPOFF",
        Items: []OrderItemRequest{{ServiceID: svcEntity.ID, WeightKg: &w}},
    }

	var wg sync.WaitGroup
	wg.Add(2)
	results := make(chan error, 2)
	go func() { defer wg.Done(); _, err := svc.CreateOrder(context.Background(), req); results <- err }()
	go func() { defer wg.Done(); _, err := svc.CreateOrder(context.Background(), req); results <- err }()
	wg.Wait()
	close(results)
	var success, busy int
	for err := range results {
		if err == nil {
			success++
		} else {
			busy++
		}
	}
	if success != 1 || busy != 1 {
		t.Fatalf("expected one success and one busy, got success=%d busy=%d", success, busy)
	}
	if atomic.LoadInt32(&createCalls) != 1 {
		t.Fatalf("expected exactly one create call, got %d", createCalls)
	}
}
