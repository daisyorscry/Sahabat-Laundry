package service

import (
	"context"
	"testing"
	"time"

	"laondry-order-service/internal/domain/order/repository"
	"laondry-order-service/internal/entity"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// Mock PricingRepository
type MockPricingRepository struct {
	mock.Mock
}

func (m *MockPricingRepository) FindServiceByID(ctx context.Context, id uuid.UUID) (*entity.Service, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Service), args.Error(1)
}

func (m *MockPricingRepository) FindAddonByID(ctx context.Context, id uuid.UUID) (*entity.Addon, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.Addon), args.Error(1)
}

func (m *MockPricingRepository) FindServicePrice(ctx context.Context, serviceID, outletID uuid.UUID, memberTier *string, date time.Time, isExpress bool) (*entity.ServicePrice, error) {
	args := m.Called(ctx, serviceID, outletID, memberTier, date, isExpress)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.ServicePrice), args.Error(1)
}

func (m *MockPricingRepository) WithDB(db *gorm.DB) repository.PricingRepository {
	return m
}

func TestQuoteService_CalculateQuote_Success(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	svc := NewQuoteService(mockRepo, nil)

	ctx := context.Background()
	serviceID := uuid.New()
	addonID := uuid.New()
	outletID := uuid.New()

	// Mock service
	mockService := &entity.Service{
		ID:           serviceID,
		Code:         "CUCI_KERING",
		Name:         "Cuci Kering",
		PricingModel: "PER_KG",
		BasePrice:    10000,
	}

	// Mock addon
	mockAddon := &entity.Addon{
		ID:    addonID,
		Code:  "PEWANGI",
		Name:  "Pewangi Extra",
		Price: 5000,
	}

	// Mock service price
	mockServicePrice := &entity.ServicePrice{
		Price: 12000, // Custom price for outlet
	}

	// Setup expectations
	mockRepo.On("FindServiceByID", ctx, serviceID).Return(mockService, nil)
	mockRepo.On("FindServicePrice", ctx, serviceID, outletID, mock.Anything, mock.Anything, false).Return(mockServicePrice, nil)
	mockRepo.On("FindAddonByID", ctx, addonID).Return(mockAddon, nil)

	// Prepare request
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

	// Execute
	result, err := svc.CalculateQuote(ctx, req)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 1, len(result.Items))

	// Check calculations
	expectedBaseTotal := 12000.0 * 5.0                // 60000
	expectedAddonsTotal := 5000.0 * 2.0               // 10000
	expectedLineTotal := expectedBaseTotal + expectedAddonsTotal // 70000

	assert.Equal(t, expectedBaseTotal, result.Items[0].BaseTotal)
	assert.Equal(t, expectedAddonsTotal, result.Items[0].AddonsTotal)
	assert.Equal(t, expectedLineTotal, result.Items[0].LineTotal)
	assert.Equal(t, expectedLineTotal, result.Subtotal)
	assert.Equal(t, expectedLineTotal, result.GrandTotal)

	mockRepo.AssertExpectations(t)
}

func TestQuoteService_CalculateQuote_ServiceNotFound(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	svc := NewQuoteService(mockRepo, nil)

	ctx := context.Background()
	serviceID := uuid.New()
	outletID := uuid.New()

	// Setup expectations - service not found
	mockRepo.On("FindServiceByID", ctx, serviceID).Return(nil, gorm.ErrRecordNotFound)

	// Prepare request
	weight := 5.0
	req := QuoteRequest{
		OutletID: outletID,
		Items: []QuoteItem{
			{
				ServiceID: serviceID.String(),
				WeightKg:  &weight,
			},
		},
	}

	// Execute
	result, err := svc.CalculateQuote(ctx, req)

	// Assert - should not error but add warning
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 0, len(result.Items)) // No items processed
	assert.Greater(t, len(result.Meta.Warnings), 0) // Has warnings

	mockRepo.AssertExpectations(t)
}

func TestQuoteService_CalculateQuote_InvalidServiceID(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	svc := NewQuoteService(mockRepo, nil)

	ctx := context.Background()
	outletID := uuid.New()

	// Prepare request with invalid service ID
	weight := 5.0
	req := QuoteRequest{
		OutletID: outletID,
		Items: []QuoteItem{
			{
				ServiceID: "invalid-uuid",
				WeightKg:  &weight,
			},
		},
	}

	// Execute
	result, err := svc.CalculateQuote(ctx, req)

	// Assert - should not error but add warning
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 0, len(result.Items))
	assert.Greater(t, len(result.Meta.Warnings), 0)
}

func TestQuoteService_CalculateQuote_MissingWeightForKgPricing(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	svc := NewQuoteService(mockRepo, nil)

	ctx := context.Background()
	serviceID := uuid.New()
	outletID := uuid.New()

	mockService := &entity.Service{
		ID:           serviceID,
		Code:         "CUCI_KERING",
		Name:         "Cuci Kering",
		PricingModel: "PER_KG",
		BasePrice:    10000,
	}

	mockRepo.On("FindServiceByID", ctx, serviceID).Return(mockService, nil)
	mockRepo.On("FindServicePrice", ctx, serviceID, outletID, mock.Anything, mock.Anything, false).Return(nil, gorm.ErrRecordNotFound)

	// Prepare request without weight
	req := QuoteRequest{
		OutletID: outletID,
		Items: []QuoteItem{
			{
				ServiceID: serviceID.String(),
				// WeightKg missing
			},
		},
	}

	// Execute
	result, err := svc.CalculateQuote(ctx, req)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 0, len(result.Items))
	assert.Greater(t, len(result.Meta.Warnings), 0)

	mockRepo.AssertExpectations(t)
}

func TestQuoteService_CalculateQuote_MultipleItems(t *testing.T) {
	mockRepo := new(MockPricingRepository)
	svc := NewQuoteService(mockRepo, nil)

	ctx := context.Background()
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

	mockService2 := &entity.Service{
		ID:           serviceID2,
		Code:         "SETRIKA",
		Name:         "Setrika",
		PricingModel: "PER_ITEM",
		BasePrice:    3000,
	}

	mockRepo.On("FindServiceByID", ctx, serviceID1).Return(mockService1, nil)
	mockRepo.On("FindServiceByID", ctx, serviceID2).Return(mockService2, nil)
	mockRepo.On("FindServicePrice", ctx, serviceID1, outletID, mock.Anything, mock.Anything, false).Return(nil, gorm.ErrRecordNotFound)
	mockRepo.On("FindServicePrice", ctx, serviceID2, outletID, mock.Anything, mock.Anything, false).Return(nil, gorm.ErrRecordNotFound)

	weight := 3.0
	qty := 10
	req := QuoteRequest{
		OutletID: outletID,
		Items: []QuoteItem{
			{
				ServiceID: serviceID1.String(),
				WeightKg:  &weight,
			},
			{
				ServiceID: serviceID2.String(),
				Qty:       &qty,
			},
		},
	}

	// Execute
	result, err := svc.CalculateQuote(ctx, req)

	// Assert
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 2, len(result.Items))

	// Check totals
	expectedTotal := (10000.0 * 3.0) + (3000.0 * 10.0) // 30000 + 30000 = 60000
	assert.Equal(t, expectedTotal, result.Subtotal)
	assert.Equal(t, expectedTotal, result.GrandTotal)

	mockRepo.AssertExpectations(t)
}
