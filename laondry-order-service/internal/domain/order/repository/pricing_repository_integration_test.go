package repository

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"laondry-order-service/internal/entity"
)

// This test connects to REAL database to debug pricing issues
func TestPricingRepository_RealDatabase(t *testing.T) {
	// Connect to real database
	dsn := "host=localhost port=5422 user=root password=root dbname=laondry_system_management sslmode=disable TimeZone=Asia/Jakarta"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	require.NoError(t, err)

	repo := NewPricingRepository(db)
	ctx := context.Background()

	// Get all services
	var services []entity.Service
	err = db.WithContext(ctx).
		Where("is_active = ?", true).
		Find(&services).Error
	require.NoError(t, err)

	fmt.Printf("\n=== Found %d active services ===\n", len(services))
	for _, svc := range services {
		fmt.Printf("Service: %s (%s) - Base Price: %.2f\n", svc.Name, svc.Code, svc.BasePrice)
	}

	// Get all outlets
	var outlets []entity.Outlet
	err = db.WithContext(ctx).
		Where("is_active = ?", true).
		Find(&outlets).Error
	require.NoError(t, err)

	fmt.Printf("\n=== Found %d active outlets ===\n", len(outlets))
	for _, outlet := range outlets {
		fmt.Printf("Outlet: %s - ID: %s\n", outlet.Name, outlet.ID)
	}

	// Get all service prices
	var servicePrices []entity.ServicePrice
	err = db.WithContext(ctx).
		Order("created_at DESC").
		Find(&servicePrices).Error
	require.NoError(t, err)

	fmt.Printf("\n=== Found %d service prices ===\n", len(servicePrices))
	for _, sp := range servicePrices {
		memberTier := "NULL"
		if sp.MemberTier != nil {
			memberTier = *sp.MemberTier
		}
		endDate := "NULL"
		if sp.EffectiveEnd != nil {
			endDate = sp.EffectiveEnd.Format("2006-01-02")
		}
		fmt.Printf("ServicePrice: service_id=%s outlet_id=%s member_tier=%s price=%.2f is_express=%v start=%s end=%s\n",
			sp.ServiceID.String()[:8],
			sp.OutletID.String()[:8],
			memberTier,
			sp.Price,
			sp.IsExpress,
			sp.EffectiveStart.Format("2006-01-02"),
			endDate,
		)
	}

	// If we have data, test the pricing lookup
	if len(services) > 0 && len(outlets) > 0 {
		testService := services[0]
		testOutlet := outlets[0]

		fmt.Printf("\n=== Testing Price Lookup ===\n")
		fmt.Printf("Service: %s (%s)\n", testService.Name, testService.ID)
		fmt.Printf("Outlet: %s (%s)\n", testOutlet.Name, testOutlet.ID)
		fmt.Printf("Base Price: %.2f\n", testService.BasePrice)

		// Test 1: Lookup with member_tier = NULL, is_express = false
		fmt.Printf("\n--- Test 1: member_tier=NULL, is_express=false ---\n")
		price, err := repo.FindServicePrice(ctx, testService.ID, testOutlet.ID, nil, time.Now(), false)
		if err != nil {
			fmt.Printf("ERROR: %v\n", err)
		} else {
			fmt.Printf("Found price: %.2f (is_express=%v)\n", price.Price, price.IsExpress)
		}

		// Test 2: Lookup with member_tier = NULL, is_express = true
		fmt.Printf("\n--- Test 2: member_tier=NULL, is_express=true ---\n")
		price, err = repo.FindServicePrice(ctx, testService.ID, testOutlet.ID, nil, time.Now(), true)
		if err != nil {
			fmt.Printf("ERROR: %v\n", err)
		} else {
			fmt.Printf("Found price: %.2f (is_express=%v)\n", price.Price, price.IsExpress)
		}

		// Test 3: Lookup with member_tier = GOLD, is_express = false
		goldTier := "GOLD"
		fmt.Printf("\n--- Test 3: member_tier=GOLD, is_express=false ---\n")
		price, err = repo.FindServicePrice(ctx, testService.ID, testOutlet.ID, &goldTier, time.Now(), false)
		if err != nil {
			fmt.Printf("ERROR: %v\n", err)
		} else {
			memberTierStr := "NULL"
			if price.MemberTier != nil {
				memberTierStr = *price.MemberTier
			}
			fmt.Printf("Found price: %.2f (member_tier=%s, is_express=%v)\n", price.Price, memberTierStr, price.IsExpress)
		}

		// Test 4: Lookup with member_tier = GOLD, is_express = true
		fmt.Printf("\n--- Test 4: member_tier=GOLD, is_express=true ---\n")
		price, err = repo.FindServicePrice(ctx, testService.ID, testOutlet.ID, &goldTier, time.Now(), true)
		if err != nil {
			fmt.Printf("ERROR: %v\n", err)
		} else {
			memberTierStr := "NULL"
			if price.MemberTier != nil {
				memberTierStr = *price.MemberTier
			}
			fmt.Printf("Found price: %.2f (member_tier=%s, is_express=%v)\n", price.Price, memberTierStr, price.IsExpress)
		}
	}
}

