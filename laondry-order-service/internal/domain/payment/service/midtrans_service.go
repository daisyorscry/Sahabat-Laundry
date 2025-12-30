package service

import (
	"bytes"
	"context"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"reflect"
	"strings"
	"time"

	"laondry-order-service/internal/config"
	"laondry-order-service/internal/domain/payment/repository"
	"laondry-order-service/internal/entity"
	"laondry-order-service/internal/lock"
	appErrors "laondry-order-service/pkg/errors"

	"github.com/google/uuid"
	midtrans "github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/coreapi"
	"github.com/midtrans/midtrans-go/snap"
	"github.com/newrelic/go-agent/v3/newrelic"
	"gorm.io/gorm"
)

type MidtransService interface {
	// Snap Token
	CreateSnapToken(ctx context.Context, req CreateSnapTokenRequest) (*CreateSnapTokenResponse, error)

	// Transaction Status
	CheckTransactionStatus(ctx context.Context, paymentOrderID string) (*TransactionStatusResponse, error)
	GetTransactionByOrderID(ctx context.Context, orderID uuid.UUID) (*entity.PaymentTransaction, error)
	GetTransactionByPaymentOrderID(ctx context.Context, paymentOrderID string) (*entity.PaymentTransaction, error)

	// Webhook
	ProcessWebhookNotification(ctx context.Context, payload map[string]interface{}) (*WebhookResponse, error)
	VerifySignature(orderID, statusCode, grossAmount, signature string) bool

	// History
	GetPaymentHistory(ctx context.Context, orderID uuid.UUID) ([]entity.PaymentTransaction, error)
	GetTransactionHistory(ctx context.Context, filters repository.TransactionFilters) ([]entity.PaymentTransaction, int64, error)
}

type midtransService struct {
	cfg    *config.Config
	repo   repository.PaymentRepository
	db     *gorm.DB
	locker lock.Locker
}

func NewMidtransService(cfg *config.Config, repo repository.PaymentRepository, db *gorm.DB, locker lock.Locker) MidtransService {
	return &midtransService{
		cfg:    cfg,
		repo:   repo,
		db:     db,
		locker: locker,
	}
}

// withTx executes the given function within a database transaction
func (s *midtransService) withTx(ctx context.Context, fn func(r repository.PaymentRepository) error) error {
	if s.db == nil {
		return fn(s.repo)
	}
	return s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		txRepo := s.repo.WithDB(tx)
		return fn(txRepo)
	})
}

// withLock executes the given function with a distributed lock
func (s *midtransService) withLock(ctx context.Context, key string, ttl time.Duration, fn func() error) error {
	if s.locker == nil {
		log.Printf("[Payment] No locker configured, executing without lock")
		return fn()
	}
	unlock, ok, err := s.locker.TryLock(ctx, key, ttl)
	if err != nil {
		log.Printf("[Payment] Failed to acquire lock %s: %v", key, err)
		return appErrors.InternalServerError("Failed to acquire lock", err)
	}
	if !ok {
		log.Printf("[Payment] Lock %s is busy", key)
		return appErrors.BadRequest("Resource busy, please try again", nil)
	}
	defer func() {
		if err := unlock(); err != nil {
			log.Printf("[Payment] Failed to release lock %s: %v", key, err)
		}
	}()
	return fn()
}

type Item struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Qty   int32   `json:"qty"`
}

type Customer struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
}

type CreateSnapTokenRequest struct {
	OrderID         uuid.UUID `json:"order_id" validate:"required"`
	PaymentOrderID  string    `json:"payment_order_id" validate:"required"` // Unique payment identifier (e.g., ORDER-123-PAY-1)
	GrossAmount     float64   `json:"gross_amount" validate:"required,gt=0"`
	Items           []Item    `json:"items" validate:"required,min=1"`
	CustomerDetail  *Customer `json:"customer_detail"`
	EnabledPayments []string  `json:"enabled_payments"`
	ExpiryMinutes   int       `json:"expiry_minutes"`
}

type CreateSnapTokenResponse struct {
	PaymentTransactionID uuid.UUID  `json:"payment_transaction_id"`
	PaymentOrderID       string     `json:"payment_order_id"`
	Token                string     `json:"token"`
	RedirectURL          string     `json:"redirect_url"`
	ClientKey            string     `json:"client_key"`
	ExpiryTime           *time.Time `json:"expiry_time,omitempty"`
}

