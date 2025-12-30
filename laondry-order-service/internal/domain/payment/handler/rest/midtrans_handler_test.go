package rest

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"laondry-order-service/internal/domain/payment/repository"
	"laondry-order-service/internal/domain/payment/service"
	"laondry-order-service/internal/entity"
	"laondry-order-service/pkg/validator"
)

// MockMidtransService is a mock implementation of MidtransService
type MockMidtransService struct {
	mock.Mock
}

func (m *MockMidtransService) CreateSnapToken(ctx context.Context, req service.CreateSnapTokenRequest) (*service.CreateSnapTokenResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*service.CreateSnapTokenResponse), args.Error(1)
}

func (m *MockMidtransService) CheckTransactionStatus(ctx context.Context, paymentOrderID string) (*service.TransactionStatusResponse, error) {
	args := m.Called(ctx, paymentOrderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*service.TransactionStatusResponse), args.Error(1)
}

func (m *MockMidtransService) GetTransactionByOrderID(ctx context.Context, orderID uuid.UUID) (*entity.PaymentTransaction, error) {
	args := m.Called(ctx, orderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.PaymentTransaction), args.Error(1)
}

func (m *MockMidtransService) GetTransactionByPaymentOrderID(ctx context.Context, paymentOrderID string) (*entity.PaymentTransaction, error) {
	args := m.Called(ctx, paymentOrderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*entity.PaymentTransaction), args.Error(1)
}

func (m *MockMidtransService) ProcessWebhookNotification(ctx context.Context, payload map[string]interface{}) (*service.WebhookResponse, error) {
	args := m.Called(ctx, payload)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*service.WebhookResponse), args.Error(1)
}

func (m *MockMidtransService) VerifySignature(orderID, statusCode, grossAmount, signature string) bool {
	args := m.Called(orderID, statusCode, grossAmount, signature)
	return args.Bool(0)
}

func (m *MockMidtransService) GetPaymentHistory(ctx context.Context, orderID uuid.UUID) ([]entity.PaymentTransaction, error) {
	args := m.Called(ctx, orderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]entity.PaymentTransaction), args.Error(1)
}

func (m *MockMidtransService) GetTransactionHistory(ctx context.Context, filters repository.TransactionFilters) ([]entity.PaymentTransaction, int64, error) {
	args := m.Called(ctx, filters)
	if args.Get(0) == nil {
		return nil, args.Get(1).(int64), args.Error(2)
	}
	return args.Get(0).([]entity.PaymentTransaction), args.Get(1).(int64), args.Error(2)
}

// Test fixtures
func createTestHandler() (*MidtransHandler, *MockMidtransService) {
    mockSvc := &MockMidtransService{}
    v := validator.NewValidator()
    handler := NewMidtransHandler(mockSvc, v, nil)
    return handler, mockSvc
}

