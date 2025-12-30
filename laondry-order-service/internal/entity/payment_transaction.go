package entity

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// PaymentTransaction stores all payment transaction data
type PaymentTransaction struct {
	ID              uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	OrderID         uuid.UUID      `gorm:"type:uuid;not null;index" json:"order_id"`
	PaymentOrderID  string         `gorm:"type:varchar(100);not null;unique;index" json:"payment_order_id"` // Midtrans order_id
	PaymentMethod   *string        `gorm:"type:varchar(50)" json:"payment_method"`                          // e.g., gopay, bank_transfer
	PaymentType     *string        `gorm:"type:varchar(50)" json:"payment_type"`                            // e.g., e-wallet, bank_transfer
	GrossAmount     float64        `gorm:"type:decimal(12,2);not null" json:"gross_amount"`
	Status          string         `gorm:"type:varchar(30);not null;default:'PENDING'" json:"status"` // PENDING, SUCCESS, FAILED, EXPIRED, CANCELED
	TransactionID   *string        `gorm:"type:varchar(100);index" json:"transaction_id"`             // Midtrans transaction_id
	FraudStatus     *string        `gorm:"type:varchar(30)" json:"fraud_status"`
	SnapToken       *string        `gorm:"type:text" json:"snap_token"`
	SnapRedirectURL *string        `gorm:"type:text" json:"snap_redirect_url"`
	VANumber        *string        `gorm:"type:varchar(50)" json:"va_number"`          // For bank transfer
	BillerCode      *string        `gorm:"type:varchar(50)" json:"biller_code"`        // For some payment methods
	BillKey         *string        `gorm:"type:varchar(50)" json:"bill_key"`           // For some payment methods
	ExpiryTime      *time.Time     `json:"expiry_time"`                                // Payment expiry
	SettlementTime  *time.Time     `json:"settlement_time"`                            // When payment settled
	TransactionTime *time.Time     `json:"transaction_time"`                           // When transaction initiated
	RequestPayload  JSONB          `gorm:"type:jsonb" json:"request_payload"`          // Original snap token request
	ResponsePayload JSONB          `gorm:"type:jsonb" json:"response_payload"`         // Snap token response
	Metadata        JSONB          `gorm:"type:jsonb" json:"metadata"`                 // Additional data
	CreatedAt       time.Time      `gorm:"not null" json:"created_at"`
	UpdatedAt       time.Time      `gorm:"not null" json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	Order            *Order                     `gorm:"foreignKey:OrderID;references:ID" json:"order,omitempty"`
	StatusLogs       []PaymentStatusLog         `gorm:"foreignKey:PaymentTransactionID;constraint:OnDelete:CASCADE" json:"status_logs,omitempty"`
	WebhookLogs      []PaymentWebhookLog        `gorm:"foreignKey:PaymentTransactionID;constraint:OnDelete:CASCADE" json:"webhook_logs,omitempty"`
}

func (PaymentTransaction) TableName() string {
	return "payment_transactions"
}

func (p *PaymentTransaction) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// JSONB is a custom type for PostgreSQL JSONB fields
type JSONB map[string]interface{}

// Value implements the driver.Valuer interface
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// Scan implements the sql.Scanner interface
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}

	result := make(map[string]interface{})
	if err := json.Unmarshal(bytes, &result); err != nil {
		return err
	}

	*j = result
	return nil
}
