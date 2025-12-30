package service

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"laondry-order-service/internal/domain/order/repository"
	"laondry-order-service/internal/entity"
	appErrors "laondry-order-service/pkg/errors"
)

type mockOrderRepository struct {
	createFn          func(ctx context.Context, order *entity.Order) error
	findByIDFn        func(ctx context.Context, id uuid.UUID) (*entity.Order, error)
	findByOrderNoFn   func(ctx context.Context, orderNo string) (*entity.Order, error)
	findAllFn         func(ctx context.Context, filters repository.OrderFilters) ([]entity.Order, int64, error)
	updateFn          func(ctx context.Context, order *entity.Order) error
	deleteFn          func(ctx context.Context, id uuid.UUID) error
	updateStatusFn    func(ctx context.Context, id uuid.UUID, status string) error
	createStatusLogFn func(ctx context.Context, log *entity.OrderStatusLog) error
	listStatusLogsFn  func(ctx context.Context, orderID uuid.UUID, page, limit int, sortOrder string) ([]entity.OrderStatusLog, int64, error)
}

func (m *mockOrderRepository) Create(ctx context.Context, order *entity.Order) error {
	if m.createFn != nil {
		return m.createFn(ctx, order)
	}
	return nil
}

func (m *mockOrderRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Order, error) {
	if m.findByIDFn != nil {
		return m.findByIDFn(ctx, id)
	}
	return nil, errors.New("not implemented")
}

func (m *mockOrderRepository) FindByOrderNo(ctx context.Context, orderNo string) (*entity.Order, error) {
	if m.findByOrderNoFn != nil {
		return m.findByOrderNoFn(ctx, orderNo)
	}
	return nil, errors.New("not implemented")
}

func (m *mockOrderRepository) FindAll(ctx context.Context, filters repository.OrderFilters) ([]entity.Order, int64, error) {
	if m.findAllFn != nil {
		return m.findAllFn(ctx, filters)
	}
	return nil, 0, errors.New("not implemented")
}

func (m *mockOrderRepository) Update(ctx context.Context, order *entity.Order) error {
	if m.updateFn != nil {
		return m.updateFn(ctx, order)
	}
	return nil
}

func (m *mockOrderRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	return nil
}

func (m *mockOrderRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	if m.updateStatusFn != nil {
		return m.updateStatusFn(ctx, id, status)
	}
	return nil
}

func (m *mockOrderRepository) CreateStatusLog(ctx context.Context, log *entity.OrderStatusLog) error {
	if m.createStatusLogFn != nil {
		return m.createStatusLogFn(ctx, log)
	}
	return nil
}

func (m *mockOrderRepository) ListStatusLogs(ctx context.Context, orderID uuid.UUID, page, limit int, sortOrder string) ([]entity.OrderStatusLog, int64, error) {
	if m.listStatusLogsFn != nil {
		return m.listStatusLogsFn(ctx, orderID, page, limit, sortOrder)
	}
	return nil, 0, nil
}

// WithDB for mock just returns itself (no-op)
func (m *mockOrderRepository) WithDB(db *gorm.DB) repository.OrderRepository { return m }

