package service

import (
    "context"
    "testing"

    "laondry-order-service/internal/entity"

    "github.com/google/uuid"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "gorm.io/gorm"
)

func TestQuoteService_CalculateQuote_PricingModel_Weight_String(t *testing.T) {
    mockRepo := new(MockPricingRepository)
    svc := NewQuoteService(mockRepo, nil)

    ctx := context.Background()
    serviceID := uuid.New()
    outletID := uuid.New()

    // Service uses new schema value "weight"
    mockService := &entity.Service{ID: serviceID, Code: "CUCI", Name: "Cuci", PricingModel: "weight", BasePrice: 10000}
    mockRepo.On("FindServiceByID", ctx, serviceID).Return(mockService, nil)
    mockRepo.On("FindServicePrice", ctx, serviceID, outletID, mock.Anything, mock.Anything, false).Return(nil, gorm.ErrRecordNotFound)

    w := 2.5
    req := QuoteRequest{OutletID: outletID, Items: []QuoteItem{{ServiceID: serviceID.String(), WeightKg: &w}}}
    res, err := svc.CalculateQuote(ctx, req)
    assert.NoError(t, err)
    assert.NotNil(t, res)
    assert.Equal(t, 1, len(res.Items))
    assert.InDelta(t, 25000.0, res.Items[0].BaseTotal, 0.0001)
}

func TestQuoteService_CalculateQuote_PricingModel_Piece_String(t *testing.T) {
    mockRepo := new(MockPricingRepository)
    svc := NewQuoteService(mockRepo, nil)

    ctx := context.Background()
    serviceID := uuid.New()
    outletID := uuid.New()

    // Service uses new schema value "piece"
    mockService := &entity.Service{ID: serviceID, Code: "SETRIKA", Name: "Setrika", PricingModel: "piece", BasePrice: 3000}
    mockRepo.On("FindServiceByID", ctx, serviceID).Return(mockService, nil)
    mockRepo.On("FindServicePrice", ctx, serviceID, outletID, mock.Anything, mock.Anything, false).Return(nil, gorm.ErrRecordNotFound)

    q := 3
    req := QuoteRequest{OutletID: outletID, Items: []QuoteItem{{ServiceID: serviceID.String(), Qty: &q}}}
    res, err := svc.CalculateQuote(ctx, req)
    assert.NoError(t, err)
    assert.NotNil(t, res)
    assert.Equal(t, 1, len(res.Items))
    assert.InDelta(t, 9000.0, res.Items[0].BaseTotal, 0.0001)
}

func TestQuoteService_CalculateQuote_UsesMemberTier_And_Express(t *testing.T) {
    mockRepo := new(MockPricingRepository)
    svc := NewQuoteService(mockRepo, nil)

    ctx := context.Background()
    serviceID := uuid.New()
    outletID := uuid.New()

    mockService := &entity.Service{ID: serviceID, Code: "CUCI_EXP", Name: "Cuci Express", PricingModel: "piece", BasePrice: 5000}
    mockRepo.On("FindServiceByID", ctx, serviceID).Return(mockService, nil)

    gold := "GOLD"
    // Expect memberTier pointer equals GOLD and isExpress true
    matchedTier := mock.MatchedBy(func(p *string) bool { return p != nil && *p == gold })
    matchedDate := mock.Anything // date is resolved inside service
    mockRepo.On("FindServicePrice", ctx, serviceID, outletID, matchedTier, matchedDate, true).Return(&entity.ServicePrice{Price: 15000}, nil)

    qty := 2
    req := QuoteRequest{OutletID: outletID, MemberTier: &gold, Items: []QuoteItem{{ServiceID: serviceID.String(), Qty: &qty, IsExpress: true}}}
    res, err := svc.CalculateQuote(ctx, req)
    assert.NoError(t, err)
    assert.NotNil(t, res)
    assert.Equal(t, 1, len(res.Items))
    assert.InDelta(t, 15000.0, res.Items[0].UnitPrice, 0.0001)
    assert.InDelta(t, 30000.0, res.Items[0].BaseTotal, 0.0001)
}
