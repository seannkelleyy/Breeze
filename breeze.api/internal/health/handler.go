package health

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

const pingTimeout = 2 * time.Second

type Pinger interface {
	Ping(context.Context) error
}

func NewHandler(pinger Pinger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), pingTimeout)
		defer cancel()

		if err := pinger.Ping(ctx); err != nil {
			slog.Error("health check database ping failed", "error", err)
			http.Error(w, "unavailable", http.StatusServiceUnavailable)
			return
		}

		w.WriteHeader(http.StatusOK)
		if _, err := fmt.Fprintln(w, "ok"); err != nil {
			slog.Error("health check write error", "error", err)
		}
	}
}
