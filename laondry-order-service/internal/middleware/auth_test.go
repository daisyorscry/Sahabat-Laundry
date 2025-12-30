package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

// Mock handler untuk testing
func mockHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := GetUserFromContext(r.Context())
		if ok {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"user":    user,
			})
		} else {
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"user":    nil,
			})
		}
	})
}

// Mock core-api server for testing
func createMockCoreAPIServer() *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")

		// Check for valid token
		if authHeader == "Bearer valid-token" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"id":           "user-123",
					"email":        "test@example.com",
					"phone_number": "081234567890",
					"role":         "customer",
				},
			})
			return
		}

		// Invalid token
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusUnauthorized)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Invalid token",
		})
	}))
}

func TestAuth_Success(t *testing.T) {
	// Setup mock core-api server
	mockServer := createMockCoreAPIServer()
	defer mockServer.Close()

	// Set core API URL to mock server
	SetCoreAPIURL(mockServer.URL)

	// Create request with valid token
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer valid-token")

	// Create response recorder
	rr := httptest.NewRecorder()

	// Create middleware and wrap handler
	handler := Auth(mockHandler())
	handler.ServeHTTP(rr, req)

	// Assert response
	assert.Equal(t, http.StatusOK, rr.Code)

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["user"])

	// Check user data
	user := response["user"].(map[string]interface{})
	assert.Equal(t, "user-123", user["user_id"])
	assert.Equal(t, "test@example.com", user["email"])
	assert.Equal(t, "081234567890", user["phone"])
	assert.Equal(t, "customer", user["role"])
}

func TestAuth_MissingAuthorizationHeader(t *testing.T) {
	// Create request without Authorization header
	req := httptest.NewRequest("GET", "/test", nil)
	rr := httptest.NewRecorder()

	// Create middleware and wrap handler
	handler := Auth(mockHandler())
	handler.ServeHTTP(rr, req)

	// Assert response
	assert.Equal(t, http.StatusUnauthorized, rr.Code)

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Authorization header required", response["message"])
}

func TestAuth_InvalidAuthorizationHeaderFormat(t *testing.T) {
	testCases := []struct {
		name   string
		header string
	}{
		{"No Bearer prefix", "invalid-token"},
		{"Wrong prefix", "Basic dGVzdDp0ZXN0"},
		{"Extra spaces", "Bearer  token"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/test", nil)
			req.Header.Set("Authorization", tc.header)
			rr := httptest.NewRecorder()

			handler := Auth(mockHandler())
			handler.ServeHTTP(rr, req)

			assert.Equal(t, http.StatusUnauthorized, rr.Code)

			var response map[string]interface{}
			err := json.NewDecoder(rr.Body).Decode(&response)
			assert.NoError(t, err)
			assert.False(t, response["success"].(bool))
			assert.Equal(t, "Invalid authorization header format", response["message"])
		})
	}
}

func TestAuth_InvalidToken(t *testing.T) {
	// Setup mock core-api server
	mockServer := createMockCoreAPIServer()
	defer mockServer.Close()

	// Set core API URL to mock server
	SetCoreAPIURL(mockServer.URL)

	// Create request with invalid token
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	rr := httptest.NewRecorder()

	// Create middleware and wrap handler
	handler := Auth(mockHandler())
	handler.ServeHTTP(rr, req)

	// Assert response
	assert.Equal(t, http.StatusUnauthorized, rr.Code)

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Invalid or expired token", response["message"])
}

func TestAuth_CoreAPIUnavailable(t *testing.T) {
	// Set core API URL to non-existent server
	SetCoreAPIURL("http://localhost:99999")

	// Create request with valid token format
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer some-token")
	rr := httptest.NewRecorder()

	// Create middleware and wrap handler
	handler := Auth(mockHandler())
	handler.ServeHTTP(rr, req)

	// Assert response
	assert.Equal(t, http.StatusUnauthorized, rr.Code)

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err)
	assert.False(t, response["success"].(bool))
	assert.Equal(t, "Invalid or expired token", response["message"])
}

func TestOptionalAuth_WithValidToken(t *testing.T) {
	// Setup mock core-api server
	mockServer := createMockCoreAPIServer()
	defer mockServer.Close()

	// Set core API URL to mock server
	SetCoreAPIURL(mockServer.URL)

	// Create request with valid token
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer valid-token")
	rr := httptest.NewRecorder()

	// Create middleware and wrap handler
	handler := OptionalAuth(mockHandler())
	handler.ServeHTTP(rr, req)

	// Assert response - should succeed with user info
	assert.Equal(t, http.StatusOK, rr.Code)

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.NotNil(t, response["user"])
}

