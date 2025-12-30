package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"laondry-order-service/pkg/response"
)

// contextKey is a custom type for context keys to avoid collisions
type contextKey string

const (
	// ContextUserKey is the key for storing user claims in context
	ContextUserKey contextKey = "user"
)

var coreAPIURL string

// SetCoreAPIURL sets the core API URL from config
func SetCoreAPIURL(url string) {
	coreAPIURL = url
	log.Printf("Core API URL set to: %s", coreAPIURL)
}

type UserClaims struct {
    UserID string `json:"user_id"`
    Email  string `json:"email"`
    Phone  string `json:"phone"`
    Role   string `json:"role"`
    // Optional: member tier code derived from core-api user profile
    MemberTierCode *string `json:"member_tier_code,omitempty"`
}

// Auth middleware validates token dengan core-api
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.Unauthorized(w, "Authorization header required")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Unauthorized(w, "Invalid authorization header format")
			return
		}

		token := parts[1]

		// Validate token dengan core-api
		user, err := validateTokenWithCoreAPI(token)
		if err != nil {
			log.Printf("[Auth] Token validation failed: %v", err)
			response.Unauthorized(w, "Invalid or expired token")
			return
		}

		// Store user info di context
		ctx := context.WithValue(r.Context(), ContextUserKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// Optional auth - jika ada token, validasi. Jika tidak ada, lanjut tanpa user info
func OptionalAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			next.ServeHTTP(w, r)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			next.ServeHTTP(w, r)
			return
		}

		token := parts[1]
		user, err := validateTokenWithCoreAPI(token)
		if err == nil && user != nil {
			ctx := context.WithValue(r.Context(), ContextUserKey, user)
			r = r.WithContext(ctx)
		}

		next.ServeHTTP(w, r)
	})
}

func validateTokenWithCoreAPI(token string) (*UserClaims, error) {
	if coreAPIURL == "" {
		return nil, fmt.Errorf("core API URL not configured")
	}

	client := &http.Client{
		Timeout: 5 * time.Second,
	}

	// Call core-api /user-profile/me endpoint to validate token
	req, err := http.NewRequest("GET", coreAPIURL+"/user-profile/me", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call core-api: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("core-api returned %d: %s", resp.StatusCode, string(body))
	}

    var result struct {
        Success bool `json:"success"`
        Data    struct {
            ID         string `json:"id"`
            Email      string `json:"email"`
            Phone      string `json:"phone_number"`
            Role       string `json:"role"`
            MemberTier *struct {
                Code string `json:"code"`
            } `json:"memberTier"`
        } `json:"data"`
    }

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	if !result.Success {
		return nil, fmt.Errorf("core-api validation failed")
	}

    claims := &UserClaims{
        UserID: result.Data.ID,
        Email:  result.Data.Email,
        Phone:  result.Data.Phone,
        Role:   result.Data.Role,
    }
    // Capture member tier code if available
    if result.Data.MemberTier != nil && result.Data.MemberTier.Code != "" {
        code := result.Data.MemberTier.Code
        claims.MemberTierCode = &code
    }
    return claims, nil
}

// GetUserFromContext mengambil user claims dari context
func GetUserFromContext(ctx context.Context) (*UserClaims, bool) {
	user, ok := ctx.Value(ContextUserKey).(*UserClaims)
	return user, ok
}
