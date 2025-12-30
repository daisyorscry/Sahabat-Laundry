package repository

import (
	"context"

	"laondry-order-service/internal/entity"
	appErrors "laondry-order-service/pkg/errors"

	"github.com/google/uuid"
	"github.com/newrelic/go-agent/v3/newrelic"
	"gorm.io/gorm"
)

type orderRepository struct {
	db *gorm.DB
}

func NewOrderRepository(db *gorm.DB) OrderRepository {
	return &orderRepository{
		db: db,
	}
}

func (r *orderRepository) WithDB(db *gorm.DB) OrderRepository {
	return &orderRepository{db: db}
}

func nrProductFor(db *gorm.DB) newrelic.DatastoreProduct {
	if db == nil {
		return newrelic.DatastoreProduct("unknown")
	}
	return newrelic.DatastoreProduct(db.Dialector.Name())
}

func (r *orderRepository) Create(ctx context.Context, order *entity.Order) error {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "orders", Operation: "INSERT"}
		seg.StartTime = newrelic.StartSegmentNow(txn)
		defer seg.End()
	}
	if err := r.db.WithContext(ctx).Create(order).Error; err != nil {
		return appErrors.InternalServerError("Failed to create order", err)
	}
	return nil
}

func (r *orderRepository) FindByID(ctx context.Context, id uuid.UUID) (*entity.Order, error) {
	var order entity.Order
	db := r.db.WithContext(ctx)
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "orders", Operation: "SELECT"}
		seg.StartTime = newrelic.StartSegmentNow(txn)
		defer seg.End()
	}
	err := db.
		Preload("Customer").
		Preload("Outlet").
		Preload("Items").
		Preload("Items.Addons").
		Preload("StatusLogs").
		First(&order, "id = ?", id).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, appErrors.NotFound("Order not found", err)
		}
		return nil, appErrors.InternalServerError("Failed to find order", err)
	}

	return &order, nil
}

func (r *orderRepository) FindByOrderNo(ctx context.Context, orderNo string) (*entity.Order, error) {
	var order entity.Order
	db := r.db.WithContext(ctx)
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "orders", Operation: "SELECT"}
		seg.StartTime = newrelic.StartSegmentNow(txn)
		defer seg.End()
	}
	err := db.
		Preload("Customer").
		Preload("Outlet").
		Preload("Items").
		Preload("Items.Addons").
		Preload("StatusLogs").
		First(&order, "order_no = ?", orderNo).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, appErrors.NotFound("Order not found", err)
		}
		return nil, appErrors.InternalServerError("Failed to find order", err)
	}

	return &order, nil
}

func (r *orderRepository) FindAll(ctx context.Context, filters OrderFilters) ([]entity.Order, int64, error) {
	var orders []entity.Order
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.Order{})

	if filters.CustomerID != nil {
		query = query.Where("customer_id = ?", *filters.CustomerID)
	}

	if filters.OutletID != nil {
		query = query.Where("outlet_id = ?", *filters.OutletID)
	}

	if filters.Status != nil {
		query = query.Where("status = ?", *filters.Status)
	}

	if filters.OrderType != nil {
		query = query.Where("order_type = ?", *filters.OrderType)
	}

	if filters.StartDate != nil {
		query = query.Where("DATE(created_at) >= ?", *filters.StartDate)
	}

	if filters.EndDate != nil {
		query = query.Where("DATE(created_at) <= ?", *filters.EndDate)
	}

	if filters.Search != nil && *filters.Search != "" {
		searchPattern := "%" + *filters.Search + "%"
		// Use ILIKE on Postgres, LIKE elsewhere (e.g., SQLite)
		comparator := "ILIKE"
		if r.db.Dialector.Name() != "postgres" {
			comparator = "LIKE"
		}
		query = query.Where("order_no "+comparator+" ? OR notes "+comparator+" ?", searchPattern, searchPattern)
	}

	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "orders", Operation: "COUNT"}
		seg.StartTime = newrelic.StartSegmentNow(txn)
		defer seg.End()
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, appErrors.InternalServerError("Failed to count orders", err)
	}

	// Whitelist sort columns and order to avoid SQL injection
	allowedSorts := map[string]string{
		"created_at":  "created_at",
		"order_no":    "order_no",
		"grand_total": "grand_total",
		"status":      "status",
	}
	sortBy := "created_at"
	if col, ok := allowedSorts[filters.SortBy]; ok {
		sortBy = col
	}

	sortOrder := "DESC"
	if filters.SortOrder == "ASC" || filters.SortOrder == "DESC" || filters.SortOrder == "asc" || filters.SortOrder == "desc" {
		if filters.SortOrder == "asc" {
			sortOrder = "ASC"
		} else if filters.SortOrder == "desc" {
			sortOrder = "DESC"
		} else {
			sortOrder = filters.SortOrder
		}
	}

	// Safe pagination defaults
	page := filters.Page
	limit := filters.Limit
	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	query = query.Order(sortBy + " " + sortOrder).
		Offset(offset).
		Limit(limit)

	query = query.Preload("Customer").
		Preload("Outlet").
		Preload("Items").
		Preload("Items.Addons")

	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "orders", Operation: "SELECT"}
		seg.StartTime = newrelic.StartSegmentNow(txn)
		defer seg.End()
	}
	if err := query.Find(&orders).Error; err != nil {
		return nil, 0, appErrors.InternalServerError("Failed to find orders", err)
	}

	return orders, total, nil
}

