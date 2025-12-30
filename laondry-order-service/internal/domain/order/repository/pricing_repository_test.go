package repository

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"

	"laondry-order-service/internal/entity"
)

func TestFindServicePrice_WithMemberTier_ExactMatch(t *testing.T) {
	db := setupTestDB(t)
	repo := NewPricingRepository(db)
	ctx := context.Background()

	// Setup test data
	serviceID := uuid.New()
	outletID := uuid.New()
	memberTier := "GOLD"

	// Create service
	service := &entity.Service{
		ID:                 serviceID,
		Code:               "TEST-001",
		Name:               "Test Service",
		PricingModel:       "unit",
		BasePrice:          20000,
		EstDurationHours:   24,
		IsExpressAvailable: true,
		IsActive:           true,
	}
	require.NoError(t, db.Create(service).Error)

	// Create service price with member tier GOLD
	now := time.Now()
	servicePrice := &entity.ServicePrice{
		ID:             uuid.New(),
		ServiceID:      serviceID,
		OutletID:       outletID,
		MemberTier:     &memberTier,
		Price:          17000, // Discounted price
		EffectiveStart: now.Add(-24 * time.Hour),
		EffectiveEnd:   nil,
		IsExpress:      false,
	}
	require.NoError(t, db.Create(servicePrice).Error)

	// Test: Should find the GOLD tier price
	result, err := repo.FindServicePrice(ctx, serviceID, outletID, &memberTier, now, false)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 17000.0, result.Price)
	assert.Equal(t, memberTier, *result.MemberTier)
}

func TestFindServicePrice_WithMemberTier_FallbackToDefault(t *testing.T) {
	db := setupTestDB(t)
	repo := NewPricingRepository(db)
	ctx := context.Background()

	// Setup test data
	serviceID := uuid.New()
	outletID := uuid.New()
	requestedTier := "PLATINUM" // This tier doesn't exist in DB

	// Create service
	service := &entity.Service{
		ID:                 serviceID,
		Code:               "TEST-002",
		Name:               "Test Service",
		PricingModel:       "unit",
		BasePrice:          20000,
		EstDurationHours:   24,
		IsExpressAvailable: true,
		IsActive:           true,
	}
	require.NoError(t, db.Create(service).Error)

	// Create default service price (member_tier = NULL)
	now := time.Now()
	servicePrice := &entity.ServicePrice{
		ID:             uuid.New(),
		ServiceID:      serviceID,
		OutletID:       outletID,
		MemberTier:     nil, // Default tier
		Price:          18000,
		EffectiveStart: now.Add(-24 * time.Hour),
		EffectiveEnd:   nil,
		IsExpress:      false,
	}
	require.NoError(t, db.Create(servicePrice).Error)

	// Test: Should fallback to default tier
	result, err := repo.FindServicePrice(ctx, serviceID, outletID, &requestedTier, now, false)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 18000.0, result.Price)
	assert.Nil(t, result.MemberTier)
}

func TestFindServicePrice_ExpressFallback(t *testing.T) {
	db := setupTestDB(t)
	repo := NewPricingRepository(db)
	ctx := context.Background()

	// Setup test data
	serviceID := uuid.New()
	outletID := uuid.New()
	memberTier := "GOLD"

	// Create service
	service := &entity.Service{
		ID:                 serviceID,
		Code:               "TEST-003",
		Name:               "Test Service",
		PricingModel:       "unit",
		BasePrice:          20000,
		EstDurationHours:   24,
		IsExpressAvailable: true,
		IsActive:           true,
	}
	require.NoError(t, db.Create(service).Error)

	// Create service price with is_express = false ONLY
	now := time.Now()
	servicePrice := &entity.ServicePrice{
		ID:             uuid.New(),
		ServiceID:      serviceID,
		OutletID:       outletID,
		MemberTier:     &memberTier,
		Price:          17000,
		EffectiveStart: now.Add(-24 * time.Hour),
		EffectiveEnd:   nil,
		IsExpress:      false, // Only non-express available
	}
	require.NoError(t, db.Create(servicePrice).Error)

	// Test: Request with is_express = true should fallback to is_express = false
	result, err := repo.FindServicePrice(ctx, serviceID, outletID, &memberTier, now, true)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 17000.0, result.Price)
	assert.Equal(t, false, result.IsExpress) // Should get non-express price
}

