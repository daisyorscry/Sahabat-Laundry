package service

import (
    "context"
    "testing"
    "time"

    "github.com/google/uuid"
    "github.com/stretchr/testify/assert"

    "laondry-order-service/internal/domain/order/repository"
    "laondry-order-service/internal/lock"
)

// Test that promised_at is computed from the service's est_duration_hours on create
func TestCreateOrder_PromisedAt_ComputedFromServiceDuration(t *testing.T) {
    db := setupTestDB(t)
    // Seed a service with 24 hours duration
    user, outlet, svc, _ := seedPricing(t, db, 10000, 0)
    // Adjust the service to have a distinct duration
    if err := db.Model(&svc).Update("est_duration_hours", 24).Error; err != nil {
        t.Fatalf("failed to set est_duration_hours: %v", err)
    }

    orderRepo := repository.NewOrderRepository(db)
    svcImpl := NewOrderService(orderRepo, db, lock.NewMemoryLocker())

    // create one qty item (qty-based)
    q := 1
    created, err := svcImpl.CreateOrder(context.Background(), CreateOrderRequest{
        CustomerID: user.ID,
        OutletID:   outlet.ID,
        OrderType:  "DROPOFF",
        Items: []OrderItemRequest{{
            ServiceID: svc.ID,
            Qty:       &q,
        }},
    })
    assert.NoError(t, err)
    if assert.NotNil(t, created) {
        if assert.NotNil(t, created.PromisedAt, "promised_at should be set on create") {
            // promised_at should be roughly now + 24h; allow wide tolerance to avoid flakes
            lower := time.Now().Add(22 * time.Hour)
            upper := time.Now().Add(26 * time.Hour)
            assert.True(t, created.PromisedAt.After(lower) && created.PromisedAt.Before(upper),
                "promised_at %v not within expected window [%v, %v]", created.PromisedAt, lower, upper)
        }
    }
}

// Test that promised_at is recomputed on update when items change to services with longer duration
func TestUpdateOrder_PromisedAt_RecomputedOnItemsChange(t *testing.T) {
    db := setupTestDB(t)
    user, outlet, svcShort, _ := seedPricing(t, db, 10000, 0)
    // ensure svcShort has 12h
    if err := db.Model(&svcShort).Update("est_duration_hours", 12).Error; err != nil {
        t.Fatalf("failed to set short est_duration_hours: %v", err)
    }
    // create longer service 36h
    svcLong := svcShort
    svcLong.ID = uuid.New()
    svcLong.Code = "LONG-" + svcShort.Code
    svcLong.EstDurationHours = 36
    if err := db.Create(&svcLong).Error; err != nil {
        t.Fatalf("create long service: %v", err)
    }

    orderRepo := repository.NewOrderRepository(db)
    svcImpl := NewOrderService(orderRepo, db, lock.NewMemoryLocker())

    // create order with short service
    q := 1
    created, err := svcImpl.CreateOrder(context.Background(), CreateOrderRequest{
        CustomerID: user.ID,
        OutletID:   outlet.ID,
        OrderType:  "DROPOFF",
        Items: []OrderItemRequest{{
            ServiceID: svcShort.ID,
            Qty:       &q,
        }},
    })
    assert.NoError(t, err)
    if created == nil || created.PromisedAt == nil {
        t.Fatalf("expected promised_at set on initial create")
    }
    initialProm := *created.PromisedAt

    // update items to long service, should recompute promised_at
    q2 := 2
    updated, err := svcImpl.UpdateOrder(context.Background(), created.ID, UpdateOrderRequest{
        Items: []OrderItemRequest{{
            ServiceID: svcLong.ID,
            Qty:       &q2,
            UnitPrice: 1000, // value not used for promised_at, only for totals
        }},
    })
    assert.NoError(t, err)
    if updated == nil || updated.PromisedAt == nil {
        t.Fatalf("expected promised_at set on update")
    }

    // We expect updated promised to be later than initial
    assert.True(t, updated.PromisedAt.After(initialProm), "promised_at should be recomputed and later than initial")
}

