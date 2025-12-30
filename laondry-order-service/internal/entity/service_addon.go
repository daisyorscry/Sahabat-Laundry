package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ServiceAddon struct {
	ID         uuid.UUID `gorm:"type:uuid;primary_key" json:"id"`
	ServiceID  uuid.UUID `gorm:"type:uuid;not null;index" json:"service_id"`
	AddonID    uuid.UUID `gorm:"type:uuid;not null;index" json:"addon_id"`
	IsRequired bool      `gorm:"default:false" json:"is_required"`
	CreatedAt  time.Time `gorm:"type:timestamptz;not null" json:"created_at"`
	UpdatedAt  time.Time `gorm:"type:timestamptz;not null" json:"updated_at"`

	Service *Service `gorm:"foreignKey:ServiceID;references:ID" json:"service,omitempty"`
	Addon   *Addon   `gorm:"foreignKey:AddonID;references:ID" json:"addon,omitempty"`
}

func (ServiceAddon) TableName() string {
	return "service_addons"
}

func (sa *ServiceAddon) BeforeCreate(tx *gorm.DB) error {
	if sa.ID == uuid.Nil {
		sa.ID = uuid.New()
	}
	return nil
}
