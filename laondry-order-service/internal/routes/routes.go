package routes

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"

	"laondry-order-service/internal/config"
	"laondry-order-service/internal/domain/order"
	"laondry-order-service/internal/domain/payment"
	"laondry-order-service/internal/middleware"
	"laondry-order-service/pkg/response"
	"laondry-order-service/pkg/validator"
)

type Router struct {
	orderDomain   *order.OrderDomain
	paymentDomain *payment.PaymentDomain
}

func NewRouter(cfg *config.Config, db *gorm.DB, validator *validator.Validator, orderDomain *order.OrderDomain) *Router {
	paymentDomain := payment.NewPaymentDomain(cfg, validator, db)
	return &Router{
		orderDomain:   orderDomain,
		paymentDomain: paymentDomain,
	}
}

func (rt *Router) Setup() http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.Recovery)
	r.Use(middleware.Logger)
	r.Use(middleware.CORS)
	r.Use(middleware.ContentType)

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		response.Success(w, "Service is healthy", map[string]string{
			"status": "ok",
		})
	})

	r.Route("/api/v1", func(r chi.Router) {
		// Protected routes - require authentication
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth)

			// Quote endpoint (calculate pricing)
			r.Post("/quote", rt.orderDomain.QuoteHandler.CalculateQuote)

			// Orders endpoints
			r.Route("/orders", func(r chi.Router) {
				r.Post("/", rt.orderDomain.Handler.CreateOrder)
				r.Get("/", rt.orderDomain.Handler.GetOrders)
				r.Get("/{id}", rt.orderDomain.Handler.GetOrderByID)
				r.Get("/order-no/{orderNo}", rt.orderDomain.Handler.GetOrderByOrderNo)
				r.Get("/{id}/status-logs", rt.orderDomain.Handler.GetOrderStatusLogs)
				r.Get("/{id}/timeline", rt.orderDomain.Handler.GetOrderStatusLogs) // Alias for mobile
				r.Put("/{id}", rt.orderDomain.Handler.UpdateOrder)
				r.Delete("/{id}", rt.orderDomain.Handler.DeleteOrder)
				r.Patch("/{id}/status", rt.orderDomain.Handler.UpdateOrderStatus)
				r.Post("/{id}/cancel", rt.orderDomain.Handler.CancelOrder)
			})

			// Payment endpoints - Midtrans (Protected)
			r.Route("/payments/midtrans", func(r chi.Router) {
				// Create snap token
				r.Post("/token", rt.paymentDomain.Handler.CreateSnapToken)

				// Check transaction status (queries Midtrans API)
				r.Get("/status/{paymentOrderId}", rt.paymentDomain.Handler.CheckStatus)

				// Get payment transaction by order ID
				r.Get("/order/{orderId}", rt.paymentDomain.Handler.GetByOrderID)

				// Get payment transaction by payment order ID
				r.Get("/payment/{paymentOrderId}", rt.paymentDomain.Handler.GetByPaymentOrderID)

				// Get payment history for an order
				r.Get("/history/order/{orderId}", rt.paymentDomain.Handler.GetPaymentHistory)

				// Get transaction history with filters
				r.Get("/history", rt.paymentDomain.Handler.GetTransactionHistory)
			})
		})

		// Public webhook endpoint (no auth) - must be accessible by Midtrans
		r.Post("/payments/midtrans/notification", rt.paymentDomain.Handler.Notification)
	})

	return r
}