type TransactionStatusResponse struct {
	PaymentTransactionID uuid.UUID                 `json:"payment_transaction_id"`
	OrderID              uuid.UUID                 `json:"order_id"`
	PaymentOrderID       string                    `json:"payment_order_id"`
	Status               string                    `json:"status"`
	PaymentMethod        *string                   `json:"payment_method"`
	PaymentType          *string                   `json:"payment_type"`
	GrossAmount          float64                   `json:"gross_amount"`
	TransactionID        *string                   `json:"transaction_id"`
	TransactionTime      *time.Time                `json:"transaction_time"`
	SettlementTime       *time.Time                `json:"settlement_time"`
	ExpiryTime           *time.Time                `json:"expiry_time"`
	FraudStatus          *string                   `json:"fraud_status"`
	VANumber             *string                   `json:"va_number,omitempty"`
	BillerCode           *string                   `json:"biller_code,omitempty"`
	BillKey              *string                   `json:"bill_key,omitempty"`
	StatusLogs           []entity.PaymentStatusLog `json:"status_logs,omitempty"`
}

type WebhookResponse struct {
	PaymentTransactionID uuid.UUID `json:"payment_transaction_id"`
	OrderID              uuid.UUID `json:"order_id"`
	Status               string    `json:"status"`
	Message              string    `json:"message"`
}

func (s *midtransService) snapClient() (*snap.Client, error) {
    if s.cfg == nil || s.cfg.Midtrans.ServerKey == "" {
        return nil, errors.New("midtrans server key not configured")
    }
    // Select environment strictly from configuration.
    // Midtrans no longer prefixes sandbox keys with "SB-", so prefix-based
    // auto-detection can misroute requests. Rely on MIDTRANS_IS_PRODUCTION.
    env := midtrans.Sandbox
    if s.cfg.Midtrans.IsProduction {
        env = midtrans.Production
    }
    // Masked log to help diagnose env mismatches without leaking secrets
    sk := s.cfg.Midtrans.ServerKey
    tail := sk
    if len(sk) > 6 {
        tail = sk[len(sk)-6:]
    }
    log.Printf("[Payment] Midtrans Snap client init: env=%s key=***%s", map[bool]string{true: "production", false: "sandbox"}[s.cfg.Midtrans.IsProduction], tail)

    c := &snap.Client{}
    c.New(s.cfg.Midtrans.ServerKey, env)
    return c, nil
}

func (s *midtransService) coreAPIClient() (*coreapi.Client, error) {
    if s.cfg == nil || s.cfg.Midtrans.ServerKey == "" {
        return nil, errors.New("midtrans server key not configured")
    }
    env := midtrans.Sandbox
    if s.cfg.Midtrans.IsProduction {
        env = midtrans.Production
    }
    c := &coreapi.Client{}
    c.New(s.cfg.Midtrans.ServerKey, env)
    return c, nil
}

