package entity

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID               uuid.UUID      `gorm:"type:uuid;primary_key" json:"id"`
	FullName         string         `gorm:"type:varchar(100);not null" json:"full_name"`
	Email            *string        `gorm:"type:varchar(100);unique" json:"email"`
	PhoneNumber      *string        `gorm:"type:varchar(20);unique" json:"phone_number"`
	DefaultOutletID  *uuid.UUID     `gorm:"type:uuid" json:"default_outlet_id"`
	PasswordHash     string         `gorm:"type:text;not null" json:"-"`
	PinHash          *string        `gorm:"type:varchar(255)" json:"-"`
	IsActive         bool           `gorm:"default:true" json:"is_active"`
	BannedReason     *string        `gorm:"type:varchar(255)" json:"banned_reason"`
	TokenVersion     int            `gorm:"default:0" json:"token_version"`
	Balance          float64        `gorm:"type:decimal(12,2);default:0" json:"balance"`
    EmailVerifiedAt  *time.Time     `json:"email_verified_at"`
	AvatarDisk       *string        `gorm:"type:varchar(50)" json:"avatar_disk"`
	AvatarPath       *string        `gorm:"type:varchar(255)" json:"avatar_path"`
	CustomerStatusID *uint          `gorm:"type:bigint" json:"customer_status_id"`
	MemberTierID     *uint          `gorm:"type:bigint" json:"member_tier_id"`
    CreatedAt        time.Time      `gorm:"not null" json:"created_at"`
    UpdatedAt        time.Time      `gorm:"not null" json:"updated_at"`
    DeletedAt        gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`

	DefaultOutlet *Outlet     `gorm:"foreignKey:DefaultOutletID;references:ID" json:"default_outlet,omitempty"`
	MemberTier    *MemberTier `gorm:"foreignKey:MemberTierID;references:ID" json:"member_tier,omitempty"`
}

func (User) TableName() string {
	return "users"
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}
