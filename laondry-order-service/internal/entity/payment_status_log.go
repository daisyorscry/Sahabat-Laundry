package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentStatusLog tracks all status changes for a payment transaction
type PaymentStatusLog struct {
	ID                   uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	PaymentTransactionID uuid.UUID      `gorm:"type:uuid;not null;index" json:"payment_transaction_id"`
	PreviousStatus       *string        `gorm:"type:varchar(30)" json:"previous_status"`
	NewStatus            string         `gorm:"type:varchar(30);not null" json:"new_status"`
	FraudStatus          *string        `gorm:"type:varchar(30)" json:"fraud_status"`
	StatusMessage        *string        `gorm:"type:text" json:"status_message"`
	Source               string         `gorm:"type:varchar(50);not null" json:"source"` // e.g., webhook, api_check, manual
	RawData              JSONB          `gorm:"type:jsonb" json:"raw_data"`              // Full status data
	CreatedAt            time.Time      `gorm:"not null" json:"created_at"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	PaymentTransaction *PaymentTransaction `gorm:"foreignKey:PaymentTransactionID;references:ID" json:"payment_transaction,omitempty"`
}

func (PaymentStatusLog) TableName() string {
	return "payment_status_logs"
}

func (p *PaymentStatusLog) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
