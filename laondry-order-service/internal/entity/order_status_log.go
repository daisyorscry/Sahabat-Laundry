package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OrderStatusLog struct {
	ID         uuid.UUID  `gorm:"type:uuid;primary_key" json:"id"`
	OrderID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"order_id"`
	FromStatus *string    `gorm:"type:varchar(30)" json:"from_status"`
	ToStatus   string     `gorm:"type:varchar(30);not null;index" json:"to_status"`
	ChangedBy  *uuid.UUID `gorm:"type:uuid" json:"changed_by"`
	Note       *string    `gorm:"type:text" json:"note"`
    ChangedAt  time.Time  `gorm:"not null;default:CURRENT_TIMESTAMP;index" json:"changed_at"`
    CreatedAt  time.Time  `gorm:"not null" json:"created_at"`
    UpdatedAt  time.Time  `gorm:"not null" json:"updated_at"`

	Order        *Order       `gorm:"foreignKey:OrderID;references:ID" json:"order,omitempty"`
	ChangedByUser *User       `gorm:"foreignKey:ChangedBy;references:ID" json:"changed_by_user,omitempty"`
}

func (OrderStatusLog) TableName() string {
	return "order_status_logs"
}

func (osl *OrderStatusLog) BeforeCreate(tx *gorm.DB) error {
	if osl.ID == uuid.Nil {
		osl.ID = uuid.New()
	}
	if osl.ChangedAt.IsZero() {
		osl.ChangedAt = time.Now()
	}
	return nil
}