// CreateSnapToken creates a snap token and saves all details to database
func (s *midtransService) CreateSnapToken(ctx context.Context, req CreateSnapTokenRequest) (*CreateSnapTokenResponse, error) {
	// NewRelic instrumentation
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("payments.CreateSnapToken")
		defer seg.End()
		txn.AddAttribute("order_id", req.OrderID.String())
		txn.AddAttribute("payment_order_id", req.PaymentOrderID)
		txn.AddAttribute("gross_amount", req.GrossAmount)
	}

	log.Printf("[Payment] CreateSnapToken - order_id: %s, payment_order_id: %s, amount: %.2f",
		req.OrderID, req.PaymentOrderID, req.GrossAmount)

	c, err := s.snapClient()
	if err != nil {
		log.Printf("[Payment] Failed to create snap client: %v", err)
		return nil, appErrors.InternalServerError("Failed to initialize payment gateway", err)
	}

	if req.PaymentOrderID == "" || req.GrossAmount <= 0 {
		log.Printf("[Payment] Invalid request: payment_order_id=%s, amount=%.2f", req.PaymentOrderID, req.GrossAmount)
		return nil, appErrors.BadRequest("Invalid payment_order_id or gross_amount", nil)
	}

	// Check if payment transaction already exists
	existing, err := s.repo.FindTransactionByPaymentOrderID(ctx, req.PaymentOrderID)
	if err == nil && existing != nil {
		// Return existing token if still valid and pending
		if existing.Status == "PENDING" && existing.SnapToken != nil {
			log.Printf("[Payment] Returning existing token for payment_order_id: %s", req.PaymentOrderID)
			if txn := newrelic.FromContext(ctx); txn != nil {
				txn.AddAttribute("reused_token", true)
			}
			return &CreateSnapTokenResponse{
				PaymentTransactionID: existing.ID,
				PaymentOrderID:       existing.PaymentOrderID,
				Token:                *existing.SnapToken,
				RedirectURL:          *existing.SnapRedirectURL,
				ClientKey:            s.cfg.Midtrans.ClientKey,
				ExpiryTime:           existing.ExpiryTime,
			}, nil
		}
	}

	// Build item details
	var items []midtrans.ItemDetails
	var itemsTotal int64
	for _, it := range req.Items {
		price := int64(it.Price)
		qty := it.Qty
		items = append(items, midtrans.ItemDetails{
			ID:    it.ID,
			Name:  it.Name,
			Price: price,
			Qty:   qty,
		})
		itemsTotal += price * int64(qty)
	}

	// Normalize items total vs gross amount to avoid Midtrans 400
	if itemsTotal != int64(req.GrossAmount) {
		log.Printf("[Payment] Adjusting items to match gross_amount: gross=%d items_total=%d (%s)", int64(req.GrossAmount), itemsTotal, req.PaymentOrderID)
		diff := int64(req.GrossAmount) - itemsTotal
		if len(items) <= 1 {
			// Single item: set its price to gross amount
			if len(items) == 1 {
				items[0].Price = int64(req.GrossAmount)
				itemsTotal = int64(req.GrossAmount)
			} else {
				// Safety: create one item representing the order
				items = []midtrans.ItemDetails{{
					ID:    req.PaymentOrderID,
					Name:  fmt.Sprintf("Order %s", req.PaymentOrderID),
					Price: int64(req.GrossAmount),
					Qty:   1,
				}}
				itemsTotal = int64(req.GrossAmount)
			}
		} else {
			if diff > 0 {
				// Add adjustment line to reach gross total
				items = append(items, midtrans.ItemDetails{
					ID:    "ADJUSTMENT",
					Name:  "Adjustment",
					Price: diff,
					Qty:   1,
				})
				itemsTotal += diff
			} else {
				// Items exceed gross, collapse into single gross item
				items = []midtrans.ItemDetails{{
					ID:    req.PaymentOrderID,
					Name:  fmt.Sprintf("Order %s", req.PaymentOrderID),
					Price: int64(req.GrossAmount),
					Qty:   1,
				}}
				itemsTotal = int64(req.GrossAmount)
			}
		}
	}

	// Customer details
	var cust *midtrans.CustomerDetails
	if req.CustomerDetail != nil {
		cust = &midtrans.CustomerDetails{
			FName: req.CustomerDetail.FirstName,
			LName: req.CustomerDetail.LastName,
			Email: req.CustomerDetail.Email,
			Phone: req.CustomerDetail.Phone,
		}
	}

	// Expiry
	var expiry *snap.ExpiryDetails
	var expiryTime *time.Time
	if req.ExpiryMinutes > 0 {
		expiry = &snap.ExpiryDetails{
			Unit:     "minutes",
			Duration: int64(req.ExpiryMinutes),
		}
		exp := time.Now().Add(time.Duration(req.ExpiryMinutes) * time.Minute)
		expiryTime = &exp
	}

    // Finalize enabled payments: request filtered by configured allowlist.
    var finalPaymentList []string
    requested := req.EnabledPayments
    allow := s.cfg.Midtrans.EnabledPayments
    if len(allow) == 0 {
        // No allowlist configured; use request as-is
        finalPaymentList = requested
    } else if len(requested) == 0 {
        // No request specified; use allowlist defaults
        finalPaymentList = allow
    } else {
        // Intersect request with allowlist
        allowSet := map[string]struct{}{}
        for _, a := range allow {
            allowSet[a] = struct{}{}
        }
        for _, p := range requested {
            if _, ok := allowSet[p]; ok {
                finalPaymentList = append(finalPaymentList, p)
            } else {
                log.Printf("[Payment] Filtering unsupported payment: %s", p)
            }
        }
        // If nothing left after filtering, fall back to allowlist
        if len(finalPaymentList) == 0 {
            log.Printf("[Payment] All requested payments filtered; using allowlist defaults")
            finalPaymentList = allow
        }
    }

    var enabledPayments []snap.SnapPaymentType
    for _, p := range finalPaymentList {
        enabledPayments = append(enabledPayments, snap.SnapPaymentType(p))
    }

	snapReq := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  req.PaymentOrderID,
			GrossAmt: int64(req.GrossAmount),
		},
		Items:           &items,
		CustomerDetail:  cust,
		EnabledPayments: enabledPayments,
		Expiry:          expiry,
	}

    // Call Midtrans API
    log.Printf("[Payment] Calling Midtrans CreateTransaction API for %s", req.PaymentOrderID)
    snapResp, err := c.CreateTransaction(snapReq)
    if err != nil {
        // Some versions of midtrans-go return a typed-nil *midtrans.Error
        // even on success. Detect and treat it as no error so we can use
        // the successful response payload.
        if v := reflect.ValueOf(err); v.Kind() == reflect.Ptr && v.IsNil() {
            log.Printf("[Payment] Midtrans SDK returned typed-nil error; continuing. order_id=%s", req.PaymentOrderID)
        } else {
            log.Printf("[Payment] Midtrans API error for %s: %v", req.PaymentOrderID, err)
            if txn := newrelic.FromContext(ctx); txn != nil {
                txn.NoticeError(err)
            }
            return nil, appErrors.InternalServerError("Failed to create payment token", err)
        }
    }

	if snapResp == nil || snapResp.Token == "" {
		log.Printf("[Payment] Midtrans API returned empty response for %s (snapResp=%v)", req.PaymentOrderID, snapResp)
		return nil, appErrors.InternalServerError("Failed to create payment token", errors.New("empty response from midtrans"))
	}

	log.Printf("[Payment] Midtrans token created successfully: %s", req.PaymentOrderID)

	// Save to database with transaction and locking
	var result *CreateSnapTokenResponse
	lockKey := fmt.Sprintf("payment:create:%s", req.PaymentOrderID)

	err = s.withLock(ctx, lockKey, 10*time.Second, func() error {
		return s.withTx(ctx, func(r repository.PaymentRepository) error {
			// Save payment transaction
			paymentTx := &entity.PaymentTransaction{
				OrderID:         req.OrderID,
				PaymentOrderID:  req.PaymentOrderID,
				GrossAmount:     req.GrossAmount,
				Status:          "PENDING",
				SnapToken:       &snapResp.Token,
				SnapRedirectURL: &snapResp.RedirectURL,
				ExpiryTime:      expiryTime,
				RequestPayload:  mapToJSONB(snapReq),
				ResponsePayload: mapToJSONB(snapResp),
			}

			if err := r.CreateTransaction(ctx, paymentTx); err != nil {
				log.Printf("[Payment] Failed to save transaction to DB: %v", err)
				return appErrors.InternalServerError("Failed to save payment transaction", err)
			}

			log.Printf("[Payment] Transaction saved to DB: %s (ID: %s)", req.PaymentOrderID, paymentTx.ID)

			// Create initial status log
			statusLog := &entity.PaymentStatusLog{
				PaymentTransactionID: paymentTx.ID,
				NewStatus:            "PENDING",
				Source:               "api_create",
				StatusMessage:        strPtr("Snap token created"),
				RawData:              mapToJSONB(snapResp),
			}

			if err := r.CreateStatusLog(ctx, statusLog); err != nil {
				log.Printf("[Payment] Warning: Failed to create status log: %v", err)
				// Don't fail the whole operation if status log fails
			}

			result = &CreateSnapTokenResponse{
				PaymentTransactionID: paymentTx.ID,
				PaymentOrderID:       req.PaymentOrderID,
				Token:                snapResp.Token,
				RedirectURL:          snapResp.RedirectURL,
				ClientKey:            s.cfg.Midtrans.ClientKey,
				ExpiryTime:           expiryTime,
			}

			return nil
		})
	})

	if err != nil {
		return nil, err
	}

	if txn := newrelic.FromContext(ctx); txn != nil {
		txn.AddAttribute("payment_transaction_id", result.PaymentTransactionID.String())
		txn.AddAttribute("success", true)
	}

	log.Printf("[Payment] CreateSnapToken completed successfully for %s", req.PaymentOrderID)
	return result, nil
}

