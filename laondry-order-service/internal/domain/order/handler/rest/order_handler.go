package rest

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"laondry-order-service/internal/domain/order/repository"
	"laondry-order-service/internal/domain/order/service"
	mw "laondry-order-service/internal/middleware"
	"laondry-order-service/pkg/response"
	"laondry-order-service/pkg/validator"
)

type OrderHandler struct {
	orderService service.OrderService
	validator    *validator.Validator
}

func NewOrderHandler(orderService service.OrderService, validator *validator.Validator) *OrderHandler {
	return &OrderHandler{
		orderService: orderService,
		validator:    validator,
	}
}

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var req service.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid request payload", err.Error())
		return
	}

	// Get customer_id from authenticated user if not provided
	if req.CustomerID == uuid.Nil {
		user, ok := mw.GetUserFromContext(r.Context())
		if !ok {
			response.Unauthorized(w, "Authentication required")
			return
		}
		customerID, err := uuid.Parse(user.UserID)
		if err != nil {
			response.BadRequest(w, "Invalid user ID", err.Error())
			return
		}
		req.CustomerID = customerID
	}

	if validationErrors := h.validator.Validate(req); len(validationErrors) > 0 {
		response.UnprocessableEntity(w, "Validation failed", validationErrors)
		return
	}

	// enrich access log fields
	mw.SetAccessField(r, "customer_id", req.CustomerID.String())
	mw.SetAccessField(r, "outlet_id", req.OutletID.String())

	order, err := h.orderService.CreateOrder(r.Context(), req)
	if err != nil {
		response.Error(w, err)
		return
	}
	// enrich with created identifiers
	mw.SetAccessField(r, "order_id", order.ID.String())
	mw.SetAccessField(r, "order_no", order.OrderNo)

	response.Created(w, "Order created successfully", order)
}

func (h *OrderHandler) GetOrderByID(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		response.BadRequest(w, "Invalid order ID", err.Error())
		return
	}
	mw.SetAccessField(r, "order_id", id.String())

	order, err := h.orderService.GetOrderByID(r.Context(), id)
	if err != nil {
		response.Error(w, err)
		return
	}
	mw.SetAccessField(r, "order_no", order.OrderNo)

	response.Success(w, "Order retrieved successfully", order)
}

func (h *OrderHandler) GetOrderByOrderNo(w http.ResponseWriter, r *http.Request) {
	orderNo := chi.URLParam(r, "orderNo")
	if orderNo == "" {
		response.BadRequest(w, "Order number is required", nil)
		return
	}
	mw.SetAccessField(r, "order_no", orderNo)

	order, err := h.orderService.GetOrderByOrderNo(r.Context(), orderNo)
	if err != nil {
		response.Error(w, err)
		return
	}
	mw.SetAccessField(r, "order_id", order.ID.String())

	response.Success(w, "Order retrieved successfully", order)
}

func (h *OrderHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	filters := repository.OrderFilters{
		Page:      1,
		Limit:     10,
		SortBy:    "created_at",
		SortOrder: "DESC",
	}

	if page := r.URL.Query().Get("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			filters.Page = p
		}
	}

	if limit := r.URL.Query().Get("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			filters.Limit = l
		}
	}

	if sortBy := r.URL.Query().Get("sort_by"); sortBy != "" {
		filters.SortBy = sortBy
	}

	if sortOrder := r.URL.Query().Get("sort_order"); sortOrder != "" {
		filters.SortOrder = sortOrder
	}

	if customerID := r.URL.Query().Get("customer_id"); customerID != "" {
		if id, err := uuid.Parse(customerID); err == nil {
			filters.CustomerID = &id
			mw.SetAccessField(r, "customer_id", id.String())
		}
	}

	if outletID := r.URL.Query().Get("outlet_id"); outletID != "" {
		if id, err := uuid.Parse(outletID); err == nil {
			filters.OutletID = &id
			mw.SetAccessField(r, "outlet_id", id.String())
		}
	}

	if status := r.URL.Query().Get("status"); status != "" {
		filters.Status = &status
	}

	if orderType := r.URL.Query().Get("order_type"); orderType != "" {
		filters.OrderType = &orderType
	}

	if startDate := r.URL.Query().Get("start_date"); startDate != "" {
		filters.StartDate = &startDate
	}

	if endDate := r.URL.Query().Get("end_date"); endDate != "" {
		filters.EndDate = &endDate
	}

	if search := r.URL.Query().Get("search"); search != "" {
		filters.Search = &search
	}

	orders, total, err := h.orderService.GetOrders(r.Context(), filters)
	if err != nil {
		response.Error(w, err)
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(filters.Limit)))

	meta := response.PaginationMeta{
		CurrentPage: filters.Page,
		PerPage:     filters.Limit,
		Total:       total,
		TotalPages:  totalPages,
	}

	response.SuccessWithMeta(w, "Orders retrieved successfully", orders, meta)
}

