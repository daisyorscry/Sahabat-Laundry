package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentWebhookLog stores raw webhook notifications from payment gateway
type PaymentWebhookLog struct {
	ID                   uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	PaymentTransactionID *uuid.UUID     `gorm:"type:uuid;index" json:"payment_transaction_id"` // Nullable if transaction not found
	PaymentOrderID       string         `gorm:"type:varchar(100);not null;index" json:"payment_order_id"`
	Source               string         `gorm:"type:varchar(50);not null" json:"source"` // e.g., midtrans
	EventType            *string        `gorm:"type:varchar(50)" json:"event_type"`
	TransactionStatus    *string        `gorm:"type:varchar(30)" json:"transaction_status"`
	FraudStatus          *string        `gorm:"type:varchar(30)" json:"fraud_status"`
	StatusCode           *string        `gorm:"type:varchar(10)" json:"status_code"`
	GrossAmount          *string        `gorm:"type:varchar(20)" json:"gross_amount"`
	SignatureKey         *string        `gorm:"type:varchar(255)" json:"signature_key"`
	SignatureVerified    bool           `gorm:"default:false" json:"signature_verified"`
	RawPayload           JSONB          `gorm:"type:jsonb;not null" json:"raw_payload"` // Full webhook payload
	ProcessedAt          *time.Time     `json:"processed_at"`
	ProcessingError      *string        `gorm:"type:text" json:"processing_error"`
	CreatedAt            time.Time      `gorm:"not null" json:"created_at"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	PaymentTransaction *PaymentTransaction `gorm:"foreignKey:PaymentTransactionID;references:ID" json:"payment_transaction,omitempty"`
}

func (PaymentWebhookLog) TableName() string {
	return "payment_webhook_logs"
}

func (p *PaymentWebhookLog) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
