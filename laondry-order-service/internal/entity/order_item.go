package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderItem struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	OrderID     uuid.UUID `gorm:"type:uuid;not null;index" json:"order_id"`
	ServiceID   uuid.UUID `gorm:"type:uuid;not null;index" json:"service_id"`
	ServiceCode string    `gorm:"type:varchar(50);not null;index" json:"service_code"`
	ServiceName string    `gorm:"type:varchar(150);not null" json:"service_name"`
	WeightKg    *float64  `gorm:"type:decimal(8,2)" json:"weight_kg"`
	Qty         *int      `gorm:"type:int" json:"qty"`
	UnitPrice   float64   `gorm:"type:decimal(12,2);not null" json:"unit_price"`
	LineTotal   float64   `gorm:"type:decimal(12,2);not null" json:"subtotal"` // Mobile expects subtotal
    CreatedAt   time.Time `gorm:"not null" json:"created_at"`
    UpdatedAt   time.Time `gorm:"not null" json:"updated_at"`

	Order   *Order            `gorm:"foreignKey:OrderID;references:ID" json:"order,omitempty"`
	Service *Service          `gorm:"foreignKey:ServiceID;references:ID" json:"service,omitempty"`
	Addons  []OrderItemAddon  `gorm:"foreignKey:OrderItemID;constraint:OnDelete:CASCADE" json:"addons,omitempty"`
}

func (OrderItem) TableName() string {
	return "order_items"
}

func (oi *OrderItem) BeforeCreate(tx *gorm.DB) error {
	if oi.ID == uuid.Nil {
		oi.ID = uuid.New()
	}
	return nil
}
