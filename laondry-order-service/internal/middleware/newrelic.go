package middleware

import (
	"net/http"

	"github.com/newrelic/go-agent/v3/newrelic"
)

// NewRelic returns a middleware that starts a New Relic transaction per request.
func NewRelic(app *newrelic.Application) func(http.Handler) http.Handler {
	if app == nil {
		// no-op middleware
		return func(next http.Handler) http.Handler { return next }
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			name := r.Method + " " + r.URL.Path
			txn := app.StartTransaction(name)
			defer txn.End()

			// Add request to transaction
			txn.SetWebRequestHTTP(r)

			// Wrap response writer
			w = txn.SetWebResponse(w)

			// Pass transaction via context
			ctx := newrelic.NewContext(r.Context(), txn)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
