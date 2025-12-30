package rest

import (
    "encoding/json"
    "fmt"
    "net/http"
    "strconv"
    "time"

    "github.com/go-chi/chi/v5"
    "github.com/google/uuid"
    "gorm.io/gorm"

    "laondry-order-service/internal/domain/payment/repository"
    "laondry-order-service/internal/domain/payment/service"
    "laondry-order-service/internal/entity"
    "laondry-order-service/pkg/response"
    "laondry-order-service/pkg/validator"
)

type MidtransHandler struct {
    svc       service.MidtransService
    validator *validator.Validator
    db        *gorm.DB
}

func NewMidtransHandler(svc service.MidtransService, v *validator.Validator, db *gorm.DB) *MidtransHandler {
    return &MidtransHandler{svc: svc, validator: v, db: db}
}

// POST /api/v1/payments/midtrans/token
// Creates a Snap payment token for the given order
func (h *MidtransHandler) CreateSnapToken(w http.ResponseWriter, r *http.Request) {
    // Accept order_id as UUID or order_no (string), and auto-generate payment_order_id if missing
    type createSnapTokenInput struct {
        OrderID         string            `json:"order_id" validate:"required"`
        PaymentOrderID  string            `json:"payment_order_id"`
        GrossAmount     float64           `json:"gross_amount" validate:"required,gt=0"`
        Items           []service.Item    `json:"items" validate:"required,min=1"`
        CustomerDetail  *service.Customer `json:"customer_detail"`
        EnabledPayments []string          `json:"enabled_payments"`
        ExpiryMinutes   int               `json:"expiry_minutes"`
    }

    var in createSnapTokenInput
    if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
        response.BadRequest(w, "invalid request body", err.Error())
        return
    }

    if h.validator != nil {
        if errs := h.validator.Validate(in); errs != nil && len(errs) > 0 {
            response.BadRequest(w, "validation failed", errs)
            return
        }
    }

    // Resolve order ID: try UUID first, otherwise treat as order_no and look up
    var orderUUID uuid.UUID
    var resolvedOrderNo *string
    if id, err := uuid.Parse(in.OrderID); err == nil {
        orderUUID = id
    } else {
        if h.db == nil {
            response.BadRequest(w, "invalid order_id", "order_id must be UUID or provide order_no when backend has DB access")
            return
        }
        var ord entity.Order
        if err := h.db.Where("order_no = ?", in.OrderID).First(&ord).Error; err != nil {
            response.BadRequest(w, "invalid order_id", fmt.Sprintf("order not found for order_no '%s'", in.OrderID))
            return
        }
        orderUUID = ord.ID
        resolvedOrderNo = &ord.OrderNo
    }

    paymentOrderID := in.PaymentOrderID
    if paymentOrderID == "" {
        if resolvedOrderNo != nil {
            paymentOrderID = *resolvedOrderNo
        } else {
            // Fallback: generate from provided order identifier
            paymentOrderID = fmt.Sprintf("%s-PAY-%d", in.OrderID, time.Now().Unix())
        }
    }

    req := service.CreateSnapTokenRequest{
        OrderID:         orderUUID,
        PaymentOrderID:  paymentOrderID,
        GrossAmount:     in.GrossAmount,
        Items:           in.Items,
        CustomerDetail:  in.CustomerDetail,
        EnabledPayments: in.EnabledPayments,
        ExpiryMinutes:   in.ExpiryMinutes,
    }

    // Set defaults
    if req.EnabledPayments == nil {
        req.EnabledPayments = []string{}
    }
    if req.ExpiryMinutes == 0 {
        req.ExpiryMinutes = 60 // Default 1 hour
    }

    res, err := h.svc.CreateSnapToken(r.Context(), req)
    if err != nil {
        response.Error(w, err)
        return
    }

    response.Success(w, "snap token generated", res)
}

// POST /api/v1/payments/midtrans/notification
// Webhook endpoint for Midtrans payment notifications
// This endpoint should be publicly accessible (no auth)
func (h *MidtransHandler) Notification(w http.ResponseWriter, r *http.Request) {
	var payload map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		response.BadRequest(w, "invalid payload", err.Error())
		return
	}

	res, err := h.svc.ProcessWebhookNotification(r.Context(), payload)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "notification processed", res)
}

// GET /api/v1/payments/midtrans/status/{paymentOrderId}
// Checks payment transaction status from Midtrans API and returns updated status
func (h *MidtransHandler) CheckStatus(w http.ResponseWriter, r *http.Request) {
	paymentOrderID := chi.URLParam(r, "paymentOrderId")
	if paymentOrderID == "" {
		response.BadRequest(w, "paymentOrderId is required", nil)
		return
	}

	res, err := h.svc.CheckTransactionStatus(r.Context(), paymentOrderID)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "transaction status retrieved", res)
}

