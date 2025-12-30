package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ServicePrice struct {
	ID             uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	ServiceID      uuid.UUID `gorm:"type:uuid;not null;index" json:"service_id"`
	OutletID       uuid.UUID `gorm:"type:uuid;not null;index" json:"outlet_id"`
	MemberTier     *string   `gorm:"type:varchar(50)" json:"member_tier"`
	Price          float64   `gorm:"type:decimal(12,2);not null" json:"price"`
	EffectiveStart time.Time `gorm:"type:date;not null" json:"effective_start"`
	EffectiveEnd   *time.Time `gorm:"type:date" json:"effective_end"`
	IsExpress      bool      `gorm:"default:false;not null" json:"is_express"`
	CreatedAt      time.Time `gorm:"type:timestamptz;not null" json:"created_at"`
	UpdatedAt      time.Time `gorm:"type:timestamptz;not null" json:"updated_at"`

	Service *Service `gorm:"foreignKey:ServiceID;references:ID" json:"service,omitempty"`
	Outlet  *Outlet  `gorm:"foreignKey:OutletID;references:ID" json:"outlet,omitempty"`
}

func (ServicePrice) TableName() string {
	return "service_prices"
}

func (sp *ServicePrice) BeforeCreate(tx *gorm.DB) error {
	if sp.ID == uuid.Nil {
		sp.ID = uuid.New()
	}
	return nil
}
