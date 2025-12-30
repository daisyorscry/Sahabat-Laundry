package repository

import (
	"context"
	"laondry-order-service/internal/entity"

	"github.com/google/uuid"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// MockPaymentRepository is a mock implementation of PaymentRepository for testing
type MockPaymentRepository struct {
	mock.Mock
}

func NewMockPaymentRepository() *MockPaymentRepository {
	return &MockPaymentRepository{}
}

func (m *MockPaymentRepository) CreateTransaction(ctx context.Context, tx *entity.PaymentTransaction) error {
	args := m.Called(ctx, tx)
	return args.Error(0)
}

func (m *MockPaymentRepository) FindTransactionByID(ctx context.Context, id uuid.UUID) (*entity.PaymentTransaction, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.PaymentTransaction), args.Error(1)
}

func (m *MockPaymentRepository) FindTransactionByPaymentOrderID(ctx context.Context, paymentOrderID string) (*entity.PaymentTransaction, error) {
	args := m.Called(ctx, paymentOrderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.PaymentTransaction), args.Error(1)
}

func (m *MockPaymentRepository) FindTransactionByOrderID(ctx context.Context, orderID uuid.UUID) (*entity.PaymentTransaction, error) {
	args := m.Called(ctx, orderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.PaymentTransaction), args.Error(1)
}

func (m *MockPaymentRepository) UpdateTransaction(ctx context.Context, tx *entity.PaymentTransaction) error {
	args := m.Called(ctx, tx)
	return args.Error(0)
}

func (m *MockPaymentRepository) ListTransactionsByOrderID(ctx context.Context, orderID uuid.UUID) ([]entity.PaymentTransaction, error) {
	args := m.Called(ctx, orderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]entity.PaymentTransaction), args.Error(1)
}

func (m *MockPaymentRepository) ListTransactions(ctx context.Context, filters TransactionFilters) ([]entity.PaymentTransaction, int64, error) {
	args := m.Called(ctx, filters)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]entity.PaymentTransaction), args.Get(1).(int64), args.Error(2)
}

func (m *MockPaymentRepository) CreateStatusLog(ctx context.Context, log *entity.PaymentStatusLog) error {
	args := m.Called(ctx, log)
	return args.Error(0)
}

func (m *MockPaymentRepository) ListStatusLogs(ctx context.Context, paymentTransactionID uuid.UUID) ([]entity.PaymentStatusLog, error) {
	args := m.Called(ctx, paymentTransactionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]entity.PaymentStatusLog), args.Error(1)
}

func (m *MockPaymentRepository) CreateWebhookLog(ctx context.Context, log *entity.PaymentWebhookLog) error {
	args := m.Called(ctx, log)
	return args.Error(0)
}

func (m *MockPaymentRepository) ListWebhookLogs(ctx context.Context, paymentTransactionID uuid.UUID) ([]entity.PaymentWebhookLog, error) {
	args := m.Called(ctx, paymentTransactionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]entity.PaymentWebhookLog), args.Error(1)
}

func (m *MockPaymentRepository) FindWebhookLogsByPaymentOrderID(ctx context.Context, paymentOrderID string) ([]entity.PaymentWebhookLog, error) {
	args := m.Called(ctx, paymentOrderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]entity.PaymentWebhookLog), args.Error(1)
}

func (m *MockPaymentRepository) WithDB(db *gorm.DB) PaymentRepository {
	args := m.Called(db)
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(PaymentRepository)
}