func (h *OrderHandler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		response.BadRequest(w, "Invalid order ID", err.Error())
		return
	}
	mw.SetAccessField(r, "order_id", id.String())

	var req service.UpdateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid request payload", err.Error())
		return
	}

	if validationErrors := h.validator.Validate(req); len(validationErrors) > 0 {
		response.UnprocessableEntity(w, "Validation failed", validationErrors)
		return
	}

	order, err := h.orderService.UpdateOrder(r.Context(), id, req)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "Order updated successfully", order)
}

func (h *OrderHandler) DeleteOrder(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		response.BadRequest(w, "Invalid order ID", err.Error())
		return
	}
	mw.SetAccessField(r, "order_id", id.String())

	if err := h.orderService.DeleteOrder(r.Context(), id); err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "Order deleted successfully", nil)
}

func (h *OrderHandler) UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		response.BadRequest(w, "Invalid order ID", err.Error())
		return
	}
	mw.SetAccessField(r, "order_id", id.String())

	var req service.UpdateStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid request payload", err.Error())
		return
	}

	if validationErrors := h.validator.Validate(req); len(validationErrors) > 0 {
		response.UnprocessableEntity(w, "Validation failed", validationErrors)
		return
	}

	if err := h.orderService.UpdateOrderStatus(r.Context(), id, req); err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "Order status updated successfully", nil)
}

func (h *OrderHandler) CancelOrder(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		response.BadRequest(w, "Invalid order ID", err.Error())
		return
	}
	mw.SetAccessField(r, "order_id", id.String())

	type CancelRequest struct {
		CanceledBy *uuid.UUID `json:"canceled_by"`
		Reason     *string    `json:"reason"`
	}

	var req CancelRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Allow empty body for simple cancel
		req = CancelRequest{}
	}

	if err := h.orderService.CancelOrder(r.Context(), id, req.CanceledBy, req.Reason); err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "Order canceled successfully", nil)
}

func (h *OrderHandler) GetOrderStatusLogs(w http.ResponseWriter, r *http.Request) {
	idParam := chi.URLParam(r, "id")
	id, err := uuid.Parse(idParam)
	if err != nil {
		response.BadRequest(w, "Invalid order ID", err.Error())
		return
	}
	mw.SetAccessField(r, "order_id", id.String())
	page := 1
	limit := 10
	if v := r.URL.Query().Get("page"); v != "" {
		if p, err := strconv.Atoi(v); err == nil && p > 0 {
			page = p
		}
	}
	if v := r.URL.Query().Get("limit"); v != "" {
		if l, err := strconv.Atoi(v); err == nil && l > 0 {
			limit = l
		}
	}
	sortOrder := r.URL.Query().Get("sort_order") // ASC|DESC, default DESC in service/repo

	logs, total, err := h.orderService.GetOrderStatusLogs(r.Context(), id, page, limit, sortOrder)
	if err != nil {
		response.Error(w, err)
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	meta := response.PaginationMeta{CurrentPage: page, PerPage: limit, Total: total, TotalPages: totalPages}
	response.SuccessWithMeta(w, "Order status logs retrieved successfully", logs, meta)
}