func TestOrderService_CreateOrderSuccess(t *testing.T) {
    repo := &mockOrderRepository{}
    db := setupTestDB(t)
    user, outlet, svcEntity, addEntity := seedPricing(t, db, 10000, 5000)
    service := NewOrderService(repo, db, nil)
    ctx := context.Background()

	var capturedOrder *entity.Order
	resultOrder := &entity.Order{
		ID:         uuid.New(),
		Status:     "NEW",
		OrderNo:    "ORD-123",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		CustomerID: uuid.New(),
		OutletID:   uuid.New(),
	}

	repo.createFn = func(_ context.Context, order *entity.Order) error {
		capturedOrder = order
		order.ID = resultOrder.ID
		order.OrderNo = resultOrder.OrderNo
		order.CreatedAt = resultOrder.CreatedAt
		order.UpdatedAt = resultOrder.UpdatedAt
		return nil
	}
	repo.findByIDFn = func(_ context.Context, id uuid.UUID) (*entity.Order, error) {
		if capturedOrder == nil {
			t.Fatalf("repository Create should be called before FindByID")
		}
		if id != resultOrder.ID {
			t.Fatalf("expected FindByID to be called with %s, got %s", resultOrder.ID, id)
		}
		return &entity.Order{
			ID:          resultOrder.ID,
			OrderNo:     resultOrder.OrderNo,
			Status:      resultOrder.Status,
			CustomerID:  capturedOrder.CustomerID,
			OutletID:    capturedOrder.OutletID,
			Subtotal:    capturedOrder.Subtotal,
			GrandTotal:  capturedOrder.GrandTotal,
			DeliveryFee: capturedOrder.DeliveryFee,
			TotalWeight: capturedOrder.TotalWeight,
			TotalPiece:  capturedOrder.TotalPiece,
		}, nil
	}

    weight := 2.5
    addonQty := 2

    req := CreateOrderRequest{
        CustomerID:  user.ID,
        OutletID:    outlet.ID,
        OrderType:   "DROPOFF",
        DeliveryFee: 5000,
        Items: []OrderItemRequest{
            {
                ServiceID:   svcEntity.ID,
                WeightKg:    &weight,
                Addons: []OrderItemAddonRequest{
                    {
                        AddonID: addEntity.ID,
                        Qty:     addonQty,
                    },
                },
            },
        },
    }

	created, err := service.CreateOrder(ctx, req)
	if err != nil {
		t.Fatalf("CreateOrder returned error: %v", err)
	}

	if created == nil {
		t.Fatalf("expected created order, got nil")
	}

	if capturedOrder == nil {
		t.Fatalf("expected repository Create to be called")
	}

    expectedSubtotal := (10000 * weight) + float64(addonQty)*5000
    // Delivery fee is currently ignored at creation (set to 0 inside service)
    expectedGrandTotal := expectedSubtotal

	if capturedOrder.Subtotal != expectedSubtotal {
		t.Fatalf("expected subtotal %.2f, got %.2f", expectedSubtotal, capturedOrder.Subtotal)
	}
	if capturedOrder.GrandTotal != expectedGrandTotal {
		t.Fatalf("expected grand total %.2f, got %.2f", expectedGrandTotal, capturedOrder.GrandTotal)
	}
	if capturedOrder.TotalWeight != weight {
		t.Fatalf("expected total weight %.2f, got %.2f", weight, capturedOrder.TotalWeight)
	}
	if capturedOrder.TotalPiece != 0 {
		t.Fatalf("expected total piece 0 for weight-based item, got %d", capturedOrder.TotalPiece)
	}
}

func TestOrderService_CreateOrderInvalidItem(t *testing.T) {
    repo := &mockOrderRepository{}
    db := setupTestDB(t)
    user, outlet, svcEntity, _ := seedPricing(t, db, 10000, 0)
    service := NewOrderService(repo, db, nil)
    ctx := context.Background()

    req := CreateOrderRequest{
        CustomerID: user.ID,
        OutletID:   outlet.ID,
        OrderType:  "DROPOFF",
        Items: []OrderItemRequest{
            {
                ServiceID: svcEntity.ID,
                // missing weight and qty -> invalid
            },
        },
    }

	_, err := service.CreateOrder(ctx, req)
	if err == nil {
		t.Fatalf("expected error for invalid item")
	}

	var appErr *appErrors.AppError
	if !errors.As(err, &appErr) {
		t.Fatalf("expected app error, got %v", err)
	}
	if appErr.StatusCode != 400 {
		t.Fatalf("expected status code 400, got %d", appErr.StatusCode)
	}
}

func TestOrderService_UpdateOrderStatusSameStatus(t *testing.T) {
	repo := &mockOrderRepository{
		findByIDFn: func(ctx context.Context, id uuid.UUID) (*entity.Order, error) {
			return &entity.Order{ID: id, Status: "NEW"}, nil
		},
	}
	service := NewOrderService(repo, nil, nil)

	err := service.UpdateOrderStatus(context.Background(), uuid.New(), UpdateStatusRequest{
		Status: "NEW",
	})

	if err == nil {
		t.Fatalf("expected error for same status update")
	}
}

