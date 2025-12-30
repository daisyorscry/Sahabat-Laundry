package entity

import (
	"time"
)

type OrderStatus struct {
	Code      string    `gorm:"type:varchar(30);primary_key" json:"code"`
	Name      string    `gorm:"type:varchar(80);not null" json:"name"`
	IsFinal   bool      `gorm:"default:false;not null" json:"is_final"`
	CreatedAt time.Time `gorm:"type:timestamptz;not null" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:timestamptz;not null" json:"updated_at"`
}

func (OrderStatus) TableName() string {
	return "order_statuses"
}
