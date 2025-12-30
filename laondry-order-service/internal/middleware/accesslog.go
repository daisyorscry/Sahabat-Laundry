package middleware

import (
    "encoding/json"
    "context"
    "io"
    "net/http"
    "time"
)

type accessLogEntry struct {
    Timestamp   string  `json:"ts"`
    Method      string  `json:"method"`
    Path        string  `json:"path"`
    Query       string  `json:"query"`
    RemoteIP    string  `json:"remote_ip"`
    UserAgent   string  `json:"ua"`
    Status      int     `json:"status"`
    DurationMs  float64 `json:"duration_ms"`
    CustomerID  string  `json:"customer_id,omitempty"`
    OutletID    string  `json:"outlet_id,omitempty"`
    OrderID     string  `json:"order_id,omitempty"`
    OrderNo     string  `json:"order_no,omitempty"`
}

type accessCtxKey struct{}

// AccessLogFields is a request-scoped map for enriching access logs.
type AccessLogFields map[string]string

// SetAccessField sets a custom field for access logging on the given request.
func SetAccessField(r *http.Request, key, value string) {
    if value == "" { return }
    v := r.Context().Value(accessCtxKey{})
    if v == nil { return }
    if m, ok := v.(*AccessLogFields); ok && m != nil {
        (*m)[key] = value
    }
}

// AccessLog writes JSON access logs to the provided writer (e.g., a rotating file).
func AccessLog(w io.Writer) func(http.Handler) http.Handler {
    if w == nil {
        return func(next http.Handler) http.Handler { return next }
    }
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
            start := time.Now()
            wrapped := &responseWriter{ResponseWriter: rw, statusCode: http.StatusOK}
            // inject mutable map into context for handlers to enrich
            fields := AccessLogFields{}
            ctx := context.WithValue(r.Context(), accessCtxKey{}, &fields)
            next.ServeHTTP(wrapped, r.WithContext(ctx))
            entry := accessLogEntry{
                Timestamp:  time.Now().Format(time.RFC3339Nano),
                Method:     r.Method,
                Path:       r.URL.Path,
                Query:      r.URL.RawQuery,
                RemoteIP:   r.RemoteAddr,
                UserAgent:  r.UserAgent(),
                Status:     wrapped.statusCode,
                DurationMs: float64(time.Since(start).Microseconds()) / 1000.0,
                CustomerID: fields["customer_id"],
                OutletID:   fields["outlet_id"],
                OrderID:    fields["order_id"],
                OrderNo:    fields["order_no"],
            }
            _ = json.NewEncoder(w).Encode(entry)
        })
    }
}