func TestOrderService_UpdateOrderStatusSuccess(t *testing.T) {
	var updateCalled bool
	var logCalled bool
	repo := &mockOrderRepository{
		findByIDFn: func(ctx context.Context, id uuid.UUID) (*entity.Order, error) {
			return &entity.Order{ID: id, Status: "NEW"}, nil
		},
		updateStatusFn: func(ctx context.Context, id uuid.UUID, status string) error {
			updateCalled = true
			if status != "IN_PROGRESS" {
				t.Fatalf("expected status IN_PROGRESS, got %s", status)
			}
			return nil
		},
		createStatusLogFn: func(ctx context.Context, log *entity.OrderStatusLog) error {
			logCalled = true
			if log.FromStatus == nil || *log.FromStatus != "NEW" || log.ToStatus != "IN_PROGRESS" {
				t.Fatalf("unexpected status log: %+v", log)
			}
			return nil
		},
	}

	service := NewOrderService(repo, nil, nil)

	err := service.UpdateOrderStatus(context.Background(), uuid.New(), UpdateStatusRequest{Status: "IN_PROGRESS"})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !updateCalled {
		t.Fatalf("expected UpdateStatus to be called on repository")
	}
	if !logCalled {
		t.Fatalf("expected CreateStatusLog to be called on repository")
	}
}

func TestOrderService_UpdateOrderStatus_InvalidTransition(t *testing.T) {
	repo := &mockOrderRepository{
		findByIDFn: func(ctx context.Context, id uuid.UUID) (*entity.Order, error) {
			return &entity.Order{ID: id, Status: "COMPLETED"}, nil
		},
	}
	service := NewOrderService(repo, nil, nil)
	err := service.UpdateOrderStatus(context.Background(), uuid.New(), UpdateStatusRequest{Status: "IN_PROGRESS"})
	if err == nil {
		t.Fatalf("expected error for invalid transition from COMPLETED to IN_PROGRESS")
	}
}

func TestOrderService_CalculateOrderTotal_Weight(t *testing.T) {
	s := NewOrderService(&mockOrderRepository{}, nil, nil)
	w := 3.0
	subtotal, totalWeight, totalPiece, err := s.CalculateOrderTotal([]OrderItemRequest{{
		ServiceID:   uuid.New(),
		ServiceCode: "SVC",
		ServiceName: "Laundry",
		WeightKg:    &w,
		UnitPrice:   10000,
	}})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if subtotal != 30000 {
		t.Fatalf("expected subtotal 30000, got %.0f", subtotal)
	}
	if totalWeight != 3 {
		t.Fatalf("expected totalWeight 3, got %.0f", totalWeight)
	}
	if totalPiece != 0 {
		t.Fatalf("expected totalPiece 0, got %d", totalPiece)
	}
}

func TestOrderService_CalculateOrderTotal_Qty(t *testing.T) {
	s := NewOrderService(&mockOrderRepository{}, nil, nil)
	q := 4
	subtotal, totalWeight, totalPiece, err := s.CalculateOrderTotal([]OrderItemRequest{{
		ServiceID:   uuid.New(),
		ServiceCode: "SVC",
		ServiceName: "Dry Clean",
		Qty:         &q,
		UnitPrice:   7000,
	}})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if subtotal != 28000 {
		t.Fatalf("expected subtotal 28000, got %.0f", subtotal)
	}
	if totalWeight != 0 {
		t.Fatalf("expected totalWeight 0, got %.0f", totalWeight)
	}
	if totalPiece != 4 {
		t.Fatalf("expected totalPiece 4, got %d", totalPiece)
	}
}

func TestOrderService_CalculateOrderTotal_InvalidWeightQty(t *testing.T) {
	s := NewOrderService(&mockOrderRepository{}, nil, nil)
	// Invalid weight
	w := 0.0
	if _, _, _, err := s.CalculateOrderTotal([]OrderItemRequest{{
		ServiceID:   uuid.New(),
		ServiceCode: "SVC",
		ServiceName: "Laundry",
		WeightKg:    &w,
		UnitPrice:   10000,
	}}); err == nil {
		t.Fatalf("expected error for non-positive weight")
	}

	// Invalid qty
	q := 0
	if _, _, _, err := s.CalculateOrderTotal([]OrderItemRequest{{
		ServiceID:   uuid.New(),
		ServiceCode: "SVC",
		ServiceName: "Dry Clean",
		Qty:         &q,
		UnitPrice:   7000,
	}}); err == nil {
		t.Fatalf("expected error for non-positive qty")
	}

	// Missing both
	if _, _, _, err := s.CalculateOrderTotal([]OrderItemRequest{{
		ServiceID:   uuid.New(),
		ServiceCode: "SVC",
		ServiceName: "X",
		UnitPrice:   5000,
	}}); err == nil {
		t.Fatalf("expected error when weight and qty both missing")
	}
}

