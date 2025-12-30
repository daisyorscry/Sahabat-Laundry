package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ServiceCategory struct {
	ID          uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	Code        string         `gorm:"type:varchar(50);not null;unique" json:"code"`
	Name        string         `gorm:"type:varchar(100);not null" json:"name"`
	Description *string        `gorm:"type:text" json:"description"`
	IsActive    bool           `gorm:"default:true;index" json:"is_active"`
	CreatedBy   *uuid.UUID     `gorm:"type:uuid" json:"created_by"`
	UpdatedBy   *uuid.UUID     `gorm:"type:uuid" json:"updated_by"`
	CreatedAt   time.Time      `gorm:"type:timestamptz;not null" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"type:timestamptz;not null" json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"type:timestamptz;index" json:"deleted_at,omitempty"`

	Services []Service `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL" json:"services,omitempty"`
}

func (ServiceCategory) TableName() string {
	return "service_categories"
}

func (sc *ServiceCategory) BeforeCreate(tx *gorm.DB) error {
	if sc.ID == uuid.Nil {
		sc.ID = uuid.New()
	}
	return nil
}
