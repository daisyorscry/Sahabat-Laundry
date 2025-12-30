package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Outlet struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Code        string         `gorm:"type:varchar(50);not null;unique" json:"code"`
	Name        string         `gorm:"type:varchar(150);not null" json:"name"`
	Phone       *string        `gorm:"type:varchar(50)" json:"phone"`
	Email       *string        `gorm:"type:varchar(150)" json:"email"`
	AddressLine *string        `gorm:"type:varchar(255)" json:"address_line"`
	City        *string        `gorm:"type:varchar(100)" json:"city"`
	Province    *string        `gorm:"type:varchar(100)" json:"province"`
	PostalCode  *string        `gorm:"type:varchar(20)" json:"postal_code"`
	IsActive    bool           `gorm:"default:true;index" json:"is_active"`
	CreatedBy   *uuid.UUID     `gorm:"type:uuid" json:"created_by"`
	UpdatedBy   *uuid.UUID     `gorm:"type:uuid" json:"updated_by"`
    CreatedAt   time.Time      `gorm:"not null" json:"created_at"`
    UpdatedAt   time.Time      `gorm:"not null" json:"updated_at"`
    DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	ServicePrices []ServicePrice `gorm:"foreignKey:OutletID;constraint:OnDelete:CASCADE" json:"service_prices,omitempty"`
	Orders        []Order        `gorm:"foreignKey:OutletID;constraint:OnDelete:RESTRICT" json:"orders,omitempty"`
}

func (Outlet) TableName() string {
	return "outlets"
}

func (o *Outlet) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}
