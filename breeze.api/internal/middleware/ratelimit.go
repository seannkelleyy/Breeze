package middleware

import (
	"log/slog"
	"net/http"
	"sync"

	"golang.org/x/time/rate"
)

// RateLimiterConfig holds config for the rate limiter.
type RateLimiterConfig struct {
	RequestsPerSecond float64
	Burst             int
}

// rateLimiterStore stores limiters per client (by IP).
var rateLimiterStore = struct {
	m map[string]*rate.Limiter
	sync.Mutex
}{m: make(map[string]*rate.Limiter)}

func getIP(r *http.Request) string {
	if forwarded := r.Header.Get("X-Forwarded-For"); forwarded != "" {
		return forwarded
	}
	return r.RemoteAddr
}

// getLimiter returns the rate limiter for a given IP, creating it if needed.
func getLimiter(ip string, cfg RateLimiterConfig) *rate.Limiter {
	rateLimiterStore.Lock()
	defer rateLimiterStore.Unlock()
	limiter, exists := rateLimiterStore.m[ip]
	if !exists {
		limiter = rate.NewLimiter(rate.Limit(cfg.RequestsPerSecond), cfg.Burst)
		rateLimiterStore.m[ip] = limiter
	}
	return limiter
}

// RateLimit middleware applies rate limiting per client IP.
func RateLimit(cfg RateLimiterConfig, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := getIP(r)
		limiter := getLimiter(ip, cfg)
		if !limiter.Allow() {
			slog.Warn("rate limit exceeded", "ip", ip)
			http.Error(w, http.StatusText(http.StatusTooManyRequests), http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}
