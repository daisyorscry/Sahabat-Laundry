package repository

import (
	"context"
	"time"

	"laondry-order-service/internal/entity"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PricingRepository interface {
	FindServiceByID(ctx context.Context, id uuid.UUID) (*entity.Service, error)
	FindAddonByID(ctx context.Context, id uuid.UUID) (*entity.Addon, error)
	FindServicePrice(ctx context.Context, serviceID, outletID uuid.UUID, memberTier *string, date time.Time, isExpress bool) (*entity.ServicePrice, error)
	WithDB(db *gorm.DB) PricingRepository
}

type pricingRepositoryImpl struct {
	db *gorm.DB
}

func NewPricingRepository(db *gorm.DB) PricingRepository {
	return &pricingRepositoryImpl{db: db}
}

func (r *pricingRepositoryImpl) WithDB(db *gorm.DB) PricingRepository {
	return &pricingRepositoryImpl{db: db}
}

func (r *pricingRepositoryImpl) FindServiceByID(ctx context.Context, id uuid.UUID) (*entity.Service, error) {
    var service entity.Service
    // Select only necessary columns to avoid cross-dialect time scan issues in tests
    if err := r.db.WithContext(ctx).
        Select("id, code, name, pricing_model, base_price, est_duration_hours, is_express_available, is_active").
        Where("id = ? AND is_active = ?", id, true).
        First(&service).Error; err != nil {
        return nil, err
    }
    return &service, nil
}

func (r *pricingRepositoryImpl) FindAddonByID(ctx context.Context, id uuid.UUID) (*entity.Addon, error) {
    var addon entity.Addon
    if err := r.db.WithContext(ctx).
        Select("id, code, name, price, is_active").
        Where("id = ? AND is_active = ?", id, true).
        First(&addon).Error; err != nil {
        return nil, err
    }
    return &addon, nil
}

func (r *pricingRepositoryImpl) FindServicePrice(ctx context.Context, serviceID, outletID uuid.UUID, memberTier *string, date time.Time, isExpress bool) (*entity.ServicePrice, error) {
    buildBase := func(expressFlag bool) *gorm.DB {
        return r.db.WithContext(ctx).
            Select("id, service_id, outlet_id, member_tier, price, effective_start, effective_end, is_express").
            Where("service_id = ? AND outlet_id = ? AND is_express = ?", serviceID, outletID, expressFlag).
            Where("effective_start <= ?", date).
            Where("effective_end IS NULL OR effective_end >= ?", date)
    }

    // Try to find price with exact is_express match first, then fallback to is_express=false
    expressFlags := []bool{isExpress}
    if isExpress {
        // If requesting express, also try non-express as fallback
        expressFlags = append(expressFlags, false)
    }

    // If specific member tier is provided, prefer that price; if not found, fall back to default (NULL) tier
    if memberTier != nil && *memberTier != "" {
        for _, expFlag := range expressFlags {
            var price entity.ServicePrice
            // Try with specific member tier
            if err := buildBase(expFlag).Where("member_tier = ?", *memberTier).Order("effective_start DESC").First(&price).Error; err == nil {
                return &price, nil
            } else if err != gorm.ErrRecordNotFound {
                return nil, err
            }
            // Fallback to default tier (NULL)
            if err := buildBase(expFlag).Where("member_tier IS NULL").Order("effective_start DESC").First(&price).Error; err == nil {
                return &price, nil
            } else if err != gorm.ErrRecordNotFound {
                return nil, err
            }
        }
        return nil, gorm.ErrRecordNotFound
    }

    // No member tier provided: use default (NULL) tier
    for _, expFlag := range expressFlags {
        var price entity.ServicePrice
        if err := buildBase(expFlag).Where("member_tier IS NULL").Order("effective_start DESC").First(&price).Error; err == nil {
            return &price, nil
        } else if err != gorm.ErrRecordNotFound {
            return nil, err
        }
    }
    return nil, gorm.ErrRecordNotFound
}
