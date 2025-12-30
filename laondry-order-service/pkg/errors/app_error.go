package errors

import (
	"fmt"
	"net/http"
)

type AppError struct {
	Message    string
	StatusCode int
	Err        error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func NewAppError(message string, statusCode int, err error) *AppError {
	return &AppError{
		Message:    message,
		StatusCode: statusCode,
		Err:        err,
	}
}

func BadRequest(message string, err error) *AppError {
	return &AppError{
		Message:    message,
		StatusCode: http.StatusBadRequest,
		Err:        err,
	}
}

func Unauthorized(message string, err error) *AppError {
	return &AppError{
		Message:    message,
		StatusCode: http.StatusUnauthorized,
		Err:        err,
	}
}

func Forbidden(message string, err error) *AppError {
	return &AppError{
		Message:    message,
		StatusCode: http.StatusForbidden,
		Err:        err,
	}
}

func NotFound(message string, err error) *AppError {
	return &AppError{
		Message:    message,
		StatusCode: http.StatusNotFound,
		Err:        err,
	}
}

func Conflict(message string, err error) *AppError {
	return &AppError{
		Message:    message,
		StatusCode: http.StatusConflict,
		Err:        err,
	}
}

func UnprocessableEntity(message string, err error) *AppError {
	return &AppError{
		Message:    message,
		StatusCode: http.StatusUnprocessableEntity,
		Err:        err,
	}
}

func InternalServerError(message string, err error) *AppError {
	return &AppError{
		Message:    message,
		StatusCode: http.StatusInternalServerError,
		Err:        err,
	}
}
