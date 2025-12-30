package repository

import (
	"context"
	"laondry-order-service/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentRepository interface {
	// Payment Transaction operations
	CreateTransaction(ctx context.Context, tx *entity.PaymentTransaction) error
	FindTransactionByID(ctx context.Context, id uuid.UUID) (*entity.PaymentTransaction, error)
	FindTransactionByPaymentOrderID(ctx context.Context, paymentOrderID string) (*entity.PaymentTransaction, error)
	FindTransactionByOrderID(ctx context.Context, orderID uuid.UUID) (*entity.PaymentTransaction, error)
	UpdateTransaction(ctx context.Context, tx *entity.PaymentTransaction) error
	ListTransactionsByOrderID(ctx context.Context, orderID uuid.UUID) ([]entity.PaymentTransaction, error)
	ListTransactions(ctx context.Context, filters TransactionFilters) ([]entity.PaymentTransaction, int64, error)

	// Payment Status Log operations
	CreateStatusLog(ctx context.Context, log *entity.PaymentStatusLog) error
	ListStatusLogs(ctx context.Context, paymentTransactionID uuid.UUID) ([]entity.PaymentStatusLog, error)

	// Payment Webhook Log operations
	CreateWebhookLog(ctx context.Context, log *entity.PaymentWebhookLog) error
	ListWebhookLogs(ctx context.Context, paymentTransactionID uuid.UUID) ([]entity.PaymentWebhookLog, error)
	FindWebhookLogsByPaymentOrderID(ctx context.Context, paymentOrderID string) ([]entity.PaymentWebhookLog, error)

	// Utility
	WithDB(db *gorm.DB) PaymentRepository
}

type TransactionFilters struct {
	OrderID        *uuid.UUID
	Status         *string
	PaymentMethod  *string
	PaymentType    *string
	StartDate      *string
	EndDate        *string
	Page           int
	Limit          int
	SortBy         string
	SortOrder      string
}
