package repository

import (
    "context"

    "laondry-order-service/internal/entity"

    "github.com/google/uuid"
    "gorm.io/gorm"
)

type OrderRepository interface {
    Create(ctx context.Context, order *entity.Order) error
    FindByID(ctx context.Context, id uuid.UUID) (*entity.Order, error)
    FindByOrderNo(ctx context.Context, orderNo string) (*entity.Order, error)
    FindAll(ctx context.Context, filters OrderFilters) ([]entity.Order, int64, error)
    Update(ctx context.Context, order *entity.Order) error
    Delete(ctx context.Context, id uuid.UUID) error
    UpdateStatus(ctx context.Context, id uuid.UUID, status string) error
    CreateStatusLog(ctx context.Context, log *entity.OrderStatusLog) error
    ListStatusLogs(ctx context.Context, orderID uuid.UUID, page, limit int, sortOrder string) ([]entity.OrderStatusLog, int64, error)
    // WithDB returns a repository bound to the provided *gorm.DB (e.g., a transaction)
    WithDB(db *gorm.DB) OrderRepository
}

type OrderFilters struct {
	CustomerID *uuid.UUID
	OutletID   *uuid.UUID
	Status     *string
	OrderType  *string
	StartDate  *string
	EndDate    *string
	Search     *string
	Page       int
	Limit      int
	SortBy     string
	SortOrder  string
}