// GET /api/v1/payments/midtrans/order/{orderId}
// Gets the latest payment transaction for an order
func (h *MidtransHandler) GetByOrderID(w http.ResponseWriter, r *http.Request) {
	orderIDStr := chi.URLParam(r, "orderId")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		response.BadRequest(w, "invalid order_id", err.Error())
		return
	}

	tx, err := h.svc.GetTransactionByOrderID(r.Context(), orderID)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "payment transaction retrieved", tx)
}

// GET /api/v1/payments/midtrans/payment/{paymentOrderId}
// Gets payment transaction by payment order ID
func (h *MidtransHandler) GetByPaymentOrderID(w http.ResponseWriter, r *http.Request) {
	paymentOrderID := chi.URLParam(r, "paymentOrderId")
	if paymentOrderID == "" {
		response.BadRequest(w, "paymentOrderId is required", nil)
		return
	}

	tx, err := h.svc.GetTransactionByPaymentOrderID(r.Context(), paymentOrderID)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "payment transaction retrieved", tx)
}

// GET /api/v1/payments/midtrans/history/order/{orderId}
// Gets all payment transactions (history) for an order
func (h *MidtransHandler) GetPaymentHistory(w http.ResponseWriter, r *http.Request) {
	orderIDStr := chi.URLParam(r, "orderId")
	orderID, err := uuid.Parse(orderIDStr)
	if err != nil {
		response.BadRequest(w, "invalid order_id", err.Error())
		return
	}

	transactions, err := h.svc.GetPaymentHistory(r.Context(), orderID)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "payment history retrieved", map[string]interface{}{
		"order_id":     orderID,
		"transactions": transactions,
		"total":        len(transactions),
	})
}

// GET /api/v1/payments/midtrans/history
// Gets payment transaction history with filters
func (h *MidtransHandler) GetTransactionHistory(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	filters := repository.TransactionFilters{
		Page:      1,
		Limit:     20,
		SortBy:    "created_at",
		SortOrder: "DESC",
	}

	// Parse filters from query params
	if orderIDStr := query.Get("order_id"); orderIDStr != "" {
		orderID, err := uuid.Parse(orderIDStr)
		if err == nil {
			filters.OrderID = &orderID
		}
	}

	if status := query.Get("status"); status != "" {
		filters.Status = &status
	}

	if paymentMethod := query.Get("payment_method"); paymentMethod != "" {
		filters.PaymentMethod = &paymentMethod
	}

	if paymentType := query.Get("payment_type"); paymentType != "" {
		filters.PaymentType = &paymentType
	}

	if startDate := query.Get("start_date"); startDate != "" {
		filters.StartDate = &startDate
	}

	if endDate := query.Get("end_date"); endDate != "" {
		filters.EndDate = &endDate
	}

	if page := query.Get("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			filters.Page = p
		}
	}

	if limit := query.Get("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			filters.Limit = l
		}
	}

	if sortBy := query.Get("sort_by"); sortBy != "" {
		filters.SortBy = sortBy
	}

	if sortOrder := query.Get("sort_order"); sortOrder != "" {
		filters.SortOrder = sortOrder
	}

	transactions, total, err := h.svc.GetTransactionHistory(r.Context(), filters)
	if err != nil {
		response.Error(w, err)
		return
	}

	// Calculate pagination metadata
	totalPages := (total + int64(filters.Limit) - 1) / int64(filters.Limit)

	response.Success(w, "transaction history retrieved", map[string]interface{}{
		"transactions": transactions,
		"pagination": map[string]interface{}{
			"page":        filters.Page,
			"limit":       filters.Limit,
			"total":       total,
			"total_pages": totalPages,
		},
	})
}

// Deprecated: Use CheckStatus instead
// GET /api/v1/payments/midtrans/status/{orderId}
func (h *MidtransHandler) Status(w http.ResponseWriter, r *http.Request) {
	orderIDStr := chi.URLParam(r, "orderId")

	// Try as UUID first (for backward compatibility)
	if orderID, err := uuid.Parse(orderIDStr); err == nil {
		tx, err := h.svc.GetTransactionByOrderID(r.Context(), orderID)
		if err != nil {
			response.Error(w, err)
			return
		}
		response.Success(w, "payment transaction retrieved", tx)
		return
	}

	// Otherwise treat as payment_order_id
	tx, err := h.svc.GetTransactionByPaymentOrderID(r.Context(), orderIDStr)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "payment transaction retrieved", tx)
}