// CheckTransactionStatus checks payment status from Midtrans API and updates DB
func (s *midtransService) CheckTransactionStatus(ctx context.Context, paymentOrderID string) (*TransactionStatusResponse, error) {
	// NewRelic instrumentation
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("payments.CheckTransactionStatus")
		defer seg.End()
		txn.AddAttribute("payment_order_id", paymentOrderID)
	}

	log.Printf("[Payment] CheckTransactionStatus - payment_order_id: %s", paymentOrderID)

	// Get from database first
	paymentTx, err := s.repo.FindTransactionByPaymentOrderID(ctx, paymentOrderID)
	if err != nil {
		log.Printf("[Payment] Transaction not found in DB: %s, error: %v", paymentOrderID, err)
		return nil, appErrors.NotFound("Payment transaction not found", err)
	}

	log.Printf("[Payment] Found transaction in DB: %s, current status: %s", paymentOrderID, paymentTx.Status)

	// Query Midtrans API for latest status
	c, err := s.coreAPIClient()
	if err != nil {
		log.Printf("[Payment] Failed to create core API client: %v", err)
		return nil, appErrors.InternalServerError("Failed to initialize payment gateway", err)
	}

	log.Printf("[Payment] Querying Midtrans API for status: %s", paymentOrderID)
	statusResp, err := c.CheckTransaction(paymentOrderID)
	if err != nil {
		log.Printf("[Payment] Midtrans API error for %s: %v", paymentOrderID, err)
		if txn := newrelic.FromContext(ctx); txn != nil {
			txn.NoticeError(err)
		}
		return nil, appErrors.InternalServerError("Failed to check transaction status", err)
	}

	log.Printf("[Payment] Midtrans API response: status=%s, fraud=%s", statusResp.TransactionStatus, statusResp.FraudStatus)

	// Update payment transaction with latest data using transaction
	oldStatus := paymentTx.Status
	newStatus := mapMidtransStatus(statusResp.TransactionStatus, statusResp.FraudStatus)

	log.Printf("[Payment] Status mapping: %s -> %s (old: %s)", statusResp.TransactionStatus, newStatus, oldStatus)

	lockKey := fmt.Sprintf("payment:update:%s", paymentOrderID)
	err = s.withLock(ctx, lockKey, 10*time.Second, func() error {
		return s.withTx(ctx, func(r repository.PaymentRepository) error {
			// Update payment transaction
			paymentTx.Status = newStatus
			paymentTx.TransactionID = &statusResp.TransactionID
			paymentTx.PaymentMethod = strPtrNonEmpty(statusResp.PaymentType)
			paymentTx.PaymentType = strPtrNonEmpty(statusResp.PaymentType)
			paymentTx.FraudStatus = strPtrNonEmpty(statusResp.FraudStatus)

			if statusResp.TransactionTime != "" {
				if t, err := parseTime(statusResp.TransactionTime); err == nil {
					paymentTx.TransactionTime = &t
				}
			}
			if statusResp.SettlementTime != "" {
				if t, err := parseTime(statusResp.SettlementTime); err == nil {
					paymentTx.SettlementTime = &t
				}
			}

			// Parse VA number, biller code, bill key based on payment type
			if statusResp.VaNumbers != nil && len(statusResp.VaNumbers) > 0 {
				paymentTx.VANumber = &statusResp.VaNumbers[0].VANumber
				paymentTx.BillerCode = strPtrNonEmpty(statusResp.VaNumbers[0].Bank)
			}
			if statusResp.BillerCode != "" {
				paymentTx.BillerCode = &statusResp.BillerCode
			}
			if statusResp.BillKey != "" {
				paymentTx.BillKey = &statusResp.BillKey
			}

			// Save updated transaction
			if err := r.UpdateTransaction(ctx, paymentTx); err != nil {
				log.Printf("[Payment] Failed to update transaction: %v", err)
				return appErrors.InternalServerError("Failed to update transaction", err)
			}

			log.Printf("[Payment] Transaction updated: %s, new status: %s", paymentOrderID, paymentTx.Status)

			// Log status change if status changed
			if oldStatus != paymentTx.Status {
				log.Printf("[Payment] Status changed: %s -> %s", oldStatus, paymentTx.Status)
				statusLog := &entity.PaymentStatusLog{
					PaymentTransactionID: paymentTx.ID,
					PreviousStatus:       &oldStatus,
					NewStatus:            paymentTx.Status,
					FraudStatus:          paymentTx.FraudStatus,
					Source:               "api_check",
					StatusMessage:        strPtr(fmt.Sprintf("Status checked via API: %s", statusResp.TransactionStatus)),
					RawData:              mapToJSONB(statusResp),
				}
				if err := r.CreateStatusLog(ctx, statusLog); err != nil {
					log.Printf("[Payment] Warning: Failed to create status log: %v", err)
				}
			}

			return nil
		})
	})

	if err != nil {
		return nil, err
	}

	// Get status logs
	statusLogs, _ := s.repo.ListStatusLogs(ctx, paymentTx.ID)

	if txn := newrelic.FromContext(ctx); txn != nil {
		txn.AddAttribute("current_status", paymentTx.Status)
		txn.AddAttribute("payment_method", strPtrToString(paymentTx.PaymentMethod))
	}

	log.Printf("[Payment] CheckTransactionStatus completed for %s, status: %s", paymentOrderID, paymentTx.Status)

	return &TransactionStatusResponse{
		PaymentTransactionID: paymentTx.ID,
		OrderID:              paymentTx.OrderID,
		PaymentOrderID:       paymentTx.PaymentOrderID,
		Status:               paymentTx.Status,
		PaymentMethod:        paymentTx.PaymentMethod,
		PaymentType:          paymentTx.PaymentType,
		GrossAmount:          paymentTx.GrossAmount,
		TransactionID:        paymentTx.TransactionID,
		TransactionTime:      paymentTx.TransactionTime,
		SettlementTime:       paymentTx.SettlementTime,
		ExpiryTime:           paymentTx.ExpiryTime,
		FraudStatus:          paymentTx.FraudStatus,
		VANumber:             paymentTx.VANumber,
		BillerCode:           paymentTx.BillerCode,
		BillKey:              paymentTx.BillKey,
		StatusLogs:           statusLogs,
	}, nil
}

