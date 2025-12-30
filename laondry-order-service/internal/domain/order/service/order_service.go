package service

import (
	"context"

	"github.com/google/uuid"

	"laondry-order-service/internal/domain/order/repository"
	"laondry-order-service/internal/entity"
)

type OrderService interface {
	CreateOrder(ctx context.Context, req CreateOrderRequest) (*entity.Order, error)
	GetOrderByID(ctx context.Context, id uuid.UUID) (*entity.Order, error)
	GetOrderByOrderNo(ctx context.Context, orderNo string) (*entity.Order, error)
	GetOrders(ctx context.Context, filters repository.OrderFilters) ([]entity.Order, int64, error)
	UpdateOrder(ctx context.Context, id uuid.UUID, req UpdateOrderRequest) (*entity.Order, error)
	DeleteOrder(ctx context.Context, id uuid.UUID) error
	UpdateOrderStatus(ctx context.Context, id uuid.UUID, req UpdateStatusRequest) error
	CancelOrder(ctx context.Context, id uuid.UUID, canceledBy *uuid.UUID, reason *string) error
	CalculateOrderTotal(items []OrderItemRequest) (float64, float64, int, error)
	GetOrderStatusLogs(ctx context.Context, id uuid.UUID, page, limit int, sortOrder string) ([]entity.OrderStatusLog, int64, error)
}

type CreateOrderRequest struct {
    // Customer and outlet info (customer_id will be set from auth context)
    CustomerID        uuid.UUID          `json:"customer_id"`
    OutletID          uuid.UUID          `json:"outlet_id" validate:"required,uuid"`
    OrderType         string             `json:"order_type" validate:"required,oneof=DROPOFF PICKUP"`
    RequestedPickupAt *string            `json:"requested_pickup_at"`
    PickupAddress     *string            `json:"pickup_address"`
    DeliveryAddress   *string            `json:"delivery_address"`
    Notes             *string            `json:"notes"`
    Items             []OrderItemRequest `json:"items" validate:"required,min=1,dive"`

    // Pricing context
    // Preferably derived from authenticated user in core-api.
    // Temporarily allow client-provided member_tier code to resolve service_prices.
    MemberTier  *string `json:"member_tier"`
    // Internal fields (calculated server-side)
    DeliveryFee float64 `json:"-"` // Will be calculated
}

type OrderItemRequest struct {
	// Required fields from client
	ServiceID uuid.UUID               `json:"service_id" validate:"required,uuid"`
	WeightKg  *float64                `json:"weight_kg"`
	Qty       *int                    `json:"qty"`
	IsExpress bool                    `json:"is_express"`
	Addons    []OrderItemAddonRequest `json:"addons"`

	// These will be fetched from database (SECURITY: ignore any value from request)
	ServiceCode string  `json:"-"`
	ServiceName string  `json:"-"`
	UnitPrice   float64 `json:"-"`
}

type OrderItemAddonRequest struct {
	// Required fields from client
	AddonID uuid.UUID `json:"addon_id" validate:"required,uuid"`
	Qty     int       `json:"qty" validate:"required,gte=1"`

	// These will be fetched from database (SECURITY: ignore any value from request)
	AddonCode string  `json:"-"`
	AddonName string  `json:"-"`
	UnitPrice float64 `json:"-"`
}

type UpdateOrderRequest struct {
    OrderType         *string            `json:"order_type" validate:"omitempty,oneof=DROPOFF PICKUP"`
    RequestedPickupAt *string            `json:"requested_pickup_at"`
    PickupAddress     *string            `json:"pickup_address"`
    DeliveryAddress   *string            `json:"delivery_address"`
    DeliveryFee       *float64           `json:"delivery_fee" validate:"omitempty,gte=0"`
    Notes             *string            `json:"notes"`
    Items             []OrderItemRequest `json:"items" validate:"omitempty,dive"`
}

type UpdateStatusRequest struct {
	Status    string     `json:"status" validate:"required"`
	ChangedBy *uuid.UUID `json:"changed_by"`
	Note      *string    `json:"note"`
}
