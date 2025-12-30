package entity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Order struct {
	ID                uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	CustomerID        uuid.UUID      `gorm:"type:uuid;not null;index" json:"customer_id"`
	OutletID          uuid.UUID      `gorm:"type:uuid;not null;index" json:"outlet_id"`
	Status            string         `gorm:"type:varchar(30);not null;default:'NEW'" json:"status_code"` // Mobile expects status_code
	OrderNo           string         `gorm:"type:varchar(30);not null;unique" json:"order_no"`
	OrderType         string         `gorm:"type:varchar(20);not null;default:'DROPOFF'" json:"order_type"`
	RequestedPickupAt *time.Time     `json:"requested_pickup_at"`
	PromisedAt        *time.Time     `json:"promised_at"`
	PickupAddress     *string        `gorm:"type:varchar(255)" json:"pickup_address"`
	DeliveryAddress   *string        `gorm:"type:varchar(255)" json:"delivery_address"`
	TotalWeight       float64        `gorm:"type:decimal(8,2);default:0" json:"total_weight"`
	TotalPiece        int            `gorm:"default:0" json:"total_piece"`
	Subtotal          float64        `gorm:"type:decimal(12,2);default:0" json:"subtotal"`
	Discount          float64        `gorm:"type:decimal(12,2);default:0" json:"discount_amount"` // Mobile expects discount_amount
	Tax               float64        `gorm:"type:decimal(12,2);default:0" json:"tax_amount"`      // Mobile expects tax_amount
	DeliveryFee       float64        `gorm:"type:decimal(12,2);default:0" json:"delivery_fee"`
	GrandTotal        float64        `gorm:"type:decimal(12,2);default:0" json:"total"` // Mobile expects total
	ExternalInvoiceID *string        `gorm:"type:varchar(100)" json:"external_invoice_id"`
	ExternalPaymentID *string        `gorm:"type:varchar(100)" json:"external_payment_id"`
	Notes             *string        `gorm:"type:text" json:"notes"`
	CreatedBy         *uuid.UUID     `gorm:"type:uuid" json:"created_by"`
	UpdatedBy         *uuid.UUID     `gorm:"type:uuid" json:"updated_by"`
	CreatedAt         time.Time      `gorm:"not null" json:"created_at"`
	UpdatedAt         time.Time      `gorm:"not null" json:"updated_at"`
	DeletedAt         gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	IsExpress         bool           `gorm:"-" json:"is_express"` // Virtual field, computed from items

	Customer   *User            `gorm:"foreignKey:CustomerID;references:ID" json:"customer,omitempty"`
	Outlet     *Outlet          `gorm:"foreignKey:OutletID;references:ID" json:"outlet,omitempty"`
	Items      []OrderItem      `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"items,omitempty"`
	StatusLogs []OrderStatusLog `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"status_logs,omitempty"`
}

func (Order) TableName() string {
	return "orders"
}

func (o *Order) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

// MarshalJSON adds computed fields for mobile compatibility
func (o *Order) MarshalJSON() ([]byte, error) {
	type Alias Order

	// Add outlet_name from preloaded Outlet
	outletName := ""
	if o.Outlet != nil {
		outletName = o.Outlet.Name
	}

	// Add status_name (map status code to display name)
	statusName := getStatusName(o.Status)

	// Check if any item is express
	isExpress := false
	for range o.Items {
		// For now, we assume all items have same express status
		// TODO: Store is_express in order_items table
		break
	}
	o.IsExpress = isExpress

	return json.Marshal(&struct {
		*Alias
		OutletName *string `json:"outlet_name"`
		StatusName string  `json:"status_name"`
	}{
		Alias:      (*Alias)(o),
		OutletName: &outletName,
		StatusName: statusName,
	})
}

func getStatusName(status string) string {
	statusMap := map[string]string{
		"NEW":         "Baru",
		"PENDING":     "Menunggu",
		"IN_PROGRESS": "Diproses",
		"COMPLETED":   "Selesai",
		"CANCELED":    "Dibatalkan",
		"CANCELLED":   "Dibatalkan",
	}
	if name, ok := statusMap[status]; ok {
		return name
	}
	return status
}
