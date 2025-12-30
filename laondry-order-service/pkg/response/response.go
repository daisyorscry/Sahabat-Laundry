package response

import (
	"encoding/json"
	"net/http"

	appErrors "laondry-order-service/pkg/errors"
)

type Response struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   interface{} `json:"error,omitempty"`
	Meta    interface{} `json:"meta,omitempty"`
}

type PaginationMeta struct {
	CurrentPage int   `json:"current_page"`
	PerPage     int   `json:"per_page"`
	Total       int64 `json:"total"`
	TotalPages  int   `json:"total_pages"`
}

func JSON(w http.ResponseWriter, statusCode int, payload Response) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(payload)
}

func Success(w http.ResponseWriter, message string, data interface{}) {
	JSON(w, http.StatusOK, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func SuccessWithMeta(w http.ResponseWriter, message string, data interface{}, meta interface{}) {
	JSON(w, http.StatusOK, Response{
		Success: true,
		Message: message,
		Data:    data,
		Meta:    meta,
	})
}

func Created(w http.ResponseWriter, message string, data interface{}) {
	JSON(w, http.StatusCreated, Response{
		Success: true,
		Message: message,
		Data:    data,
	})
}

func Error(w http.ResponseWriter, err error) {
	if appErr, ok := err.(*appErrors.AppError); ok {
		JSON(w, appErr.StatusCode, Response{
			Success: false,
			Message: appErr.Message,
			Error:   appErr.Error(),
		})
		return
	}

	JSON(w, http.StatusInternalServerError, Response{
		Success: false,
		Message: "Internal server error",
		Error:   err.Error(),
	})
}

func BadRequest(w http.ResponseWriter, message string, err interface{}) {
	JSON(w, http.StatusBadRequest, Response{
		Success: false,
		Message: message,
		Error:   err,
	})
}

func Unauthorized(w http.ResponseWriter, message string) {
	JSON(w, http.StatusUnauthorized, Response{
		Success: false,
		Message: message,
	})
}

func Forbidden(w http.ResponseWriter, message string) {
	JSON(w, http.StatusForbidden, Response{
		Success: false,
		Message: message,
	})
}

func NotFound(w http.ResponseWriter, message string) {
	JSON(w, http.StatusNotFound, Response{
		Success: false,
		Message: message,
	})
}

func Conflict(w http.ResponseWriter, message string) {
	JSON(w, http.StatusConflict, Response{
		Success: false,
		Message: message,
	})
}

func InternalServerError(w http.ResponseWriter, message string, err interface{}) {
	JSON(w, http.StatusInternalServerError, Response{
		Success: false,
		Message: message,
		Error:   err,
	})
}

func UnprocessableEntity(w http.ResponseWriter, message string, err interface{}) {
	JSON(w, http.StatusUnprocessableEntity, Response{
		Success: false,
		Message: message,
		Error:   err,
	})
}