func TestFindServicePrice_NoExpressFallback_WhenNonExpressRequested(t *testing.T) {
	db := setupTestDB(t)
	repo := NewPricingRepository(db)
	ctx := context.Background()

	// Setup test data
	serviceID := uuid.New()
	outletID := uuid.New()
	memberTier := "GOLD"

	// Create service
	service := &entity.Service{
		ID:                 serviceID,
		Code:               "TEST-004",
		Name:               "Test Service",
		PricingModel:       "unit",
		BasePrice:          20000,
		EstDurationHours:   24,
		IsExpressAvailable: true,
		IsActive:           true,
	}
	require.NoError(t, db.Create(service).Error)

	// Create service price with is_express = true ONLY
	now := time.Now()
	servicePrice := &entity.ServicePrice{
		ID:             uuid.New(),
		ServiceID:      serviceID,
		OutletID:       outletID,
		MemberTier:     &memberTier,
		Price:          25000,
		EffectiveStart: now.Add(-24 * time.Hour),
		EffectiveEnd:   nil,
		IsExpress:      true, // Only express available
	}
	require.NoError(t, db.Create(servicePrice).Error)

	// Test: Request with is_express = false should NOT get express price
	result, err := repo.FindServicePrice(ctx, serviceID, outletID, &memberTier, now, false)
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Equal(t, gorm.ErrRecordNotFound, err)
}

func TestFindServicePrice_DateRange(t *testing.T) {
	db := setupTestDB(t)
	repo := NewPricingRepository(db)
	ctx := context.Background()

	// Setup test data
	serviceID := uuid.New()
	outletID := uuid.New()
	memberTier := "GOLD"

	// Create service
	service := &entity.Service{
		ID:                 serviceID,
		Code:               "TEST-005",
		Name:               "Test Service",
		PricingModel:       "unit",
		BasePrice:          20000,
		EstDurationHours:   24,
		IsExpressAvailable: true,
		IsActive:           true,
	}
	require.NoError(t, db.Create(service).Error)

	// Create service price valid from yesterday to tomorrow
	yesterday := time.Now().Add(-24 * time.Hour)
	tomorrow := time.Now().Add(24 * time.Hour)
	servicePrice := &entity.ServicePrice{
		ID:             uuid.New(),
		ServiceID:      serviceID,
		OutletID:       outletID,
		MemberTier:     &memberTier,
		Price:          17000,
		EffectiveStart: yesterday,
		EffectiveEnd:   &tomorrow,
		IsExpress:      false,
	}
	require.NoError(t, db.Create(servicePrice).Error)

	// Test: Should find price when querying with today's date
	now := time.Now()
	result, err := repo.FindServicePrice(ctx, serviceID, outletID, &memberTier, now, false)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 17000.0, result.Price)

	// Test: Should NOT find price when querying with date in the past
	twoDaysAgo := time.Now().Add(-48 * time.Hour)
	result, err = repo.FindServicePrice(ctx, serviceID, outletID, &memberTier, twoDaysAgo, false)
	require.Error(t, err)
	assert.Nil(t, result)

	// Test: Should NOT find price when querying with date in the future
	threeDaysLater := time.Now().Add(72 * time.Hour)
	result, err = repo.FindServicePrice(ctx, serviceID, outletID, &memberTier, threeDaysLater, false)
	require.Error(t, err)
	assert.Nil(t, result)
}

func TestFindServicePrice_MultiplePrices_PickLatest(t *testing.T) {
	db := setupTestDB(t)
	repo := NewPricingRepository(db)
	ctx := context.Background()

	// Setup test data
	serviceID := uuid.New()
	outletID := uuid.New()
	memberTier := "GOLD"

	// Create service
	service := &entity.Service{
		ID:                 serviceID,
		Code:               "TEST-006",
		Name:               "Test Service",
		PricingModel:       "unit",
		BasePrice:          20000,
		EstDurationHours:   24,
		IsExpressAvailable: true,
		IsActive:           true,
	}
	require.NoError(t, db.Create(service).Error)

	// Create old price (started 1 month ago)
	oneMonthAgo := time.Now().Add(-30 * 24 * time.Hour)
	oldPrice := &entity.ServicePrice{
		ID:             uuid.New(),
		ServiceID:      serviceID,
		OutletID:       outletID,
		MemberTier:     &memberTier,
		Price:          15000,
		EffectiveStart: oneMonthAgo,
		EffectiveEnd:   nil,
		IsExpress:      false,
	}
	require.NoError(t, db.Create(oldPrice).Error)

	// Create new price (started 1 week ago)
	oneWeekAgo := time.Now().Add(-7 * 24 * time.Hour)
	newPrice := &entity.ServicePrice{
		ID:             uuid.New(),
		ServiceID:      serviceID,
		OutletID:       outletID,
		MemberTier:     &memberTier,
		Price:          17000,
		EffectiveStart: oneWeekAgo,
		EffectiveEnd:   nil,
		IsExpress:      false,
	}
	require.NoError(t, db.Create(newPrice).Error)

	// Test: Should pick the latest price (17000, not 15000)
	now := time.Now()
	result, err := repo.FindServicePrice(ctx, serviceID, outletID, &memberTier, now, false)
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 17000.0, result.Price)
	assert.Equal(t, newPrice.ID, result.ID)
}
