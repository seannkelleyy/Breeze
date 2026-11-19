package middleware

import (
	"context"
	"net/http"

	clerk "github.com/clerk/clerk-sdk-go/v2"
	clerkhttp "github.com/clerk/clerk-sdk-go/v2/http"
)

type contextKey string

const devUserIDKey contextKey = "dev_user_id"

// RequireAuth validates the Clerk JWT on incoming requests.
func RequireAuth(next http.Handler) http.Handler {
	return clerkhttp.RequireHeaderAuthorization()(next)
}

// WithDevUserID injects a test identity into the context for resolver tests.
func WithDevUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, devUserIDKey, userID)
}

// UserIDFromCtx extracts the Clerk user ID from the request context.
// Returns "" if not authenticated.
func UserIDFromCtx(ctx context.Context) string {
	// Check for dev mode user ID first.
	if devID, ok := ctx.Value(devUserIDKey).(string); ok && devID != "" {
		return devID
	}

	claims, ok := clerk.SessionClaimsFromContext(ctx)
	if !ok {
		return ""
	}
	return claims.Subject
}

// CORS sets the appropriate headers and handles preflight requests.
func CORS(allowedOrigin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", allowedOrigin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
			w.Header().Set("Vary", "Origin")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
