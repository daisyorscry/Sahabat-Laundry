package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"

	"laondry-order-service/internal/config"
	"laondry-order-service/internal/domain/payment/repository"
	"laondry-order-service/internal/entity"
	"laondry-order-service/internal/lock"
)

// Test fixtures
func createTestConfig() *config.Config {
	return &config.Config{
		Midtrans: config.MidtransConfig{
			ServerKey:    "test-server-key",
			ClientKey:    "test-client-key",
			IsProduction: false,
		},
	}
}

func createTestPaymentTransaction() *entity.PaymentTransaction {
	orderID := uuid.New()
	txID := uuid.New()
	token := "test-snap-token"
	redirectURL := "https://app.sandbox.midtrans.com/snap/v2/vtweb/test-token"

	return &entity.PaymentTransaction{
		ID:              txID,
		OrderID:         orderID,
		PaymentOrderID:  "ORDER-TEST-PAY-1",
		GrossAmount:     150000,
		Status:          "PENDING",
		SnapToken:       &token,
		SnapRedirectURL: &redirectURL,
	}
}

// TestVerifySignature tests signature verification
func TestVerifySignature(t *testing.T) {
	cfg := createTestConfig()
	mockRepo := repository.NewMockPaymentRepository()
	mockLocker := lock.NewMemoryLocker()
	svc := NewMidtransService(cfg, mockRepo, nil, mockLocker)

	tests := []struct {
		name          string
		orderID       string
		statusCode    string
		grossAmount   string
		signature     string
		expectedValid bool
	}{
		{
			name:          "Invalid signature",
			orderID:       "ORDER-123",
			statusCode:    "200",
			grossAmount:   "150000.00",
			signature:     "invalid-signature",
			expectedValid: false,
		},
		{
			name:          "Empty signature",
			orderID:       "ORDER-123",
			statusCode:    "200",
			grossAmount:   "150000.00",
			signature:     "",
			expectedValid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := svc.VerifySignature(tt.orderID, tt.statusCode, tt.grossAmount, tt.signature)
			assert.Equal(t, tt.expectedValid, result)
		})
	}
}