// ProcessWebhookNotification processes Midtrans webhook notification
func (s *midtransService) ProcessWebhookNotification(ctx context.Context, payload map[string]interface{}) (*WebhookResponse, error) {
	// NewRelic instrumentation
	if txn := newrelic.FromContext(ctx); txn != nil {
		seg := txn.StartSegment("payments.ProcessWebhookNotification")
		defer seg.End()
	}

	// Extract data from payload
	paymentOrderID := getStringFromMap(payload, "order_id")
	statusCode := getStringFromMap(payload, "status_code")
	grossAmount := getStringFromMap(payload, "gross_amount")
	signatureKey := getStringFromMap(payload, "signature_key")
	transactionStatus := getStringFromMap(payload, "transaction_status")
	fraudStatus := getStringFromMap(payload, "fraud_status")
	transactionID := getStringFromMap(payload, "transaction_id")
	paymentType := getStringFromMap(payload, "payment_type")

	log.Printf("[Payment] Webhook received: order_id=%s, status=%s, fraud=%s",
		paymentOrderID, transactionStatus, fraudStatus)

	if txn := newrelic.FromContext(ctx); txn != nil {
		txn.AddAttribute("payment_order_id", paymentOrderID)
		txn.AddAttribute("transaction_status", transactionStatus)
		txn.AddAttribute("fraud_status", fraudStatus)
	}

	// Verify signature
	signatureVerified := s.VerifySignature(paymentOrderID, statusCode, grossAmount, signatureKey)
	log.Printf("[Payment] Webhook signature verification: %v", signatureVerified)

	// Find payment transaction
	paymentTx, err := s.repo.FindTransactionByPaymentOrderID(ctx, paymentOrderID)
	var paymentTxID *uuid.UUID
	if err == nil && paymentTx != nil {
		paymentTxID = &paymentTx.ID
		log.Printf("[Payment] Found transaction for webhook: %s (ID: %s)", paymentOrderID, paymentTx.ID)
	} else {
		log.Printf("[Payment] WARNING: Transaction not found for webhook: %s", paymentOrderID)
	}

	// Always log webhook regardless of transaction found
	webhookLog := &entity.PaymentWebhookLog{
		PaymentTransactionID: paymentTxID,
		PaymentOrderID:       paymentOrderID,
		Source:               "midtrans",
		TransactionStatus:    strPtrNonEmpty(transactionStatus),
		FraudStatus:          strPtrNonEmpty(fraudStatus),
		StatusCode:           strPtrNonEmpty(statusCode),
		GrossAmount:          strPtrNonEmpty(grossAmount),
		SignatureKey:         strPtrNonEmpty(signatureKey),
		SignatureVerified:    signatureVerified,
		RawPayload:           entity.JSONB(payload),
	}

	if !signatureVerified {
		log.Printf("[Payment] ERROR: Invalid webhook signature for %s", paymentOrderID)
		webhookLog.ProcessingError = strPtr("Invalid signature")
		_ = s.repo.CreateWebhookLog(ctx, webhookLog)
		signatureErr := errors.New("invalid webhook signature")
		if txn := newrelic.FromContext(ctx); txn != nil {
			txn.NoticeError(signatureErr)
		}
		return nil, appErrors.Unauthorized("Invalid webhook signature", signatureErr)
	}

	if paymentTx == nil {
		log.Printf("[Payment] ERROR: Payment transaction not found for webhook: %s", paymentOrderID)
		webhookLog.ProcessingError = strPtr("Payment transaction not found")
		_ = s.repo.CreateWebhookLog(ctx, webhookLog)
		return nil, appErrors.NotFound(fmt.Sprintf("Payment transaction not found for order_id: %s", paymentOrderID), nil)
	}

	// Update payment transaction with locking and transaction
	oldStatus := paymentTx.Status
	newStatus := mapMidtransStatus(transactionStatus, fraudStatus)

	log.Printf("[Payment] Webhook status mapping: %s -> %s (old: %s)", transactionStatus, newStatus, oldStatus)

	var result *WebhookResponse
	lockKey := fmt.Sprintf("payment:webhook:%s", paymentOrderID)

	err = s.withLock(ctx, lockKey, 10*time.Second, func() error {
		return s.withTx(ctx, func(r repository.PaymentRepository) error {
			// Update payment transaction
			paymentTx.Status = newStatus
			paymentTx.TransactionID = strPtrNonEmpty(transactionID)
			paymentTx.PaymentMethod = strPtrNonEmpty(paymentType)
			paymentTx.PaymentType = strPtrNonEmpty(paymentType)
			paymentTx.FraudStatus = strPtrNonEmpty(fraudStatus)

			// Parse timestamps
			if transactionTime := getStringFromMap(payload, "transaction_time"); transactionTime != "" {
				if t, err := parseTime(transactionTime); err == nil {
					paymentTx.TransactionTime = &t
				}
			}
			if settlementTime := getStringFromMap(payload, "settlement_time"); settlementTime != "" {
				if t, err := parseTime(settlementTime); err == nil {
					paymentTx.SettlementTime = &t
				}
			}

			// Parse payment-specific data
			if vaNumbers, ok := payload["va_numbers"].([]interface{}); ok && len(vaNumbers) > 0 {
				if vaData, ok := vaNumbers[0].(map[string]interface{}); ok {
					if vaNumber := getStringFromMap(vaData, "va_number"); vaNumber != "" {
						paymentTx.VANumber = &vaNumber
					}
					if bank := getStringFromMap(vaData, "bank"); bank != "" {
						paymentTx.BillerCode = &bank
					}
				}
			}
			if billerCode := getStringFromMap(payload, "biller_code"); billerCode != "" {
				paymentTx.BillerCode = &billerCode
			}
			if billKey := getStringFromMap(payload, "bill_key"); billKey != "" {
				paymentTx.BillKey = &billKey
			}

			// Save updated transaction
			if err := r.UpdateTransaction(ctx, paymentTx); err != nil {
				log.Printf("[Payment] Failed to update transaction from webhook: %v", err)
				webhookLog.ProcessingError = strPtr(fmt.Sprintf("Failed to update transaction: %v", err))
				_ = r.CreateWebhookLog(ctx, webhookLog)
				return appErrors.InternalServerError("Failed to update transaction", err)
			}

			log.Printf("[Payment] Transaction updated from webhook: %s, new status: %s", paymentOrderID, paymentTx.Status)

			// Mark webhook as processed
			now := time.Now()
			webhookLog.ProcessedAt = &now
			if err := r.CreateWebhookLog(ctx, webhookLog); err != nil {
				log.Printf("[Payment] Warning: Failed to create webhook log: %v", err)
			}

			// Create status log if status changed
			if oldStatus != paymentTx.Status {
				log.Printf("[Payment] Webhook status changed: %s -> %s", oldStatus, paymentTx.Status)
				statusLog := &entity.PaymentStatusLog{
					PaymentTransactionID: paymentTx.ID,
					PreviousStatus:       &oldStatus,
					NewStatus:            paymentTx.Status,
					FraudStatus:          paymentTx.FraudStatus,
					Source:               "webhook",
					StatusMessage:        strPtr(fmt.Sprintf("Webhook notification: %s", transactionStatus)),
					RawData:              entity.JSONB(payload),
				}
				if err := r.CreateStatusLog(ctx, statusLog); err != nil {
					log.Printf("[Payment] Warning: Failed to create status log: %v", err)
				}
			}

			result = &WebhookResponse{
				PaymentTransactionID: paymentTx.ID,
				OrderID:              paymentTx.OrderID,
				Status:               paymentTx.Status,
				Message:              "Payment notification processed successfully",
			}

			return nil
		})
	})

	if err != nil {
		return nil, err
	}

	if txn := newrelic.FromContext(ctx); txn != nil {
		txn.AddAttribute("webhook_processed", true)
		txn.AddAttribute("new_status", result.Status)
	}

	// Update order status if payment is successful
	if newStatus == "SUCCESS" && oldStatus != "SUCCESS" {
		log.Printf("[Payment] Payment successful, updating order status to PAYMENT_CONFIRMED")
		if err := s.updateOrderStatus(ctx, paymentTx.OrderID, "PAYMENT_CONFIRMED", "Payment confirmed via webhook"); err != nil {
			log.Printf("[Payment] WARNING: Failed to update order status: %v", err)
			// Don't fail the webhook if order status update fails
		}
	}

	log.Printf("[Payment] Webhook processed successfully: %s, final status: %s", paymentOrderID, result.Status)
	return result, nil
}

