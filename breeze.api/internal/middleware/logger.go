package middleware

import (
	"context"
	"log/slog"
	"net/http"
)

type loggerContextKey string

const loggerKey loggerContextKey = "logger"

// LoggerMiddleware injects a slog.Logger pre-loaded with request metadata
// into every request context.
func LoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		ctx = context.WithValue(ctx, loggerKey, slog.Default().With(
			"method", r.Method,
			"path", r.URL.Path,
		))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// LoggerFromCtx extracts a slog.Logger from the context. Falls back to
// slog.Default() when no logger was injected.
func LoggerFromCtx(ctx context.Context) *slog.Logger {
	if l, ok := ctx.Value(loggerKey).(*slog.Logger); ok {
		return l
	}
	return slog.Default()
}
