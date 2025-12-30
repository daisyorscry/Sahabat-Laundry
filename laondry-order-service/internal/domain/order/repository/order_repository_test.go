package repository

import (
	"context"
	"fmt"
	"testing"
	"time"

	"laondry-order-service/internal/entity"

	"github.com/google/uuid"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("failed to open sqlite database: %v", err)
	}

	if err := db.AutoMigrate(
		&entity.User{},
		&entity.Outlet{},
		&entity.Order{},
		&entity.OrderItem{},
		&entity.OrderItemAddon{},
		&entity.OrderStatusLog{},
	); err != nil {
		t.Fatalf("failed to migrate schema: %v", err)
	}

	return db
}

func TestOrderRepository_CreateAndFind(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	now := time.Now().UTC()

	customer := entity.User{
		FullName:     "John Doe",
		PasswordHash: "hash",
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := db.Create(&customer).Error; err != nil {
		t.Fatalf("failed to create customer: %v", err)
	}

	outlet := entity.Outlet{
		Code:      "OUT-1",
		Name:      "Outlet 1",
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := db.Create(&outlet).Error; err != nil {
		t.Fatalf("failed to create outlet: %v", err)
	}

	order := &entity.Order{
		CustomerID:  customer.ID,
		OutletID:    outlet.ID,
		Status:      "NEW",
		OrderNo:     "ORD-001",
		OrderType:   "DROPOFF",
		TotalWeight: 2,
		TotalPiece:  3,
		Subtotal:    25000,
		GrandTotal:  30000,
		DeliveryFee: 5000,
		CreatedAt:   now,
		UpdatedAt:   now,
		Items: []entity.OrderItem{
			{
				ServiceID:   uuid.New(),
				ServiceCode: "SVC-1",
				ServiceName: "Laundry",
				WeightKg:    float64Ptr(2),
				UnitPrice:   10000,
				LineTotal:   20000,
				CreatedAt:   now,
				UpdatedAt:   now,
				Addons: []entity.OrderItemAddon{
					{
						AddonID:   uuid.New(),
						AddonCode: "ADD-1",
						AddonName: "Softener",
						Qty:       1,
						UnitPrice: 5000,
						LineTotal: 5000,
						CreatedAt: now,
						UpdatedAt: now,
					},
				},
			},
		},
	}

	if err := repo.Create(ctx, order); err != nil {
		t.Fatalf("Create returned error: %v", err)
	}

	fetchedByID, err := repo.FindByID(ctx, order.ID)
	if err != nil {
		t.Fatalf("FindByID returned error: %v", err)
	}
	if fetchedByID.OrderNo != order.OrderNo {
		t.Fatalf("expected order number %s, got %s", order.OrderNo, fetchedByID.OrderNo)
	}
	if len(fetchedByID.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(fetchedByID.Items))
	}
	if len(fetchedByID.Items[0].Addons) != 1 {
		t.Fatalf("expected 1 addon, got %d", len(fetchedByID.Items[0].Addons))
	}

	fetchedByOrderNo, err := repo.FindByOrderNo(ctx, order.OrderNo)
	if err != nil {
		t.Fatalf("FindByOrderNo returned error: %v", err)
	}
	if fetchedByOrderNo.ID != order.ID {
		t.Fatalf("expected order ID %s, got %s", order.ID, fetchedByOrderNo.ID)
	}
}

func TestOrderRepository_FindAllAndUpdateFlow(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	now := time.Now().UTC()

	customer := entity.User{
		FullName:     "Jane Doe",
		PasswordHash: "hash",
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	if err := db.Create(&customer).Error; err != nil {
		t.Fatalf("failed to create customer: %v", err)
	}

	outlet := entity.Outlet{
		Code:      "OUT-2",
		Name:      "Outlet 2",
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := db.Create(&outlet).Error; err != nil {
		t.Fatalf("failed to create outlet: %v", err)
	}

	firstOrder := &entity.Order{
		CustomerID:  customer.ID,
		OutletID:    outlet.ID,
		Status:      "NEW",
		OrderNo:     "ORD-100",
		OrderType:   "PICKUP",
		Subtotal:    10000,
		GrandTotal:  12000,
		DeliveryFee: 2000,
		CreatedAt:   now.Add(-time.Hour),
		UpdatedAt:   now.Add(-time.Hour),
	}
	if err := repo.Create(ctx, firstOrder); err != nil {
		t.Fatalf("failed to create first order: %v", err)
	}

	secondOrder := &entity.Order{
		CustomerID:  customer.ID,
		OutletID:    outlet.ID,
		Status:      "IN_PROGRESS",
		OrderNo:     "ORD-101",
		OrderType:   "DROPOFF",
		Subtotal:    20000,
		GrandTotal:  21000,
		DeliveryFee: 1000,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	if err := repo.Create(ctx, secondOrder); err != nil {
		t.Fatalf("failed to create second order: %v", err)
	}

	filters := OrderFilters{
		CustomerID: &customer.ID,
		Status:     stringPtr("IN_PROGRESS"),
		Page:       1,
		Limit:      10,
		SortBy:     "created_at",
		SortOrder:  "DESC",
	}

	orders, total, err := repo.FindAll(ctx, filters)
	if err != nil {
		t.Fatalf("FindAll returned error: %v", err)
	}
	if total != 1 {
		t.Fatalf("expected total 1, got %d", total)
	}
	if len(orders) != 1 {
		t.Fatalf("expected 1 order, got %d", len(orders))
	}
	if orders[0].OrderNo != secondOrder.OrderNo {
		t.Fatalf("expected order %s, got %s", secondOrder.OrderNo, orders[0].OrderNo)
	}

	secondOrder.Notes = stringPtr("Need fast delivery")
	secondOrder.DeliveryFee = 5000
	if err := repo.Update(ctx, secondOrder); err != nil {
		t.Fatalf("Update returned error: %v", err)
	}

	reloaded, err := repo.FindByID(ctx, secondOrder.ID)
	if err != nil {
		t.Fatalf("FindByID returned error after update: %v", err)
	}
	if reloaded.DeliveryFee != 5000 {
		t.Fatalf("expected updated delivery fee 5000, got %f", reloaded.DeliveryFee)
	}
	if reloaded.Notes == nil || *reloaded.Notes != "Need fast delivery" {
		t.Fatalf("expected notes to be updated")
	}

	if err := repo.UpdateStatus(ctx, secondOrder.ID, "COMPLETED"); err != nil {
		t.Fatalf("UpdateStatus returned error: %v", err)
	}

	statusUpdated, err := repo.FindByID(ctx, secondOrder.ID)
	if err != nil {
		t.Fatalf("FindByID returned error after UpdateStatus: %v", err)
	}
	if statusUpdated.Status != "COMPLETED" {
		t.Fatalf("expected status COMPLETED, got %s", statusUpdated.Status)
	}

	if err := repo.Delete(ctx, secondOrder.ID); err != nil {
		t.Fatalf("Delete returned error: %v", err)
	}

	if _, err := repo.FindByID(ctx, secondOrder.ID); err == nil {
		t.Fatalf("expected error when retrieving deleted order")
	}
}

func TestOrderRepository_FindByID_NotFound(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	_, err := repo.FindByID(ctx, uuid.New())
	if err == nil {
		t.Fatalf("expected not found error")
	}
}

func TestOrderRepository_FindByOrderNo_NotFound(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	_, err := repo.FindByOrderNo(ctx, "ORD-XXXX")
	if err == nil {
		t.Fatalf("expected not found error")
	}
}

func TestOrderRepository_FindAll_DateRangeAndPagination(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	now := time.Now().UTC()

	cust := entity.User{FullName: "Range Test", PasswordHash: "hash", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&cust).Error; err != nil {
		t.Fatalf("create customer: %v", err)
	}
	outlet := entity.Outlet{Code: "OUT-R", Name: "OutletR", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&outlet).Error; err != nil {
		t.Fatalf("create outlet: %v", err)
	}

	// 3 orders on different days
	for i := 0; i < 3; i++ {
		o := &entity.Order{
			CustomerID: cust.ID,
			OutletID:   outlet.ID,
			Status:     "NEW",
			OrderNo:    fmt.Sprintf("ORD-R-%d", i),
			OrderType:  "DROPOFF",
			Subtotal:   1000,
			GrandTotal: 1000,
			CreatedAt:  now.AddDate(0, 0, -i),
			UpdatedAt:  now.AddDate(0, 0, -i),
		}
		if err := repo.Create(ctx, o); err != nil {
			t.Fatalf("create order %d: %v", i, err)
		}
	}

	start := now.AddDate(0, 0, -1).Format("2006-01-02")
	end := now.Format("2006-01-02")
	filters := OrderFilters{CustomerID: &cust.ID, StartDate: &start, EndDate: &end, Page: 1, Limit: 1, SortBy: "created_at", SortOrder: "DESC"}
	orders, total, err := repo.FindAll(ctx, filters)
	if err != nil {
		t.Fatalf("FindAll error: %v", err)
	}
	if total != 2 {
		t.Fatalf("expected total 2 in range, got %d", total)
	}
	if len(orders) != 1 {
		t.Fatalf("expected page size 1, got %d", len(orders))
	}
}

func TestOrderRepository_UpdateStatus_And_Delete_NotFound(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	if err := repo.UpdateStatus(ctx, uuid.New(), "COMPLETED"); err == nil {
		t.Fatalf("expected not found on update status")
	}
	if err := repo.Delete(ctx, uuid.New()); err == nil {
		t.Fatalf("expected not found on delete")
	}
}

func TestOrderRepository_FindAll_Search_FallbackLike(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	now := time.Now().UTC()
	cust := entity.User{FullName: "Search Test", PasswordHash: "hash", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&cust).Error; err != nil {
		t.Fatalf("create customer: %v", err)
	}
	outlet := entity.Outlet{Code: "OUT-S", Name: "OutletS", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&outlet).Error; err != nil {
		t.Fatalf("create outlet: %v", err)
	}

	note := "Quick Brown Fox"
	o := &entity.Order{CustomerID: cust.ID, OutletID: outlet.ID, Status: "NEW", OrderNo: "ord-zz-123", OrderType: "DROPOFF", Notes: &note, CreatedAt: now, UpdatedAt: now}
	if err := repo.Create(ctx, o); err != nil {
		t.Fatalf("create order: %v", err)
	}

	q := "brown" // should match via LIKE case-insensitive on SQLite
	filters := OrderFilters{CustomerID: &cust.ID, Search: &q, Page: 1, Limit: 10}
	orders, total, err := repo.FindAll(ctx, filters)
	if err != nil {
		t.Fatalf("FindAll error: %v", err)
	}
	if total == 0 || len(orders) == 0 {
		t.Fatalf("expected search to find rows, got total=%d", total)
	}
}

func TestOrderRepository_Update_ReplacesItemsAndAddons(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	now := time.Now().UTC()
	cust := entity.User{FullName: "Upd Test", PasswordHash: "hash", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&cust).Error; err != nil {
		t.Fatalf("create customer: %v", err)
	}
	outlet := entity.Outlet{Code: "OUT-U", Name: "OutletU", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&outlet).Error; err != nil {
		t.Fatalf("create outlet: %v", err)
	}

	// create an order with one item + addon
	base := &entity.Order{
		CustomerID: cust.ID,
		OutletID:   outlet.ID,
		Status:     "NEW",
		OrderNo:    "ORD-UP-1",
		OrderType:  "DROPOFF",
		Subtotal:   1000,
		GrandTotal: 1000,
		CreatedAt:  now,
		UpdatedAt:  now,
		Items: []entity.OrderItem{{
			ServiceID:   uuid.New(),
			ServiceCode: "SVC-A",
			ServiceName: "A",
			Qty:         intPtr(1),
			UnitPrice:   1000,
			LineTotal:   1000,
			CreatedAt:   now,
			UpdatedAt:   now,
			Addons: []entity.OrderItemAddon{{
				AddonID:   uuid.New(),
				AddonCode: "ADD-A",
				AddonName: "Addon A",
				Qty:       1,
				UnitPrice: 100,
				LineTotal: 100,
				CreatedAt: now,
				UpdatedAt: now,
			}},
		}},
	}
	if err := repo.Create(ctx, base); err != nil {
		t.Fatalf("create base order: %v", err)
	}

	// replace with a different item and addon
	base.Items = []entity.OrderItem{{
		ServiceID:   uuid.New(),
		ServiceCode: "SVC-B",
		ServiceName: "B",
		Qty:         intPtr(2),
		UnitPrice:   200,
		LineTotal:   400,
		Addons: []entity.OrderItemAddon{{
			AddonID:   uuid.New(),
			AddonCode: "ADD-B",
			AddonName: "Addon B",
			Qty:       3,
			UnitPrice: 10,
			LineTotal: 30,
		}},
	}}
	base.Subtotal = 430
	base.GrandTotal = 430
	if err := repo.Update(ctx, base); err != nil {
		t.Fatalf("update order: %v", err)
	}

	reloaded, err := repo.FindByID(ctx, base.ID)
	if err != nil {
		t.Fatalf("reload: %v", err)
	}
	if len(reloaded.Items) != 1 {
		t.Fatalf("expected 1 item, got %d", len(reloaded.Items))
	}
	if reloaded.Items[0].ServiceCode != "SVC-B" {
		t.Fatalf("expected SVC-B, got %s", reloaded.Items[0].ServiceCode)
	}
	if len(reloaded.Items[0].Addons) != 1 {
		t.Fatalf("expected 1 addon")
	}
	if reloaded.Items[0].Addons[0].AddonCode != "ADD-B" {
		t.Fatalf("expected ADD-B")
	}
}

func TestOrderRepository_FindAll_SortWhitelist(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	now := time.Now().UTC()
	cust := entity.User{FullName: "Sort Test", PasswordHash: "hash", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&cust).Error; err != nil {
		t.Fatalf("create customer: %v", err)
	}
	outlet := entity.Outlet{Code: "OUT-T", Name: "OutletT", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&outlet).Error; err != nil {
		t.Fatalf("create outlet: %v", err)
	}

	// two orders at different times
	o1 := &entity.Order{CustomerID: cust.ID, OutletID: outlet.ID, Status: "NEW", OrderNo: "ORD-T-1", CreatedAt: now.Add(-time.Hour), UpdatedAt: now.Add(-time.Hour)}
	if err := repo.Create(ctx, o1); err != nil {
		t.Fatalf("create o1: %v", err)
	}
	o2 := &entity.Order{CustomerID: cust.ID, OutletID: outlet.ID, Status: "NEW", OrderNo: "ORD-T-2", CreatedAt: now, UpdatedAt: now}
	if err := repo.Create(ctx, o2); err != nil {
		t.Fatalf("create o2: %v", err)
	}

	badSort := "created_at;DROP TABLE orders" // should be ignored
	filters := OrderFilters{CustomerID: &cust.ID, Page: 1, Limit: 10, SortBy: badSort, SortOrder: "DESC"}
	orders, total, err := repo.FindAll(ctx, filters)
	if err != nil {
		t.Fatalf("FindAll error: %v", err)
	}
	if total != 2 || len(orders) != 2 {
		t.Fatalf("unexpected totals")
	}
	if orders[0].OrderNo != "ORD-T-2" {
		t.Fatalf("expected DESC by created_at fallback")
	}
}

func TestOrderRepository_CreateStatusLog_Persisted(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	now := time.Now().UTC()
	cust := entity.User{FullName: "Log Test", PasswordHash: "hash", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&cust).Error; err != nil {
		t.Fatalf("create customer: %v", err)
	}
	outlet := entity.Outlet{Code: "OUT-L", Name: "OutletL", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&outlet).Error; err != nil {
		t.Fatalf("create outlet: %v", err)
	}
	order := &entity.Order{CustomerID: cust.ID, OutletID: outlet.ID, Status: "NEW", OrderNo: "ORD-LOG-1", OrderType: "DROPOFF", CreatedAt: now, UpdatedAt: now}
	if err := repo.Create(ctx, order); err != nil {
		t.Fatalf("create order: %v", err)
	}

	from := "NEW"
	logEntry := &entity.OrderStatusLog{OrderID: order.ID, FromStatus: &from, ToStatus: "IN_PROGRESS"}
	if err := repo.CreateStatusLog(ctx, logEntry); err != nil {
		t.Fatalf("create log: %v", err)
	}

	reloaded, err := repo.FindByID(ctx, order.ID)
	if err != nil {
		t.Fatalf("reload: %v", err)
	}
	if len(reloaded.StatusLogs) != 1 {
		t.Fatalf("expected 1 status log, got %d", len(reloaded.StatusLogs))
	}
	if reloaded.StatusLogs[0].ToStatus != "IN_PROGRESS" {
		t.Fatalf("unexpected to_status")
	}
}

func TestOrderRepository_ListStatusLogs_PaginationAndSort(t *testing.T) {
	db := setupTestDB(t)
	repo := NewOrderRepository(db)
	ctx := context.Background()

	now := time.Now().UTC()
	cust := entity.User{FullName: "LogList Test", PasswordHash: "hash", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&cust).Error; err != nil {
		t.Fatalf("create customer: %v", err)
	}
	outlet := entity.Outlet{Code: "OUT-LL", Name: "OutletLL", IsActive: true, CreatedAt: now, UpdatedAt: now}
	if err := db.Create(&outlet).Error; err != nil {
		t.Fatalf("create outlet: %v", err)
	}
	order := &entity.Order{CustomerID: cust.ID, OutletID: outlet.ID, Status: "NEW", OrderNo: "ORD-LOGLIST-1", OrderType: "DROPOFF", CreatedAt: now, UpdatedAt: now}
	if err := repo.Create(ctx, order); err != nil {
		t.Fatalf("create order: %v", err)
	}

	// create 3 logs with different timestamps
	from := "NEW"
	l1 := &entity.OrderStatusLog{OrderID: order.ID, FromStatus: &from, ToStatus: "IN_PROGRESS", ChangedAt: now.Add(-3 * time.Minute), CreatedAt: now.Add(-3 * time.Minute), UpdatedAt: now.Add(-3 * time.Minute)}
	l2 := &entity.OrderStatusLog{OrderID: order.ID, FromStatus: &from, ToStatus: "COMPLETED", ChangedAt: now.Add(-2 * time.Minute), CreatedAt: now.Add(-2 * time.Minute), UpdatedAt: now.Add(-2 * time.Minute)}
	l3 := &entity.OrderStatusLog{OrderID: order.ID, FromStatus: &from, ToStatus: "CANCELED", ChangedAt: now.Add(-1 * time.Minute), CreatedAt: now.Add(-1 * time.Minute), UpdatedAt: now.Add(-1 * time.Minute)}
	for _, l := range []*entity.OrderStatusLog{l1, l2, l3} {
		if err := repo.CreateStatusLog(ctx, l); err != nil {
			t.Fatalf("create log: %v", err)
		}
	}

	// DESC should return most recent first
	logs, total, err := repo.ListStatusLogs(ctx, order.ID, 1, 2, "DESC")
	if err != nil {
		t.Fatalf("list logs: %v", err)
	}
	if total != 3 {
		t.Fatalf("expected total=3, got %d", total)
	}
	if len(logs) != 2 {
		t.Fatalf("expected page size 2, got %d", len(logs))
	}
	if logs[0].ToStatus != "CANCELED" {
		t.Fatalf("expected first CANCELED")
	}
	if logs[1].ToStatus != "COMPLETED" {
		t.Fatalf("expected second COMPLETED")
	}
}

func float64Ptr(v float64) *float64 {
	return &v
}

func stringPtr(v string) *string {
	return &v
}

func intPtr(v int) *int { return &v }
