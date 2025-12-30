package repository

import (
	"context"
	"laondry-order-service/internal/entity"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type paymentRepositoryImpl struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) PaymentRepository {
	return &paymentRepositoryImpl{db: db}
}

func (r *paymentRepositoryImpl) WithDB(db *gorm.DB) PaymentRepository {
	return &paymentRepositoryImpl{db: db}
}

// CreateTransaction creates a new payment transaction
func (r *paymentRepositoryImpl) CreateTransaction(ctx context.Context, tx *entity.PaymentTransaction) error {
	return r.db.WithContext(ctx).Create(tx).Error
}

// FindTransactionByID finds a payment transaction by ID
func (r *paymentRepositoryImpl) FindTransactionByID(ctx context.Context, id uuid.UUID) (*entity.PaymentTransaction, error) {
	var tx entity.PaymentTransaction
	err := r.db.WithContext(ctx).
		Preload("Order").
		Preload("StatusLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Preload("WebhookLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Where("id = ?", id).
		First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

// FindTransactionByPaymentOrderID finds a payment transaction by payment order ID (Midtrans order_id)
func (r *paymentRepositoryImpl) FindTransactionByPaymentOrderID(ctx context.Context, paymentOrderID string) (*entity.PaymentTransaction, error) {
	var tx entity.PaymentTransaction
	err := r.db.WithContext(ctx).
		Preload("Order").
		Preload("StatusLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Preload("WebhookLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Where("payment_order_id = ?", paymentOrderID).
		First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

// FindTransactionByOrderID finds the latest payment transaction for an order
func (r *paymentRepositoryImpl) FindTransactionByOrderID(ctx context.Context, orderID uuid.UUID) (*entity.PaymentTransaction, error) {
	var tx entity.PaymentTransaction
	err := r.db.WithContext(ctx).
		Preload("Order").
		Preload("StatusLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Preload("WebhookLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Where("order_id = ?", orderID).
		Order("created_at DESC").
		First(&tx).Error
	if err != nil {
		return nil, err
	}
	return &tx, nil
}

// UpdateTransaction updates a payment transaction
func (r *paymentRepositoryImpl) UpdateTransaction(ctx context.Context, tx *entity.PaymentTransaction) error {
	return r.db.WithContext(ctx).Save(tx).Error
}

// ListTransactionsByOrderID lists all payment transactions for an order
func (r *paymentRepositoryImpl) ListTransactionsByOrderID(ctx context.Context, orderID uuid.UUID) ([]entity.PaymentTransaction, error) {
	var transactions []entity.PaymentTransaction
	err := r.db.WithContext(ctx).
		Preload("Order").
		Preload("StatusLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Where("order_id = ?", orderID).
		Order("created_at DESC").
		Find(&transactions).Error
	return transactions, err
}

// ListTransactions lists payment transactions with filters
func (r *paymentRepositoryImpl) ListTransactions(ctx context.Context, filters TransactionFilters) ([]entity.PaymentTransaction, int64, error) {
	var transactions []entity.PaymentTransaction
	var total int64

	query := r.db.WithContext(ctx).Model(&entity.PaymentTransaction{})

	// Apply filters
	if filters.OrderID != nil {
		query = query.Where("order_id = ?", *filters.OrderID)
	}
	if filters.Status != nil {
		query = query.Where("status = ?", *filters.Status)
	}
	if filters.PaymentMethod != nil {
		query = query.Where("payment_method = ?", *filters.PaymentMethod)
	}
	if filters.PaymentType != nil {
		query = query.Where("payment_type = ?", *filters.PaymentType)
	}
	if filters.StartDate != nil {
		startDate, err := time.Parse("2006-01-02", *filters.StartDate)
		if err == nil {
			query = query.Where("created_at >= ?", startDate)
		}
	}
	if filters.EndDate != nil {
		endDate, err := time.Parse("2006-01-02", *filters.EndDate)
		if err == nil {
			// Add one day to include the end date
			endDate = endDate.Add(24 * time.Hour)
			query = query.Where("created_at < ?", endDate)
		}
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Sorting
	sortBy := filters.SortBy
	if sortBy == "" {
		sortBy = "created_at"
	}
	sortOrder := filters.SortOrder
	if sortOrder == "" {
		sortOrder = "DESC"
	}
	query = query.Order(sortBy + " " + sortOrder)

	// Pagination
	if filters.Page > 0 && filters.Limit > 0 {
		offset := (filters.Page - 1) * filters.Limit
		query = query.Offset(offset).Limit(filters.Limit)
	}

	// Execute query with preloads
	err := query.
		Preload("Order").
		Preload("StatusLogs", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC").Limit(5) // Last 5 status logs
		}).
		Find(&transactions).Error

	return transactions, total, err
}

// CreateStatusLog creates a payment status log
func (r *paymentRepositoryImpl) CreateStatusLog(ctx context.Context, log *entity.PaymentStatusLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

// ListStatusLogs lists all status logs for a payment transaction
func (r *paymentRepositoryImpl) ListStatusLogs(ctx context.Context, paymentTransactionID uuid.UUID) ([]entity.PaymentStatusLog, error) {
	var logs []entity.PaymentStatusLog
	err := r.db.WithContext(ctx).
		Where("payment_transaction_id = ?", paymentTransactionID).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}

// CreateWebhookLog creates a webhook log
func (r *paymentRepositoryImpl) CreateWebhookLog(ctx context.Context, log *entity.PaymentWebhookLog) error {
	return r.db.WithContext(ctx).Create(log).Error
}

// ListWebhookLogs lists all webhook logs for a payment transaction
func (r *paymentRepositoryImpl) ListWebhookLogs(ctx context.Context, paymentTransactionID uuid.UUID) ([]entity.PaymentWebhookLog, error) {
	var logs []entity.PaymentWebhookLog
	err := r.db.WithContext(ctx).
		Where("payment_transaction_id = ?", paymentTransactionID).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}

// FindWebhookLogsByPaymentOrderID finds webhook logs by payment order ID
func (r *paymentRepositoryImpl) FindWebhookLogsByPaymentOrderID(ctx context.Context, paymentOrderID string) ([]entity.PaymentWebhookLog, error) {
	var logs []entity.PaymentWebhookLog
	err := r.db.WithContext(ctx).
		Where("payment_order_id = ?", paymentOrderID).
		Order("created_at DESC").
		Find(&logs).Error
	return logs, err
}
