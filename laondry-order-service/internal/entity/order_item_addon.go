package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderItemAddon struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	OrderItemID uuid.UUID `gorm:"type:uuid;not null;index" json:"order_item_id"`
	AddonID     uuid.UUID `gorm:"type:uuid;not null;index" json:"addon_id"`
	AddonCode   string    `gorm:"type:varchar(50);not null;index" json:"addon_code"`
	AddonName   string    `gorm:"type:varchar(120);not null" json:"addon_name"`
	Qty         int       `gorm:"default:1;not null" json:"qty"`
	UnitPrice   float64   `gorm:"type:decimal(12,2);not null" json:"unit_price"`
	LineTotal   float64   `gorm:"type:decimal(12,2);not null" json:"subtotal"` // Mobile expects subtotal
    CreatedAt   time.Time `gorm:"not null" json:"created_at"`
    UpdatedAt   time.Time `gorm:"not null" json:"updated_at"`

	OrderItem *OrderItem `gorm:"foreignKey:OrderItemID;references:ID" json:"order_item,omitempty"`
	Addon     *Addon     `gorm:"foreignKey:AddonID;references:ID" json:"addon,omitempty"`
}

func (OrderItemAddon) TableName() string {
	return "order_item_addons"
}

func (oia *OrderItemAddon) BeforeCreate(tx *gorm.DB) error {
	if oia.ID == uuid.Nil {
		oia.ID = uuid.New()
	}
	return nil
}