// TestCreateSnapToken tests the CreateSnapToken handler
func TestCreateSnapToken(t *testing.T) {
	handler, mockSvc := createTestHandler()

	t.Run("Success", func(t *testing.T) {
		orderID := uuid.New()
		reqBody := service.CreateSnapTokenRequest{
			OrderID:         orderID,
			PaymentOrderID:  "ORDER-TEST-PAY-1",
			GrossAmount:     150000,
			Items: []service.Item{
				{
					ID:    "ITEM-1",
					Name:  "Laundry Service",
					Price: 150000,
					Qty:   1,
				},
			},
			EnabledPayments: []string{"gopay", "bank_transfer"},
			ExpiryMinutes:   60,
		}

		expectedResp := &service.CreateSnapTokenResponse{
			PaymentTransactionID: uuid.New(),
			Token:                "test-snap-token",
			RedirectURL:          "https://app.sandbox.midtrans.com/snap/test",
			ClientKey:            "test-client-key",
		}

		mockSvc.On("CreateSnapToken", mock.Anything, mock.AnythingOfType("service.CreateSnapTokenRequest")).
			Return(expectedResp, nil).Once()

		body, _ := json.Marshal(reqBody)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/payments/midtrans/token", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.CreateSnapToken(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.True(t, response["success"].(bool))
		mockSvc.AssertExpectations(t)
	})

	t.Run("Invalid request body", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/payments/midtrans/token", bytes.NewBufferString("invalid json"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.CreateSnapToken(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// TestNotification tests the webhook notification handler
func TestNotification(t *testing.T) {
	handler, mockSvc := createTestHandler()

	t.Run("Success", func(t *testing.T) {
		payload := map[string]interface{}{
			"order_id":           "ORDER-TEST-PAY-1",
			"status_code":        "200",
			"gross_amount":       "150000.00",
			"transaction_status": "settlement",
		}

		expectedResp := &service.WebhookResponse{
			PaymentTransactionID: uuid.New(),
			OrderID:              uuid.New(),
			Status:               "SUCCESS",
			Message:              "Payment notification processed successfully",
		}

		mockSvc.On("ProcessWebhookNotification", mock.Anything, payload).
			Return(expectedResp, nil).Once()

		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(http.MethodPost, "/api/v1/payments/midtrans/notification", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Notification(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.True(t, response["success"].(bool))
		mockSvc.AssertExpectations(t)
	})

	t.Run("Invalid JSON payload", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/payments/midtrans/notification", bytes.NewBufferString("invalid"))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()

		handler.Notification(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// TestCheckStatus tests the check status handler
func TestCheckStatus(t *testing.T) {
	handler, mockSvc := createTestHandler()

	t.Run("Success", func(t *testing.T) {
		paymentOrderID := "ORDER-TEST-PAY-1"

		expectedResp := &service.TransactionStatusResponse{
			PaymentTransactionID: uuid.New(),
			OrderID:              uuid.New(),
			PaymentOrderID:       paymentOrderID,
			Status:               "SUCCESS",
			GrossAmount:          150000,
		}

		mockSvc.On("CheckTransactionStatus", mock.Anything, paymentOrderID).
			Return(expectedResp, nil).Once()

		req := httptest.NewRequest(http.MethodGet, "/api/v1/payments/midtrans/status/"+paymentOrderID, nil)
		w := httptest.NewRecorder()

		// Add chi URL params
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("paymentOrderId", paymentOrderID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.CheckStatus(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.True(t, response["success"].(bool))
		mockSvc.AssertExpectations(t)
	})

	t.Run("Missing paymentOrderId", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/payments/midtrans/status/", nil)
		w := httptest.NewRecorder()

		// Add empty chi URL params
		rctx := chi.NewRouteContext()
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.CheckStatus(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// TestGetByOrderID tests getting transaction by order ID
func TestGetByOrderID(t *testing.T) {
	handler, mockSvc := createTestHandler()

	t.Run("Success", func(t *testing.T) {
		orderID := uuid.New()
		token := "test-token"

		expectedTx := &entity.PaymentTransaction{
			ID:              uuid.New(),
			OrderID:         orderID,
			PaymentOrderID:  "ORDER-TEST-PAY-1",
			GrossAmount:     150000,
			Status:          "SUCCESS",
			SnapToken:       &token,
			SnapRedirectURL: &token,
		}

		mockSvc.On("GetTransactionByOrderID", mock.Anything, orderID).
			Return(expectedTx, nil).Once()

		req := httptest.NewRequest(http.MethodGet, "/api/v1/payments/midtrans/order/"+orderID.String(), nil)
		w := httptest.NewRecorder()

		// Add chi URL params
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("orderId", orderID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.GetByOrderID(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockSvc.AssertExpectations(t)
	})

	t.Run("Invalid UUID", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/payments/midtrans/order/invalid-uuid", nil)
		w := httptest.NewRecorder()

		// Add chi URL params
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("orderId", "invalid-uuid")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.GetByOrderID(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

// TestGetPaymentHistory tests getting payment history
func TestGetPaymentHistory(t *testing.T) {
	handler, mockSvc := createTestHandler()

	t.Run("Success", func(t *testing.T) {
		orderID := uuid.New()

		expectedTxs := []entity.PaymentTransaction{
			{
				ID:             uuid.New(),
				OrderID:        orderID,
				PaymentOrderID: "ORDER-TEST-PAY-1",
				Status:         "SUCCESS",
			},
			{
				ID:             uuid.New(),
				OrderID:        orderID,
				PaymentOrderID: "ORDER-TEST-PAY-2",
				Status:         "EXPIRED",
			},
		}

		mockSvc.On("GetPaymentHistory", mock.Anything, orderID).
			Return(expectedTxs, nil).Once()

		req := httptest.NewRequest(http.MethodGet, "/api/v1/payments/midtrans/history/order/"+orderID.String(), nil)
		w := httptest.NewRecorder()

		// Add chi URL params
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("orderId", orderID.String())
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		handler.GetPaymentHistory(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.True(t, response["success"].(bool))

		data := response["data"].(map[string]interface{})
		assert.Equal(t, float64(2), data["total"])
		mockSvc.AssertExpectations(t)
	})
}

// TestGetTransactionHistory tests getting transaction history with filters
func TestGetTransactionHistory(t *testing.T) {
	handler, mockSvc := createTestHandler()

	t.Run("Success with filters", func(t *testing.T) {
		expectedTxs := []entity.PaymentTransaction{
			{
				ID:             uuid.New(),
				PaymentOrderID: "ORDER-TEST-PAY-1",
				Status:         "SUCCESS",
			},
		}

		mockSvc.On("GetTransactionHistory", mock.Anything, mock.AnythingOfType("repository.TransactionFilters")).
			Return(expectedTxs, int64(1), nil).Once()

		req := httptest.NewRequest(http.MethodGet, "/api/v1/payments/midtrans/history?status=SUCCESS&page=1&limit=10", nil)
		w := httptest.NewRecorder()

		handler.GetTransactionHistory(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var response map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &response)
		assert.True(t, response["success"].(bool))

		data := response["data"].(map[string]interface{})
		pagination := data["pagination"].(map[string]interface{})
		assert.Equal(t, float64(1), pagination["total"])
		mockSvc.AssertExpectations(t)
	})
}
