package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Service struct {
	ID                 uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	CategoryID         uuid.UUID      `gorm:"type:uuid;not null;index" json:"category_id"`
	Code               string         `gorm:"type:varchar(50);not null;unique" json:"code"`
	Name               string         `gorm:"type:varchar(150);not null" json:"name"`
	Description        *string        `gorm:"type:text" json:"description"`
	PricingModel       string         `gorm:"type:varchar(20);not null;index" json:"pricing_model"`
	BasePrice          float64        `gorm:"type:decimal(12,2);default:0" json:"base_price"`
	MinQty             float64        `gorm:"type:decimal(8,2);default:0" json:"min_qty"`
	EstDurationHours   int            `gorm:"default:24" json:"est_duration_hours"`
	IsExpressAvailable bool           `gorm:"default:false" json:"is_express_available"`
	IsActive           bool           `gorm:"default:true;index" json:"is_active"`
	IconPath           *string        `gorm:"type:varchar(255)" json:"icon_path"`
	CreatedBy          *uuid.UUID     `gorm:"type:uuid" json:"created_by"`
	UpdatedBy          *uuid.UUID     `gorm:"type:uuid" json:"updated_by"`
	CreatedAt          time.Time      `gorm:"type:timestamptz;not null" json:"created_at"`
	UpdatedAt          time.Time      `gorm:"type:timestamptz;not null" json:"updated_at"`
	DeletedAt          gorm.DeletedAt `gorm:"type:timestamptz;index" json:"deleted_at,omitempty"`

	Category      *ServiceCategory `gorm:"foreignKey:CategoryID;references:ID" json:"category,omitempty"`
	ServiceAddons []ServiceAddon   `gorm:"foreignKey:ServiceID;constraint:OnDelete:CASCADE" json:"service_addons,omitempty"`
	Prices        []ServicePrice   `gorm:"foreignKey:ServiceID;constraint:OnDelete:CASCADE" json:"prices,omitempty"`
}

func (Service) TableName() string {
	return "services"
}

func (s *Service) BeforeCreate(tx *gorm.DB) error {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	return nil
}