func TestOptionalAuth_WithoutToken(t *testing.T) {
	// Create request without Authorization header
	req := httptest.NewRequest("GET", "/test", nil)
	rr := httptest.NewRecorder()

	// Create middleware and wrap handler
	handler := OptionalAuth(mockHandler())
	handler.ServeHTTP(rr, req)

	// Assert response - should succeed without user info
	assert.Equal(t, http.StatusOK, rr.Code)

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Nil(t, response["user"])
}

func TestOptionalAuth_WithInvalidToken(t *testing.T) {
	// Setup mock core-api server
	mockServer := createMockCoreAPIServer()
	defer mockServer.Close()

	// Set core API URL to mock server
	SetCoreAPIURL(mockServer.URL)

	// Create request with invalid token
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	rr := httptest.NewRecorder()

	// Create middleware and wrap handler
	handler := OptionalAuth(mockHandler())
	handler.ServeHTTP(rr, req)

	// Assert response - should succeed without user info (graceful degradation)
	assert.Equal(t, http.StatusOK, rr.Code)

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	assert.NoError(t, err)
	assert.True(t, response["success"].(bool))
	assert.Nil(t, response["user"])
}

func TestGetUserFromContext(t *testing.T) {
	t.Run("User exists in context", func(t *testing.T) {
		// Setup mock core-api server
		mockServer := createMockCoreAPIServer()
		defer mockServer.Close()
		SetCoreAPIURL(mockServer.URL)

		// Create request with valid token
		req := httptest.NewRequest("GET", "/test", nil)
		req.Header.Set("Authorization", "Bearer valid-token")
		rr := httptest.NewRecorder()

		// Handler that checks context
		testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, ok := GetUserFromContext(r.Context())
			assert.True(t, ok)
			assert.NotNil(t, user)
			assert.Equal(t, "user-123", user.UserID)
			assert.Equal(t, "test@example.com", user.Email)
			assert.Equal(t, "081234567890", user.Phone)
			assert.Equal(t, "customer", user.Role)
			w.WriteHeader(http.StatusOK)
		})

		handler := Auth(testHandler)
		handler.ServeHTTP(rr, req)
	})

	t.Run("User does not exist in context", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/test", nil)

		user, ok := GetUserFromContext(req.Context())
		assert.False(t, ok)
		assert.Nil(t, user)
	})
}

func TestValidateTokenWithCoreAPI_Success(t *testing.T) {
	mockServer := createMockCoreAPIServer()
	defer mockServer.Close()
	SetCoreAPIURL(mockServer.URL)

	user, err := validateTokenWithCoreAPI("valid-token")
	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, "user-123", user.UserID)
	assert.Equal(t, "test@example.com", user.Email)
	assert.Equal(t, "081234567890", user.Phone)
	assert.Equal(t, "customer", user.Role)
}

func TestValidateTokenWithCoreAPI_InvalidToken(t *testing.T) {
	mockServer := createMockCoreAPIServer()
	defer mockServer.Close()
	SetCoreAPIURL(mockServer.URL)

	user, err := validateTokenWithCoreAPI("invalid-token")
	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "401")
}

func TestValidateTokenWithCoreAPI_CoreAPINotConfigured(t *testing.T) {
	// Clear core API URL
	originalURL := coreAPIURL
	coreAPIURL = ""
	defer func() { coreAPIURL = originalURL }()

	user, err := validateTokenWithCoreAPI("some-token")
	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "not configured")
}

func TestValidateTokenWithCoreAPI_CoreAPIDown(t *testing.T) {
	SetCoreAPIURL("http://localhost:99999")

	user, err := validateTokenWithCoreAPI("some-token")
	assert.Error(t, err)
	assert.Nil(t, user)
}

func TestValidateTokenWithCoreAPI_InvalidResponse(t *testing.T) {
	// Create mock server that returns invalid JSON
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, "invalid json")
	}))
	defer mockServer.Close()
	SetCoreAPIURL(mockServer.URL)

	user, err := validateTokenWithCoreAPI("some-token")
	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "decode")
}

func TestValidateTokenWithCoreAPI_UnsuccessfulResponse(t *testing.T) {
	// Create mock server that returns success=false
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "Token expired",
		})
	}))
	defer mockServer.Close()
	SetCoreAPIURL(mockServer.URL)

	user, err := validateTokenWithCoreAPI("expired-token")
	assert.Error(t, err)
	assert.Nil(t, user)
	assert.Contains(t, err.Error(), "validation failed")
}
