package service

import (
    "context"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"

    "laondry-order-service/internal/domain/order/repository"
    "laondry-order-service/internal/entity"
    "laondry-order-service/internal/lock"
)

func TestCreateOrder_UsesMemberTierPrice_And_FallbackToDefault(t *testing.T) {
    db := setupTestDB(t)
    orderRepo := repository.NewOrderRepository(db)
    svc := NewOrderService(orderRepo, db, lock.NewMemoryLocker())

    // Seed base entities
    now := time.Now()
    user := entity.User{FullName: "Tier User", PasswordHash: "hash", CreatedAt: now, UpdatedAt: now}
    assert.NoError(t, db.Create(&user).Error)
    outlet := entity.Outlet{Code: "OUT-TIER-" + now.Format("150405"), Name: "Outlet Tier", IsActive: true, CreatedAt: now, UpdatedAt: now}
    assert.NoError(t, db.Create(&outlet).Error)
    serviceEntity := entity.Service{Code: "CUCI-TIER-" + now.Format("150405"), Name: "Cuci Tiered", PricingModel: "PER_ITEM", BasePrice: 20000, IsActive: true, CreatedAt: now, UpdatedAt: now}
    assert.NoError(t, db.Create(&serviceEntity).Error)

    // Default price (no tier)
    eff := now.Add(-24 * time.Hour)
    defPrice := entity.ServicePrice{ServiceID: serviceEntity.ID, OutletID: outlet.ID, MemberTier: nil, Price: 15000, EffectiveStart: eff, IsExpress: false, CreatedAt: now, UpdatedAt: now}
    assert.NoError(t, db.Create(&defPrice).Error)
    // Tier-specific price GOLD
    gold := "GOLD"
    goldPrice := entity.ServicePrice{ServiceID: serviceEntity.ID, OutletID: outlet.ID, MemberTier: &gold, Price: 12000, EffectiveStart: eff, IsExpress: false, CreatedAt: now, UpdatedAt: now}
    assert.NoError(t, db.Create(&goldPrice).Error)

    // Case 1: GOLD member should get 12000
    qty := 2
    reqGold := CreateOrderRequest{
        CustomerID: user.ID,
        OutletID:   outlet.ID,
        OrderType:  "DROPOFF",
        MemberTier: &gold,
        Items: []OrderItemRequest{{
            ServiceID: serviceEntity.ID,
            Qty:       &qty,
        }},
    }
    createdGold, err := svc.CreateOrder(context.Background(), reqGold)
    if err != nil { t.Fatalf("unexpected error: %v", err) }
    if len(createdGold.Items) != 1 { t.Fatalf("expected 1 item") }
    assert.InDelta(t, 12000.0, createdGold.Items[0].UnitPrice, 0.0001)
    assert.InDelta(t, 24000.0, createdGold.Items[0].LineTotal, 0.0001)

    // Case 2: Unknown tier PLATINUM should fall back to default (15000)
    platinum := "PLATINUM"
    reqPlat := CreateOrderRequest{
        CustomerID: user.ID,
        OutletID:   outlet.ID,
        OrderType:  "DROPOFF",
        MemberTier: &platinum,
        Items: []OrderItemRequest{{
            ServiceID: serviceEntity.ID,
            Qty:       &qty,
        }},
    }
    createdPlat, err := svc.CreateOrder(context.Background(), reqPlat)
    if err != nil { t.Fatalf("unexpected error: %v", err) }
    if len(createdPlat.Items) != 1 { t.Fatalf("expected 1 item") }
    assert.InDelta(t, 15000.0, createdPlat.Items[0].UnitPrice, 0.0001)
    assert.InDelta(t, 30000.0, createdPlat.Items[0].LineTotal, 0.0001)
}

func TestCreateOrder_UsesExpressPrice_WhenAvailable(t *testing.T) {
    db := setupTestDB(t)
    orderRepo := repository.NewOrderRepository(db)
    svc := NewOrderService(orderRepo, db, lock.NewMemoryLocker())

    now := time.Now()
    user := entity.User{FullName: "Express User", PasswordHash: "hash", CreatedAt: now, UpdatedAt: now}
    if err := db.Create(&user).Error; err != nil { t.Fatalf("seed user: %v", err) }
    outlet := entity.Outlet{Code: "OUT-EXP-" + now.Format("150405"), Name: "Outlet Express", IsActive: true, CreatedAt: now, UpdatedAt: now}
    if err := db.Create(&outlet).Error; err != nil { t.Fatalf("seed outlet: %v", err) }
    serviceEntity := entity.Service{Code: "CUCI-EXP-" + now.Format("150405"), Name: "Cuci Express", PricingModel: "PER_KG", BasePrice: 10000, IsActive: true, CreatedAt: now, UpdatedAt: now}
    if err := db.Create(&serviceEntity).Error; err != nil { t.Fatalf("seed service: %v", err) }

    eff := now.Add(-24 * time.Hour)
    // default non-express
    if err := db.Create(&entity.ServicePrice{ServiceID: serviceEntity.ID, OutletID: outlet.ID, MemberTier: nil, Price: 10000, EffectiveStart: eff, IsExpress: false, CreatedAt: now, UpdatedAt: now}).Error; err != nil { t.Fatalf("seed non-express: %v", err) }
    // express price
    if err := db.Create(&entity.ServicePrice{ServiceID: serviceEntity.ID, OutletID: outlet.ID, MemberTier: nil, Price: 15000, EffectiveStart: eff, IsExpress: true, CreatedAt: now, UpdatedAt: now}).Error; err != nil { t.Fatalf("seed express: %v", err) }

    w := 2.0
    req := CreateOrderRequest{
        CustomerID: user.ID,
        OutletID:   outlet.ID,
        OrderType:  "PICKUP",
        Items: []OrderItemRequest{{
            ServiceID: serviceEntity.ID,
            WeightKg:  &w,
            IsExpress: true,
        }},
    }
    created, err := svc.CreateOrder(context.Background(), req)
    if err != nil { t.Fatalf("unexpected error: %v", err) }
    if len(created.Items) != 1 { t.Fatalf("expected 1 item") }
    assert.InDelta(t, 15000.0, created.Items[0].UnitPrice, 0.0001)
    assert.InDelta(t, 30000.0, created.Items[0].LineTotal, 0.0001)
}