func (r *orderRepository) Update(ctx context.Context, order *entity.Order) error {
	tx := r.db.WithContext(ctx)
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "orders", Operation: "UPDATE"}
		seg.StartTime = newrelic.StartSegmentNow(txn)
		defer seg.End()
	}
	if err := tx.Save(order).Error; err != nil {
		return appErrors.InternalServerError("Failed to update order", err)
	}
	if len(order.Items) > 0 {
		if err := tx.Where("order_id = ?", order.ID).Delete(&entity.OrderItem{}).Error; err != nil {
			return appErrors.InternalServerError("Failed to clear existing order items", err)
		}
		for i := range order.Items {
			order.Items[i].OrderID = order.ID
		}
		if txn := newrelic.FromContext(ctx); txn != nil {
			seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "order_items", Operation: "INSERT"}
			seg.StartTime = newrelic.StartSegmentNow(txn)
			defer seg.End()
		}
		if err := tx.Create(&order.Items).Error; err != nil {
			return appErrors.InternalServerError("Failed to create order items", err)
		}
	}
	return nil
}

func (r *orderRepository) Delete(ctx context.Context, id uuid.UUID) error {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "orders", Operation: "DELETE"}
		seg.StartTime = newrelic.StartSegmentNow(txn)
		defer seg.End()
	}
	result := r.db.WithContext(ctx).Delete(&entity.Order{}, "id = ?", id)
	if result.Error != nil {
		return appErrors.InternalServerError("Failed to delete order", result.Error)
	}
	if result.RowsAffected == 0 {
		return appErrors.NotFound("Order not found", nil)
	}
	return nil
}

func (r *orderRepository) UpdateStatus(ctx context.Context, id uuid.UUID, status string) error {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "orders", Operation: "UPDATE"}
		seg.StartTime = newrelic.StartSegmentNow(txn)
		defer seg.End()
	}
	result := r.db.WithContext(ctx).Model(&entity.Order{}).Where("id = ?", id).Update("status", status)
	if result.Error != nil {
		return appErrors.InternalServerError("Failed to update order status", result.Error)
	}
	if result.RowsAffected == 0 {
		return appErrors.NotFound("Order not found", nil)
	}
	return nil
}

func (r *orderRepository) CreateStatusLog(ctx context.Context, logEntry *entity.OrderStatusLog) error {
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "order_status_logs", Operation: "INSERT"}
		seg.StartTime = newrelic.StartSegmentNow(txn)
		defer seg.End()
	}
	if err := r.db.WithContext(ctx).Create(logEntry).Error; err != nil {
		return appErrors.InternalServerError("Failed to create status log", err)
	}
	return nil
}

func (r *orderRepository) ListStatusLogs(ctx context.Context, orderID uuid.UUID, page, limit int, sortOrder string) ([]entity.OrderStatusLog, int64, error) {
	var logs []entity.OrderStatusLog
	var total int64
	q := r.db.WithContext(ctx).Model(&entity.OrderStatusLog{}).Where("order_id = ?", orderID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, appErrors.InternalServerError("Failed to count status logs", err)
	}

	if sortOrder != "ASC" && sortOrder != "DESC" && sortOrder != "asc" && sortOrder != "desc" {
		sortOrder = "DESC"
	}
	if sortOrder == "asc" {
		sortOrder = "ASC"
	}
	if sortOrder == "desc" {
		sortOrder = "DESC"
	}

	if page < 1 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := newrelic.DatastoreSegment{Product: nrProductFor(r.db), Collection: "order_status_logs", Operation: "SELECT"}
		seg.StartTime = newrelic.StartSegmentNow(txn)
		defer seg.End()
	}
	if err := q.Order("changed_at " + sortOrder).Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, 0, appErrors.InternalServerError("Failed to list status logs", err)
	}
	return logs, total, nil
}
