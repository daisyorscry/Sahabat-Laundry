package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Addon struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Code        string         `gorm:"type:varchar(50);not null;unique" json:"code"`
	Name        string         `gorm:"type:varchar(120);not null" json:"name"`
	Description *string        `gorm:"type:text" json:"description"`
	Price       float64        `gorm:"type:decimal(12,2);default:0" json:"price"`
	IsActive    bool           `gorm:"default:true;index" json:"is_active"`
	IconPath    *string        `gorm:"type:varchar(255)" json:"icon_path"`
	CreatedBy   *uuid.UUID     `gorm:"type:uuid" json:"created_by"`
	UpdatedBy   *uuid.UUID     `gorm:"type:uuid" json:"updated_by"`
	CreatedAt   time.Time      `gorm:"type:timestamptz;not null" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"type:timestamptz;not null" json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"type:timestamptz;index" json:"deleted_at,omitempty"`

	ServiceAddons []ServiceAddon `gorm:"foreignKey:AddonID;constraint:OnDelete:CASCADE" json:"service_addons,omitempty"`
}

func (Addon) TableName() string {
	return "addons"
}

func (a *Addon) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}