func TestOrderService_CalculateOrderTotal_AddonInvalidQty(t *testing.T) {
	s := NewOrderService(&mockOrderRepository{}, nil, nil)
	q := 1
	if _, _, _, err := s.CalculateOrderTotal([]OrderItemRequest{{
		ServiceID:   uuid.New(),
		ServiceCode: "SVC",
		ServiceName: "Laundry",
		Qty:         &q,
		UnitPrice:   10000,
		Addons: []OrderItemAddonRequest{{
			AddonID:   uuid.New(),
			AddonCode: "ADD",
			AddonName: "Fragile",
			Qty:       0,
			UnitPrice: 3000,
		}},
	}}); err == nil {
		t.Fatalf("expected error for addon qty <= 0")
	}
}

func TestOrderService_CreateOrder_InvalidRequestedPickupAt_ReturnsError(t *testing.T) {
    repo := &mockOrderRepository{}
    db := setupTestDB(t)
    user, outlet, svcEntity, _ := seedPricing(t, db, 10000, 0)
    svc := NewOrderService(repo, db, nil)

	weight := 1.0
	invalid := "2024-13-99T25:61:00Z" // invalid RFC3339
    _, err := svc.CreateOrder(context.Background(), CreateOrderRequest{
        CustomerID:        user.ID,
        OutletID:          outlet.ID,
        OrderType:         "PICKUP",
        RequestedPickupAt: &invalid,
        Items: []OrderItemRequest{{
            ServiceID:   svcEntity.ID,
            WeightKg:    &weight,
        }},
    })
	if err == nil {
		t.Fatalf("expected error for invalid requested_pickup_at")
	}
}

func TestOrderService_CreateOrder_QtyBasedWithAddons(t *testing.T) {
    repo := &mockOrderRepository{}
    db := setupTestDB(t)
    user, outlet, svcEntity, addEntity := seedPricing(t, db, 8000, 1000)
    svc := NewOrderService(repo, db, nil)
	var captured *entity.Order
	repo.createFn = func(ctx context.Context, order *entity.Order) error { captured = order; return nil }
	repo.findByIDFn = func(ctx context.Context, id uuid.UUID) (*entity.Order, error) { return captured, nil }

	qty := 3
	addonQty := 2
    _, err := svc.CreateOrder(context.Background(), CreateOrderRequest{
        CustomerID:  user.ID,
        OutletID:    outlet.ID,
        OrderType:   "DROPOFF",
        DeliveryFee: 2000,
        Items: []OrderItemRequest{{
            ServiceID:   svcEntity.ID,
            Qty:         &qty,
            Addons: []OrderItemAddonRequest{{
                AddonID:   addEntity.ID,
                Qty:       addonQty,
            }},
        }},
    })
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expectedSubtotal := float64(qty)*8000 + float64(addonQty)*1000
    // Delivery fee ignored at creation
    expectedGrand := expectedSubtotal
	if captured.Subtotal != expectedSubtotal {
		t.Fatalf("subtotal mismatch: %.0f vs %.0f", captured.Subtotal, expectedSubtotal)
	}
	if captured.GrandTotal != expectedGrand {
		t.Fatalf("grand total mismatch: %.0f vs %.0f", captured.GrandTotal, expectedGrand)
	}
}