// VerifySignature verifies Midtrans webhook signature
func (s *midtransService) VerifySignature(orderID, statusCode, grossAmount, signature string) bool {
	raw := fmt.Sprintf("%s%s%s%s", orderID, statusCode, strings.TrimSpace(grossAmount), s.cfg.Midtrans.ServerKey)
	sum := sha512.Sum512([]byte(raw))
	expected := hex.EncodeToString(sum[:])
	return strings.EqualFold(expected, signature)
}

// GetTransactionByOrderID gets payment transaction by order ID
func (s *midtransService) GetTransactionByOrderID(ctx context.Context, orderID uuid.UUID) (*entity.PaymentTransaction, error) {
	return s.repo.FindTransactionByOrderID(ctx, orderID)
}

// GetTransactionByPaymentOrderID gets payment transaction by payment order ID
func (s *midtransService) GetTransactionByPaymentOrderID(ctx context.Context, paymentOrderID string) (*entity.PaymentTransaction, error) {
	return s.repo.FindTransactionByPaymentOrderID(ctx, paymentOrderID)
}

// GetPaymentHistory gets all payment transactions for an order
func (s *midtransService) GetPaymentHistory(ctx context.Context, orderID uuid.UUID) ([]entity.PaymentTransaction, error) {
	return s.repo.ListTransactionsByOrderID(ctx, orderID)
}