// Test to find the specific service that has 17000 vs 20000 price issue
func TestPricingRepository_FindDiscountedService(t *testing.T) {
	// Connect to real database
	dsn := "host=localhost port=5422 user=root password=root dbname=laondry_system_management sslmode=disable TimeZone=Asia/Jakarta"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	require.NoError(t, err)

	ctx := context.Background()

	// Find service with base_price = 20000
	var services []entity.Service
	err = db.WithContext(ctx).
		Where("base_price = ? AND is_active = ?", 20000, true).
		Find(&services).Error
	require.NoError(t, err)

	fmt.Printf("\n=== Services with base_price = 20000 ===\n")
	for _, svc := range services {
		fmt.Printf("ID: %s\n", svc.ID)
		fmt.Printf("Code: %s\n", svc.Code)
		fmt.Printf("Name: %s\n", svc.Name)
		fmt.Printf("Base Price: %.2f\n", svc.BasePrice)
		fmt.Printf("Is Express Available: %v\n", svc.IsExpressAvailable)

		// Find all prices for this service
		var prices []entity.ServicePrice
		err = db.WithContext(ctx).
			Where("service_id = ?", svc.ID).
			Find(&prices).Error
		if err == nil && len(prices) > 0 {
			fmt.Printf("Service Prices:\n")
			for _, p := range prices {
				memberTier := "NULL"
				if p.MemberTier != nil {
					memberTier = *p.MemberTier
				}
				fmt.Printf("  - Price: %.2f, Member Tier: %s, Is Express: %v, Outlet: %s\n",
					p.Price,
					memberTier,
					p.IsExpress,
					p.OutletID.String()[:8],
				)
			}
		}
		fmt.Println("---")
	}

	// Find service prices with price = 17000
	var discountPrices []entity.ServicePrice
	err = db.WithContext(ctx).
		Where("price = ?", 17000).
		Find(&discountPrices).Error
	require.NoError(t, err)

	fmt.Printf("\n=== Service Prices with price = 17000 ===\n")
	for _, p := range discountPrices {
		memberTier := "NULL"
		if p.MemberTier != nil {
			memberTier = *p.MemberTier
		}

		// Get service info
		var svc entity.Service
		err = db.WithContext(ctx).Where("id = ?", p.ServiceID).First(&svc).Error
		if err == nil {
			fmt.Printf("Service: %s (%s)\n", svc.Name, svc.Code)
			fmt.Printf("Service ID: %s\n", p.ServiceID)
			fmt.Printf("Outlet ID: %s\n", p.OutletID)
			fmt.Printf("Member Tier: %s\n", memberTier)
			fmt.Printf("Price: %.2f\n", p.Price)
			fmt.Printf("Is Express: %v\n", p.IsExpress)
			fmt.Printf("Effective: %s to %v\n", p.EffectiveStart.Format("2006-01-02"), p.EffectiveEnd)
			fmt.Println("---")
		}
	}
}

// Test to simulate the exact flow from mobile
func TestPricingRepository_SimulateMobileFlow(t *testing.T) {
	// Connect to real database
	dsn := "host=localhost port=5422 user=root password=root dbname=laondry_system_management sslmode=disable TimeZone=Asia/Jakarta"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	require.NoError(t, err)

	repo := NewPricingRepository(db)
	ctx := context.Background()

	// Get the first service and outlet (simulate what mobile does)
	var service entity.Service
	err = db.WithContext(ctx).
		Where("is_active = ?", true).
		Order("created_at ASC").
		First(&service).Error
	require.NoError(t, err)

	var outlet entity.Outlet
	err = db.WithContext(ctx).
		Where("is_active = ?", true).
		Order("created_at ASC").
		First(&outlet).Error
	require.NoError(t, err)

	fmt.Printf("\n=== Simulating Mobile Order Flow ===\n")
	fmt.Printf("Service: %s (ID: %s)\n", service.Name, service.ID)
	fmt.Printf("Service Base Price: %.2f\n", service.BasePrice)
	fmt.Printf("Outlet: %s (ID: %s)\n", outlet.Name, outlet.ID)

	// Simulate different scenarios
	scenarios := []struct {
		name       string
		memberTier *string
		isExpress  bool
	}{
		{"No member tier, no express", nil, false},
		{"No member tier, with express", nil, true},
		{"GOLD tier, no express", stringPtr("GOLD"), false},
		{"GOLD tier, with express", stringPtr("GOLD"), true},
		{"SILVER tier, no express", stringPtr("SILVER"), false},
		{"BRONZE tier, no express", stringPtr("BRONZE"), false},
	}

	for _, scenario := range scenarios {
		fmt.Printf("\n--- %s ---\n", scenario.name)

		price, err := repo.FindServicePrice(ctx, service.ID, outlet.ID, scenario.memberTier, time.Now(), scenario.isExpress)

		if err != nil {
			fmt.Printf("❌ Price NOT found, will use base_price: %.2f\n", service.BasePrice)
			fmt.Printf("   Error: %v\n", err)
		} else {
			tierStr := "NULL"
			if price.MemberTier != nil {
				tierStr = *price.MemberTier
			}

			discountPct := 0.0
			if service.BasePrice > 0 {
				discountPct = ((service.BasePrice - price.Price) / service.BasePrice) * 100
			}

			fmt.Printf("✅ Price found: %.2f (member_tier=%s, is_express=%v)\n", price.Price, tierStr, price.IsExpress)
			if discountPct > 0 {
				fmt.Printf("   💰 Discount: %.0f%% (Save: %.2f)\n", discountPct, service.BasePrice-price.Price)
			}
		}
	}
}