// TestGetTransactionByOrderID tests getting transaction by order ID
func TestGetTransactionByOrderID(t *testing.T) {
	cfg := createTestConfig()
	mockRepo := repository.NewMockPaymentRepository()
	mockLocker := lock.NewMemoryLocker()
	svc := NewMidtransService(cfg, mockRepo, nil, mockLocker)

	ctx := context.Background()
	orderID := uuid.New()
	expectedTx := createTestPaymentTransaction()
	expectedTx.OrderID = orderID

	t.Run("Success - Transaction found", func(t *testing.T) {
		mockRepo.On("FindTransactionByOrderID", ctx, orderID).
			Return(expectedTx, nil).Once()

		result, err := svc.GetTransactionByOrderID(ctx, orderID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, orderID, result.OrderID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Error - Transaction not found", func(t *testing.T) {
		notFoundOrderID := uuid.New()
		mockRepo.On("FindTransactionByOrderID", ctx, notFoundOrderID).
			Return(nil, gorm.ErrRecordNotFound).Once()

		result, err := svc.GetTransactionByOrderID(ctx, notFoundOrderID)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

// TestGetTransactionByPaymentOrderID tests getting transaction by payment order ID
func TestGetTransactionByPaymentOrderID(t *testing.T) {
	cfg := createTestConfig()
	mockRepo := repository.NewMockPaymentRepository()
	mockLocker := lock.NewMemoryLocker()
	svc := NewMidtransService(cfg, mockRepo, nil, mockLocker)

	ctx := context.Background()
	paymentOrderID := "ORDER-TEST-PAY-1"
	expectedTx := createTestPaymentTransaction()

	t.Run("Success - Transaction found", func(t *testing.T) {
		mockRepo.On("FindTransactionByPaymentOrderID", ctx, paymentOrderID).
			Return(expectedTx, nil).Once()

		result, err := svc.GetTransactionByPaymentOrderID(ctx, paymentOrderID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, paymentOrderID, result.PaymentOrderID)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Error - Transaction not found", func(t *testing.T) {
		notFoundID := "ORDER-NOTFOUND-PAY-1"
		mockRepo.On("FindTransactionByPaymentOrderID", ctx, notFoundID).
			Return(nil, gorm.ErrRecordNotFound).Once()

		result, err := svc.GetTransactionByPaymentOrderID(ctx, notFoundID)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

// TestGetPaymentHistory tests getting payment history for an order
func TestGetPaymentHistory(t *testing.T) {
	cfg := createTestConfig()
	mockRepo := repository.NewMockPaymentRepository()
	mockLocker := lock.NewMemoryLocker()
	svc := NewMidtransService(cfg, mockRepo, nil, mockLocker)

	ctx := context.Background()
	orderID := uuid.New()

	t.Run("Success - Multiple transactions", func(t *testing.T) {
		expectedTxs := []entity.PaymentTransaction{
			*createTestPaymentTransaction(),
			*createTestPaymentTransaction(),
		}
		expectedTxs[0].OrderID = orderID
		expectedTxs[1].OrderID = orderID
		expectedTxs[1].Status = "EXPIRED"

		mockRepo.On("ListTransactionsByOrderID", ctx, orderID).
			Return(expectedTxs, nil).Once()

		result, err := svc.GetPaymentHistory(ctx, orderID)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Len(t, result, 2)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Success - Empty history", func(t *testing.T) {
		emptyOrderID := uuid.New()
		mockRepo.On("ListTransactionsByOrderID", ctx, emptyOrderID).
			Return([]entity.PaymentTransaction{}, nil).Once()

		result, err := svc.GetPaymentHistory(ctx, emptyOrderID)

		assert.NoError(t, err)
		assert.Empty(t, result)
		mockRepo.AssertExpectations(t)
	})
}

// TestGetTransactionHistory tests getting transaction history with filters
func TestGetTransactionHistory(t *testing.T) {
	cfg := createTestConfig()
	mockRepo := repository.NewMockPaymentRepository()
	mockLocker := lock.NewMemoryLocker()
	svc := NewMidtransService(cfg, mockRepo, nil, mockLocker)

	ctx := context.Background()

	t.Run("Success - With filters", func(t *testing.T) {
		status := "SUCCESS"
		filters := repository.TransactionFilters{
			Status:    &status,
			Page:      1,
			Limit:     20,
			SortBy:    "created_at",
			SortOrder: "DESC",
		}

		expectedTxs := []entity.PaymentTransaction{
			*createTestPaymentTransaction(),
		}
		expectedTxs[0].Status = "SUCCESS"
		var total int64 = 1

		mockRepo.On("ListTransactions", ctx, filters).
			Return(expectedTxs, total, nil).Once()

		result, resultTotal, err := svc.GetTransactionHistory(ctx, filters)

		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Len(t, result, 1)
		assert.Equal(t, total, resultTotal)
		mockRepo.AssertExpectations(t)
	})

	t.Run("Error - Repository error", func(t *testing.T) {
		filters := repository.TransactionFilters{
			Page:  1,
			Limit: 20,
		}

		mockRepo.On("ListTransactions", ctx, filters).
			Return(nil, int64(0), errors.New("database error")).Once()

		result, total, err := svc.GetTransactionHistory(ctx, filters)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Equal(t, int64(0), total)
		mockRepo.AssertExpectations(t)
	})
}

// TestMapMidtransStatus tests status mapping
func TestMapMidtransStatus(t *testing.T) {
	tests := []struct {
		name              string
		transactionStatus string
		fraudStatus       string
		expected          string
	}{
		{
			name:              "Settlement - Success",
			transactionStatus: "settlement",
			fraudStatus:       "",
			expected:          "SUCCESS",
		},
		{
			name:              "Capture with accept - Success",
			transactionStatus: "capture",
			fraudStatus:       "accept",
			expected:          "SUCCESS",
		},
		{
			name:              "Capture without accept - Pending",
			transactionStatus: "capture",
			fraudStatus:       "",
			expected:          "PENDING",
		},
		{
			name:              "Pending",
			transactionStatus: "pending",
			fraudStatus:       "",
			expected:          "PENDING",
		},
		{
			name:              "Deny - Canceled",
			transactionStatus: "deny",
			fraudStatus:       "",
			expected:          "CANCELED",
		},
		{
			name:              "Cancel - Canceled",
			transactionStatus: "cancel",
			fraudStatus:       "",
			expected:          "CANCELED",
		},
		{
			name:              "Expire - Expired",
			transactionStatus: "expire",
			fraudStatus:       "",
			expected:          "EXPIRED",
		},
		{
			name:              "Failure - Failed",
			transactionStatus: "failure",
			fraudStatus:       "",
			expected:          "FAILED",
		},
		{
			name:              "Unknown - Pending",
			transactionStatus: "unknown",
			fraudStatus:       "",
			expected:          "PENDING",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := mapMidtransStatus(tt.transactionStatus, tt.fraudStatus)
			assert.Equal(t, tt.expected, result)
		})
	}
}

// TestProcessWebhookNotification tests webhook processing
func TestProcessWebhookNotification(t *testing.T) {
	cfg := createTestConfig()
	mockRepo := repository.NewMockPaymentRepository()
	mockLocker := lock.NewMemoryLocker()
	svc := NewMidtransService(cfg, mockRepo, nil, mockLocker)

	ctx := context.Background()

	t.Run("Error - Invalid signature", func(t *testing.T) {
		payload := map[string]interface{}{
			"order_id":           "ORDER-TEST-PAY-1",
			"status_code":        "200",
			"gross_amount":       "150000.00",
			"signature_key":      "invalid-signature",
			"transaction_status": "settlement",
		}

		mockRepo.On("FindTransactionByPaymentOrderID", ctx, "ORDER-TEST-PAY-1").
			Return(createTestPaymentTransaction(), nil).Maybe()
		mockRepo.On("CreateWebhookLog", ctx, mock.AnythingOfType("*entity.PaymentWebhookLog")).
			Return(nil).Maybe()

		result, err := svc.ProcessWebhookNotification(ctx, payload)

		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "signature")
	})

	t.Run("Error - Transaction not found", func(t *testing.T) {
		payload := map[string]interface{}{
			"order_id":           "ORDER-NOTFOUND-PAY-1",
			"status_code":        "200",
			"gross_amount":       "150000.00",
			"signature_key":      "",
			"transaction_status": "settlement",
		}

		mockRepo.On("FindTransactionByPaymentOrderID", ctx, "ORDER-NOTFOUND-PAY-1").
			Return(nil, gorm.ErrRecordNotFound).Once()
		mockRepo.On("CreateWebhookLog", ctx, mock.AnythingOfType("*entity.PaymentWebhookLog")).
			Return(nil).Maybe()

		result, err := svc.ProcessWebhookNotification(ctx, payload)

		assert.Error(t, err)
		assert.Nil(t, result)
		mockRepo.AssertExpectations(t)
	})
}

// TestParseTime tests time parsing helper
func TestParseTime(t *testing.T) {
	tests := []struct {
		name      string
		timeStr   string
		shouldErr bool
	}{
		{
			name:      "Valid Midtrans format",
			timeStr:   "2025-01-05 14:30:00",
			shouldErr: false,
		},
		{
			name:      "Valid RFC3339 format",
			timeStr:   "2025-01-05T14:30:00Z",
			shouldErr: false,
		},
		{
			name:      "Valid RFC3339 with timezone",
			timeStr:   "2025-01-05T14:30:00+07:00",
			shouldErr: false,
		},
		{
			name:      "Invalid format",
			timeStr:   "invalid-time",
			shouldErr: true,
		},
		{
			name:      "Empty string",
			timeStr:   "",
			shouldErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := parseTime(tt.timeStr)
			if tt.shouldErr {
				assert.Error(t, err)
				assert.True(t, result.IsZero())
			} else {
				assert.NoError(t, err)
				assert.False(t, result.IsZero())
			}
		})
	}
}

// TestHelperFunctions tests utility helper functions
func TestHelperFunctions(t *testing.T) {
	t.Run("strPtr", func(t *testing.T) {
		str := "test"
		result := strPtr(str)
		assert.NotNil(t, result)
		assert.Equal(t, str, *result)
	})

	t.Run("strPtrNonEmpty - with value", func(t *testing.T) {
		str := "test"
		result := strPtrNonEmpty(str)
		assert.NotNil(t, result)
		assert.Equal(t, str, *result)
	})

	t.Run("strPtrNonEmpty - empty string", func(t *testing.T) {
		str := ""
		result := strPtrNonEmpty(str)
		assert.Nil(t, result)
	})

	t.Run("strPtrToString - with value", func(t *testing.T) {
		str := "test"
		result := strPtrToString(&str)
		assert.Equal(t, str, result)
	})

	t.Run("strPtrToString - nil", func(t *testing.T) {
		result := strPtrToString(nil)
		assert.Equal(t, "", result)
	})
}

// TestGetStringFromMap tests map string extraction
func TestGetStringFromMap(t *testing.T) {
	testMap := map[string]interface{}{
		"string_key": "string_value",
		"int_key":    123,
		"nil_key":    nil,
	}

	t.Run("Existing string key", func(t *testing.T) {
		result := getStringFromMap(testMap, "string_key")
		assert.Equal(t, "string_value", result)
	})

	t.Run("Non-string value", func(t *testing.T) {
		result := getStringFromMap(testMap, "int_key")
		assert.Equal(t, "", result)
	})

	t.Run("Nil value", func(t *testing.T) {
		result := getStringFromMap(testMap, "nil_key")
		assert.Equal(t, "", result)
	})

	t.Run("Non-existing key", func(t *testing.T) {
		result := getStringFromMap(testMap, "nonexistent")
		assert.Equal(t, "", result)
	})
}

// TestMapToJSONB tests JSONB mapping
func TestMapToJSONB(t *testing.T) {
	t.Run("Nil data", func(t *testing.T) {
		result := mapToJSONB(nil)
		assert.Nil(t, result)
	})

	t.Run("Map data", func(t *testing.T) {
		data := map[string]interface{}{
			"key1": "value1",
			"key2": 123,
		}
		result := mapToJSONB(data)
		assert.NotNil(t, result)
		assert.Equal(t, "value1", result["key1"])
		assert.Equal(t, 123, result["key2"])
	})

	t.Run("Other type data", func(t *testing.T) {
		data := "string data"
		result := mapToJSONB(data)
		assert.NotNil(t, result)
		assert.Equal(t, data, result["data"])
	})
}

// Benchmark tests
func BenchmarkVerifySignature(b *testing.B) {
	cfg := createTestConfig()
	mockRepo := repository.NewMockPaymentRepository()
	mockLocker := lock.NewMemoryLocker()
	svc := NewMidtransService(cfg, mockRepo, nil, mockLocker)

	orderID := "ORDER-BENCH-123"
	statusCode := "200"
	grossAmount := "150000.00"
	signature := "test-signature"

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		svc.VerifySignature(orderID, statusCode, grossAmount, signature)
	}
}

func BenchmarkMapMidtransStatus(b *testing.B) {
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		mapMidtransStatus("settlement", "accept")
	}
}
