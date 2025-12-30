package rest

import (
	"encoding/json"
	"net/http"

	"laondry-order-service/internal/domain/order/service"
	"laondry-order-service/pkg/response"
	"laondry-order-service/pkg/validator"
)

type QuoteHandler struct {
	quoteService service.QuoteService
	validator    *validator.Validator
}

func NewQuoteHandler(quoteService service.QuoteService, validator *validator.Validator) *QuoteHandler {
	return &QuoteHandler{
		quoteService: quoteService,
		validator:    validator,
	}
}

func (h *QuoteHandler) CalculateQuote(w http.ResponseWriter, r *http.Request) {
	var req service.QuoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "Invalid request payload", err.Error())
		return
	}

	if validationErrors := h.validator.Validate(req); len(validationErrors) > 0 {
		response.UnprocessableEntity(w, "Validation failed", validationErrors)
		return
	}

	result, err := h.quoteService.CalculateQuote(r.Context(), req)
	if err != nil {
		response.Error(w, err)
		return
	}

	response.Success(w, "Quote calculated successfully", result)
}