func TestOrderService_UpdateOrder_RecalculateTotals_AndBuildItems(t *testing.T) {
	repo := &mockOrderRepository{}
	svc := NewOrderService(repo, nil, nil)

	existing := &entity.Order{
		ID:          uuid.New(),
		Status:      "NEW",
		CustomerID:  uuid.New(),
		OutletID:    uuid.New(),
		Subtotal:    10000,
		DeliveryFee: 1000,
		GrandTotal:  11000,
		Items: []entity.OrderItem{{
			ID:          uuid.New(),
			ServiceID:   uuid.New(),
			ServiceCode: "SVC1",
			ServiceName: "Laundry",
			LineTotal:   10000,
		}},
	}

	var saved *entity.Order
	repo.findByIDFn = func(ctx context.Context, id uuid.UUID) (*entity.Order, error) { return existing, nil }
	repo.updateFn = func(ctx context.Context, order *entity.Order) error { saved = order; return nil }
	repo.findByIDFn = func(ctx context.Context, id uuid.UUID) (*entity.Order, error) {
		return existing, nil
	}

	qty := 2
	_, err := svc.UpdateOrder(context.Background(), existing.ID, UpdateOrderRequest{
		Items: []OrderItemRequest{{
			ServiceID:   uuid.New(),
			ServiceCode: "SVC2",
			ServiceName: "Dry Clean",
			Qty:         &qty,
			UnitPrice:   5000,
		}},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if saved == nil {
		t.Fatalf("expected save to be called")
	}
	if saved.Subtotal != 10000 {
		t.Fatalf("expected recalculated subtotal 10000, got %.0f", saved.Subtotal)
	}
	if len(saved.Items) != 1 {
		t.Fatalf("expected one rebuilt item to be passed to repository")
	}
	if saved.Items[0].ServiceCode != "SVC2" {
		t.Fatalf("expected updated service code SVC2")
	}
}

func TestOrderService_DeliveryFeeValidation(t *testing.T) {
    db := setupTestDB(t)
    user, outlet, svcEntity, _ := seedPricing(t, db, 1000, 0)
    svc := NewOrderService(&mockOrderRepository{}, db, nil)
    w := 1.0
    // create with negative fee
    if _, err := svc.CreateOrder(context.Background(), CreateOrderRequest{
        CustomerID:  user.ID,
        OutletID:    outlet.ID,
        OrderType:   "DROPOFF",
        DeliveryFee: -10,
        Items: []OrderItemRequest{{
            ServiceID:   svcEntity.ID,
            WeightKg:    &w,
        }},
    }); err == nil {
        t.Fatalf("expected error for negative delivery fee")
    }

	// update with negative fee
	id := uuid.New()
	repo := &mockOrderRepository{findByIDFn: func(ctx context.Context, rid uuid.UUID) (*entity.Order, error) {
		return &entity.Order{ID: id, DeliveryFee: 0}, nil
	}}
	svc2 := NewOrderService(repo, nil, nil)
	if _, err := svc2.UpdateOrder(context.Background(), id, UpdateOrderRequest{DeliveryFee: func() *float64 { v := -5.0; return &v }()}); err == nil {
		t.Fatalf("expected error for negative delivery fee on update")
	}
}

func TestOrderService_DeleteOrder_Success(t *testing.T) {
	id := uuid.New()
	repo := &mockOrderRepository{
		findByIDFn: func(ctx context.Context, rid uuid.UUID) (*entity.Order, error) { return &entity.Order{ID: id}, nil },
		deleteFn: func(ctx context.Context, rid uuid.UUID) error {
			if rid != id {
				t.Fatalf("wrong id")
			}
			return nil
		},
	}
	svc := NewOrderService(repo, nil, nil)
	if err := svc.DeleteOrder(context.Background(), id); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
}

func TestOrderService_GetOrders_PaginationAndFilters(t *testing.T) {
	repo := &mockOrderRepository{}
	svc := NewOrderService(repo, nil, nil)
	custID := uuid.New()
	called := false
	repo.findAllFn = func(ctx context.Context, f repository.OrderFilters) ([]entity.Order, int64, error) {
		called = true
		if f.Page != 2 || f.Limit != 5 {
			t.Fatalf("unexpected pagination: %+v", f)
		}
		if f.CustomerID == nil || *f.CustomerID != custID {
			t.Fatalf("unexpected customer filter")
		}
		return []entity.Order{{ID: uuid.New()}}, 1, nil
	}
	orders, total, err := svc.GetOrders(context.Background(), repository.OrderFilters{Page: 2, Limit: 5, CustomerID: &custID})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !called {
		t.Fatalf("expected repo.FindAll to be called")
	}
	if len(orders) != 1 || total != 1 {
		t.Fatalf("unexpected result")
	}
}

func TestOrderService_GetByID_And_GetByOrderNo(t *testing.T) {
	id := uuid.New()
	order := &entity.Order{ID: id, OrderNo: "ORD-XYZ"}
	repo := &mockOrderRepository{
		findByIDFn:      func(ctx context.Context, rid uuid.UUID) (*entity.Order, error) { return order, nil },
		findByOrderNoFn: func(ctx context.Context, no string) (*entity.Order, error) { return order, nil },
	}
	svc := NewOrderService(repo, nil, nil)
	if got, err := svc.GetOrderByID(context.Background(), id); err != nil || got.ID != id {
		t.Fatalf("GetOrderByID failed")
	}
	if got, err := svc.GetOrderByOrderNo(context.Background(), "ORD-XYZ"); err != nil || got.OrderNo != "ORD-XYZ" {
		t.Fatalf("GetOrderByOrderNo failed")
	}
}

func TestOrderService_OrderNumberUniqueness(t *testing.T) {
    var numbers []string
    repo := &mockOrderRepository{}
    repo.createFn = func(ctx context.Context, order *entity.Order) error {
        numbers = append(numbers, order.OrderNo)
        return nil
    }
    repo.findByIDFn = func(ctx context.Context, id uuid.UUID) (*entity.Order, error) { return &entity.Order{ID: id}, nil }
    db := setupTestDB(t)
    user, outlet, svcEntity, _ := seedPricing(t, db, 1000, 0)
    svc := NewOrderService(repo, db, nil)

    w := 1.0
    req := CreateOrderRequest{
        CustomerID: user.ID, OutletID: outlet.ID, OrderType: "DROPOFF",
        Items: []OrderItemRequest{{ServiceID: svcEntity.ID, WeightKg: &w}},
    }
	if _, err := svc.CreateOrder(context.Background(), req); err != nil {
		t.Fatalf("first create: %v", err)
	}
	if _, err := svc.CreateOrder(context.Background(), req); err != nil {
		t.Fatalf("second create: %v", err)
	}
	if len(numbers) != 2 || numbers[0] == numbers[1] {
		t.Fatalf("expected different order numbers, got %v", numbers)
	}
}

func TestOrderService_UpdateOrder_FinalStateBlocked(t *testing.T) {
	id := uuid.New()
	repo := &mockOrderRepository{
		findByIDFn: func(ctx context.Context, rid uuid.UUID) (*entity.Order, error) {
			return &entity.Order{ID: id, Status: "COMPLETED"}, nil
		},
	}
	svc := NewOrderService(repo, nil, nil)
	_, err := svc.UpdateOrder(context.Background(), id, UpdateOrderRequest{Notes: func() *string { s := "x"; return &s }()})
	if err == nil {
		t.Fatalf("expected error when updating finalized order")
	}
}

func TestOrderService_GetOrderStatusLogs_ForwardsToRepo(t *testing.T) {
	id := uuid.New()
	expected := []entity.OrderStatusLog{{ToStatus: "IN_PROGRESS"}}
	repo := &mockOrderRepository{
		findByIDFn: func(ctx context.Context, rid uuid.UUID) (*entity.Order, error) { return &entity.Order{ID: id}, nil },
	}
	repo.listStatusLogsFn = func(ctx context.Context, orderID uuid.UUID, page, limit int, sortOrder string) ([]entity.OrderStatusLog, int64, error) {
		if orderID != id || page != 2 || limit != 5 || sortOrder != "ASC" {
			t.Fatalf("unexpected params: id=%s page=%d limit=%d sort=%s", orderID, page, limit, sortOrder)
		}
		return expected, int64(len(expected)), nil
	}
	svc := NewOrderService(repo, nil, nil)
	logs, total, err := svc.GetOrderStatusLogs(context.Background(), id, 2, 5, "ASC")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if total != int64(len(expected)) || len(logs) != len(expected) {
		t.Fatalf("unexpected results")
	}
}