// GetTransactionHistory gets payment transaction history with filters
func (s *midtransService) GetTransactionHistory(ctx context.Context, filters repository.TransactionFilters) ([]entity.PaymentTransaction, int64, error) {
	return s.repo.ListTransactions(ctx, filters)
}

// updateOrderStatus calls core API to update order status
func (s *midtransService) updateOrderStatus(ctx context.Context, orderID uuid.UUID, newStatus, note string) error {
	coreAPIURL := s.cfg.External.CoreAPIURL
	if coreAPIURL == "" {
		return errors.New("CORE_API_URL not configured")
	}

	url := fmt.Sprintf("%s/orders/%s/status", coreAPIURL, orderID.String())
	payload := map[string]interface{}{
		"new_status": newStatus,
		"note":       note,
		"source":     "payment_webhook",
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to call core API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("core API returned error %d: %s", resp.StatusCode, string(bodyBytes))
	}

	log.Printf("[Payment] Successfully updated order %s status to %s", orderID, newStatus)
	return nil
}

// Helper functions

func mapMidtransStatus(transactionStatus, fraudStatus string) string {
	// Map Midtrans status to our internal status
	switch transactionStatus {
	case "capture":
		if fraudStatus == "accept" {
			return "SUCCESS"
		}
		return "PENDING"
	case "settlement":
		return "SUCCESS"
	case "pending":
		return "PENDING"
	case "deny", "cancel":
		return "CANCELED"
	case "expire":
		return "EXPIRED"
	case "failure":
		return "FAILED"
	default:
		return "PENDING"
	}
}

func mapToJSONB(data interface{}) entity.JSONB {
	if data == nil {
		return nil
	}
	// Convert to map for JSONB
	result := make(map[string]interface{})

	// Use type assertion or reflection based on actual type
	// For simplicity, we'll just wrap it
	switch v := data.(type) {
	case map[string]interface{}:
		return entity.JSONB(v)
	default:
		result["data"] = data
		return entity.JSONB(result)
	}
}

func getStringFromMap(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if s, ok := v.(string); ok {
			return s
		}
	}
	return ""
}

func strPtr(s string) *string {
	return &s
}

func strPtrNonEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func parseTime(timeStr string) (time.Time, error) {
	// Midtrans time format: "2006-01-02 15:04:05"
	layouts := []string{
		"2006-01-02 15:04:05",
		time.RFC3339,
		"2006-01-02T15:04:05Z",
		"2006-01-02T15:04:05-07:00",
	}

	for _, layout := range layouts {
		if t, err := time.Parse(layout, timeStr); err == nil {
			return t, nil
		}
	}

	return time.Time{}, errors.New("unable to parse time")
}

func strPtrToString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
