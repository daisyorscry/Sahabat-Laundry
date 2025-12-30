package service

import (
    "context"
    "testing"
    "time"

    "github.com/stretchr/testify/assert"
    "gorm.io/driver/sqlite"
    "gorm.io/gorm"

    "laondry-order-service/internal/domain/order/repository"
    "laondry-order-service/internal/entity"
    "laondry-order-service/internal/lock"
)

// Helper functions
func strPtr(s string) *string { return &s }
func intPtr(i int) *int { return &i }

// setupTestDB migrates minimal entities for integration-like tests
func setupTestDB(t *testing.T) *gorm.DB {
    t.Helper()
    dsn := "file:" + t.Name() + "?mode=memory&cache=shared"
    db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
    if !assert.NoError(t, err) { t.FailNow() }
    // ensure single connection to keep in-memory DB alive for the session
    if sqlDB, err2 := db.DB(); err2 == nil {
        sqlDB.SetMaxOpenConns(5)
    }
    err = db.AutoMigrate(
        &entity.User{}, &entity.Outlet{},
        &entity.Service{}, &entity.Addon{}, &entity.ServicePrice{},
        &entity.Order{}, &entity.OrderItem{}, &entity.OrderItemAddon{}, &entity.OrderStatusLog{},
    )
    if !assert.NoError(t, err) { t.FailNow() }
    return db
}

// seedPricing creates a service, addon, outlet and optional price
func seedPricing(t *testing.T, db *gorm.DB, price float64, addonPrice float64) (entity.User, entity.Outlet, entity.Service, entity.Addon) {
    t.Helper()
    now := time.Now()
    user := entity.User{FullName: "Tester", PasswordHash: "hash", CreatedAt: now, UpdatedAt: now}
    assert.NoError(t, db.Create(&user).Error)
    outlet := entity.Outlet{Code: "OUT-1-" + now.Format("150405.000"), Name: "Outlet 1", IsActive: true, CreatedAt: now, UpdatedAt: now}
    assert.NoError(t, db.Create(&outlet).Error)
    svc := entity.Service{Code: "CUCI_KERING-" + now.Format("150405.000"), Name: "Cuci Kering", PricingModel: "PER_KG", BasePrice: price, IsActive: true, CreatedAt: now, UpdatedAt: now}
    assert.NoError(t, db.Create(&svc).Error)
    add := entity.Addon{Code: "PEWANGI-" + now.Format("150405.000"), Name: "Pewangi", Price: addonPrice, IsActive: true, CreatedAt: now, UpdatedAt: now}
    assert.NoError(t, db.Create(&add).Error)
    // also add explicit service price for default (member_tier NULL)
    effectiveStart := now.Add(-24 * time.Hour)
    sp := entity.ServicePrice{ServiceID: svc.ID, OutletID: outlet.ID, MemberTier: nil, Price: price, EffectiveStart: effectiveStart, IsExpress: false, CreatedAt: now, UpdatedAt: now}
    assert.NoError(t, db.Create(&sp).Error)
    return user, outlet, svc, add
}

// SECURITY: request-supplied prices and names must be ignored; use DB values
func TestCreateOrder_IgnoresManipulatedItemAndAddonPrices(t *testing.T) {
    db := setupTestDB(t)
    orderRepo := repository.NewOrderRepository(db)
    svc := NewOrderService(orderRepo, db, lock.NewMemoryLocker())

    user, outlet, s, a := seedPricing(t, db, 12000, 5000)
    qty := 3
    addonQty := 2

    // Attacker sends fake prices and names in request
    req := CreateOrderRequest{
        CustomerID: user.ID,
        OutletID:   outlet.ID,
        OrderType:  "DROPOFF",
        Items: []OrderItemRequest{{
            ServiceID:   s.ID,
            ServiceCode: "FAKE_CODE",
            ServiceName: "HACKED NAME",
            Qty:         intPtr(qty),
            UnitPrice:   0, // attempt free service
            Addons: []OrderItemAddonRequest{{
                AddonID:   a.ID,
                Qty:       addonQty,
                UnitPrice: 1,           // attempt free addon
                AddonCode: "FAKE_ADDON", // fake meta
                AddonName: "HACKED ADDON",
            }},
        }},
    }

    created, err := svc.CreateOrder(context.Background(), req)
    assert.NoError(t, err)
    assert.NotNil(t, created)
    assert.Equal(t, 1, len(created.Items))
    item := created.Items[0]
    assert.Equal(t, s.Code, item.ServiceCode, "service code must come from DB")
    assert.Equal(t, s.Name, item.ServiceName, "service name must come from DB")
    assert.InDelta(t, 12000.0, item.UnitPrice, 0.0001, "unit price must come from DB")
    assert.Equal(t, 1, len(item.Addons))
    assert.Equal(t, a.Code, item.Addons[0].AddonCode, "addon code must come from DB")
    assert.Equal(t, a.Name, item.Addons[0].AddonName, "addon name must come from DB")
    assert.InDelta(t, 5000.0, item.Addons[0].UnitPrice, 0.0001, "addon unit price must come from DB")

    expectedSubtotal := float64(qty)*12000.0 + float64(addonQty)*5000.0
    assert.InDelta(t, expectedSubtotal, created.Subtotal, 0.0001)
    assert.InDelta(t, expectedSubtotal, created.GrandTotal, 0.0001) // no tax, no delivery fee
}

// SECURITY: if attacker sends unit_price in JSON, handler decoding must ignore it
// This is indirectly covered by json:"-" on UnitPrice, and by service using DB.
// We verify again with a weight-based item for variety.
func TestCreateOrder_IgnoresManipulatedWeightPrice(t *testing.T) {
    db := setupTestDB(t)
    orderRepo := repository.NewOrderRepository(db)
    svc := NewOrderService(orderRepo, db, lock.NewMemoryLocker())

    user, outlet, s, a := seedPricing(t, db, 10000, 2000)
    weight := 2.5
    addonQty := 1
    req := CreateOrderRequest{
        CustomerID: user.ID,
        OutletID:   outlet.ID,
        OrderType:  "PICKUP",
        Items: []OrderItemRequest{{
            ServiceID:   s.ID,
            WeightKg:    &weight,
            UnitPrice:   0, // attempt free service
            ServiceCode: "X",
            ServiceName: "Y",
            Addons: []OrderItemAddonRequest{{AddonID: a.ID, Qty: addonQty, UnitPrice: 0}}, // attempt free addon
        }},
    }
    created, err := svc.CreateOrder(context.Background(), req)
    assert.NoError(t, err)
    assert.NotNil(t, created)

    expectedSubtotal := 10000.0*weight + float64(addonQty)*2000.0
    assert.InDelta(t, expectedSubtotal, created.Subtotal, 0.0001)
}
