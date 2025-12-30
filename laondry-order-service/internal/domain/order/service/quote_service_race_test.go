package service

import (
	"context"
	"sync"
	"testing"

	"laondry-order-service/internal/entity"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

func TestQuoteService_CalculateQuote_Concurrent(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	svc := NewQuoteService(mockRepo, nil)

	serviceID := uuid.New()
	addonID := uuid.New()
	outletID := uuid.New()

	mockService := &entity.Service{
		ID:           serviceID,
		Code:         "CUCI_KERING",
		Name:         "Cuci Kering",
		PricingModel: "PER_KG",
		BasePrice:    10000,
	}

	mockAddon := &entity.Addon{
		ID:    addonID,
		Code:  "PEWANGI",
		Name:  "Pewangi Extra",
		Price: 5000,
	}

	mockServicePrice := &entity.ServicePrice{
		Price: 12000,
	}

	// Setup expectations - will be called multiple times concurrently
	mockRepo.On("FindServiceByID", mock.Anything, serviceID).Return(mockService, nil)
	mockRepo.On("FindServicePrice", mock.Anything, serviceID, outletID, mock.Anything, mock.Anything, false).Return(mockServicePrice, nil)
	mockRepo.On("FindAddonByID", mock.Anything, addonID).Return(mockAddon, nil)

	// Number of concurrent goroutines
	concurrency := 50
	var wg sync.WaitGroup
	wg.Add(concurrency)

	errors := make(chan error, concurrency)
	results := make(chan *QuoteResult, concurrency)

	// Run concurrent quote calculations
	for i := 0; i < concurrency; i++ {
		go func(idx int) {
			defer wg.Done()

			ctx := context.Background()
			weight := 5.0
			addonQty := 2

			req := QuoteRequest{
				OutletID: outletID,
				Items: []QuoteItem{
					{
						ServiceID: serviceID.String(),
						WeightKg:  &weight,
						IsExpress: false,
						Addons: []QuoteItemAddon{
							{
								AddonID: addonID.String(),
								Qty:     addonQty,
							},
						},
					},
				},
			}

			result, err := svc.CalculateQuote(ctx, req)
			if err != nil {
				errors <- err
				return
			}
			results <- result
		}(i)
	}

	// Wait for all goroutines to complete
	wg.Wait()
	close(errors)
	close(results)

	// Check for errors
	for err := range errors {
		assert.Fail(t, "Unexpected error in concurrent execution", err.Error())
	}

	// Verify all results are consistent
	expectedBaseTotal := 12000.0 * 5.0
	expectedAddonsTotal := 5000.0 * 2.0
	expectedLineTotal := expectedBaseTotal + expectedAddonsTotal

	successCount := 0
	for result := range results {
		assert.NotNil(t, result)
		assert.Equal(t, 1, len(result.Items))
		assert.Equal(t, expectedBaseTotal, result.Items[0].BaseTotal)
		assert.Equal(t, expectedAddonsTotal, result.Items[0].AddonsTotal)
		assert.Equal(t, expectedLineTotal, result.Items[0].LineTotal)
		assert.Equal(t, expectedLineTotal, result.Subtotal)
		successCount++
	}

	assert.Equal(t, concurrency, successCount, "All concurrent requests should succeed")
}

func TestQuoteService_CalculateQuote_ConcurrentWithErrors(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	svc := NewQuoteService(mockRepo, nil)

	serviceID1 := uuid.New()
	serviceID2 := uuid.New()
	outletID := uuid.New()

	mockService1 := &entity.Service{
		ID:           serviceID1,
		Code:         "CUCI_KERING",
		Name:         "Cuci Kering",
		PricingModel: "PER_KG",
		BasePrice:    10000,
	}

	// Service 1 exists, Service 2 does not
	mockRepo.On("FindServiceByID", mock.Anything, serviceID1).Return(mockService1, nil)
	mockRepo.On("FindServiceByID", mock.Anything, serviceID2).Return(nil, gorm.ErrRecordNotFound)
	mockRepo.On("FindServicePrice", mock.Anything, serviceID1, outletID, mock.Anything, mock.Anything, false).Return(nil, gorm.ErrRecordNotFound)

	concurrency := 30
	var wg sync.WaitGroup
	wg.Add(concurrency)

	results := make(chan *QuoteResult, concurrency)

	// Half requests for existing service, half for non-existing
	for i := 0; i < concurrency; i++ {
		go func(idx int) {
			defer wg.Done()

			ctx := context.Background()
			weight := 3.0

			var serviceID uuid.UUID
			if idx%2 == 0 {
				serviceID = serviceID1 // Exists
			} else {
				serviceID = serviceID2 // Does not exist
			}

			req := QuoteRequest{
				OutletID: outletID,
				Items: []QuoteItem{
					{
						ServiceID: serviceID.String(),
						WeightKg:  &weight,
					},
				},
			}

			result, err := svc.CalculateQuote(ctx, req)
			// Should not error even if service not found (adds warning instead)
			if err == nil {
				results <- result
			}
		}(i)
	}

	wg.Wait()
	close(results)

	successCount := 0
	warningCount := 0
	for result := range results {
		assert.NotNil(t, result)
		if len(result.Meta.Warnings) > 0 {
			warningCount++
		} else {
			successCount++
		}
	}

	// Should have mix of successful and warning results
	assert.Greater(t, successCount, 0, "Should have some successful results")
	assert.Greater(t, warningCount, 0, "Should have some warning results")
}

func TestQuoteService_CalculateQuote_RaceConditionSafety(t *testing.T) {
	// This test is specifically designed to catch race conditions
	// Run with: go test -race ./internal/domain/order/service/...

	mockRepo := new(MockPricingRepository)
	svc := NewQuoteService(mockRepo, nil)

	serviceID := uuid.New()
	outletID := uuid.New()

	mockService := &entity.Service{
		ID:           serviceID,
		Code:         "TEST_SERVICE",
		Name:         "Test Service",
		PricingModel: "PER_KG",
		BasePrice:    10000,
	}

	mockRepo.On("FindServiceByID", mock.Anything, serviceID).Return(mockService, nil)
	mockRepo.On("FindServicePrice", mock.Anything, serviceID, outletID, mock.Anything, mock.Anything, mock.Anything).Return(nil, gorm.ErrRecordNotFound)

	concurrency := 100
	iterations := 10

	for iter := 0; iter < iterations; iter++ {
		var wg sync.WaitGroup
		wg.Add(concurrency)

		for i := 0; i < concurrency; i++ {
			go func() {
				defer wg.Done()

				ctx := context.Background()
				weight := 2.5
				req := QuoteRequest{
					OutletID: outletID,
					Items: []QuoteItem{
						{
							ServiceID: serviceID.String(),
							WeightKg:  &weight,
						},
					},
				}

				_, err := svc.CalculateQuote(ctx, req)
				assert.NoError(t, err)
			}()
		}

		wg.Wait()
	}
}
