package middleware

import (
	"log"
	"net/http"

	"laondry-order-service/pkg/response"
)

func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)
				response.InternalServerError(w, "Internal server error", "Something went wrong")
			}
		}()
		next.ServeHTTP(w, r)
	})
}
