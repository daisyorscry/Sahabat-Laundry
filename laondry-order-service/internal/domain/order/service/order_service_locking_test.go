package service

import (
    "context"
    "sync"
    "sync/atomic"
    "testing"
    "time"

    "github.com/google/uuid"

    "laondry-order-service/internal/entity"
    "laondry-order-service/internal/lock"
)

// Memory-lock variant for CreateOrder race to avoid external Redis dependency
func TestOrderService_CreateOrder_MemoryLock_AvoidsRace(t *testing.T) {
    locker := lock.NewMemoryLocker()

    var createCalls int32
    repo := &mockOrderRepository{}
    repo.createFn = func(ctx context.Context, order *entity.Order) error {
        time.Sleep(150 * time.Millisecond)
        atomic.AddInt32(&createCalls, 1)
        return nil
    }
    repo.findByIDFn = func(ctx context.Context, id uuid.UUID) (*entity.Order, error) { return &entity.Order{ID: id}, nil }

    // Prepare real DB for security checks inside CreateOrder (user/pricing lookups)
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
        if err == nil { success++ } else { busy++ }
    }
    if success != 1 || busy != 1 {
        t.Fatalf("expected one success and one busy, got success=%d busy=%d", success, busy)
    }
    if atomic.LoadInt32(&createCalls) != 1 {
        t.Fatalf("expected exactly one create call, got %d", createCalls)
    }
}

func TestOrderService_UpdateOrder_MemoryLock_AvoidsRace(t *testing.T) {
    locker := lock.NewMemoryLocker()

    var updateCalls int32
    id := uuid.New()
    repo := &mockOrderRepository{}
    repo.findByIDFn = func(ctx context.Context, rid uuid.UUID) (*entity.Order, error) {
        return &entity.Order{ID: id, Status: "NEW", DeliveryFee: 0}, nil
    }
    repo.updateFn = func(ctx context.Context, order *entity.Order) error {
        time.Sleep(150 * time.Millisecond)
        atomic.AddInt32(&updateCalls, 1)
        return nil
    }

    svc := NewOrderService(repo, nil, locker)
    q := 1
    req := UpdateOrderRequest{Items: []OrderItemRequest{{ServiceID: uuid.New(), ServiceCode: "SVC", ServiceName: "NAME", Qty: &q, UnitPrice: 1000}}}

    var wg sync.WaitGroup
    wg.Add(2)
    results := make(chan error, 2)
    go func() { defer wg.Done(); _, err := svc.UpdateOrder(context.Background(), id, req); results <- err }()
    go func() { defer wg.Done(); _, err := svc.UpdateOrder(context.Background(), id, req); results <- err }()
    wg.Wait()
    close(results)
    var success, busy int
    for err := range results {
        if err == nil { success++ } else { busy++ }
    }
    if success != 1 || busy != 1 {
        t.Fatalf("expected one success and one busy, got success=%d busy=%d", success, busy)
    }
    if atomic.LoadInt32(&updateCalls) != 1 {
        t.Fatalf("expected exactly one update call, got %d", updateCalls)
    }
}

func TestOrderService_UpdateOrderStatus_MemoryLock_AvoidsRace(t *testing.T) {
    locker := lock.NewMemoryLocker()
    id := uuid.New()
    var callCount int32
    repo := &mockOrderRepository{}
    repo.findByIDFn = func(ctx context.Context, rid uuid.UUID) (*entity.Order, error) {
        return &entity.Order{ID: id, Status: "NEW"}, nil
    }
    repo.updateStatusFn = func(ctx context.Context, rid uuid.UUID, status string) error {
        time.Sleep(150 * time.Millisecond)
        atomic.AddInt32(&callCount, 1)
        return nil
    }
    repo.createStatusLogFn = func(ctx context.Context, l *entity.OrderStatusLog) error { return nil }

    svc := NewOrderService(repo, nil, locker)

    var wg sync.WaitGroup
    wg.Add(2)
    results := make(chan error, 2)
    go func() { defer wg.Done(); results <- svc.UpdateOrderStatus(context.Background(), id, UpdateStatusRequest{Status: "IN_PROGRESS"}) }()
    go func() { defer wg.Done(); results <- svc.UpdateOrderStatus(context.Background(), id, UpdateStatusRequest{Status: "IN_PROGRESS"}) }()
    wg.Wait()
    close(results)
    var success, busy int
    for err := range results {
        if err == nil { success++ } else { busy++ }
    }
    if success != 1 || busy != 1 {
        t.Fatalf("expected one success and one busy, got success=%d busy=%d", success, busy)
    }
    if atomic.LoadInt32(&callCount) != 1 {
        t.Fatalf("expected exactly one status update call, got %d", callCount)
    }
}
