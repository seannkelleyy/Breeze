package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"golang.org/x/time/rate"
)

func TestRateLimit_AllowsRequests(t *testing.T) {
	// Reset limiter store for test isolation
	rateLimiterStore.Lock()
	rateLimiterStore.m = make(map[string]*rate.Limiter)
	rateLimiterStore.Unlock()

	cfg := RateLimiterConfig{RequestsPerSecond: 100, Burst: 10}
	calls := 0
	h := RateLimit(cfg, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
	}))
	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if calls != 1 {
		t.Errorf("expected handler to be called, got %d", calls)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200 OK, got %d", rec.Code)
	}
}

func TestRateLimit_TooManyRequests(t *testing.T) {
	// Reset limiter store for test isolation
	rateLimiterStore.Lock()
	rateLimiterStore.m = make(map[string]*rate.Limiter)
	rateLimiterStore.Unlock()

	cfg := RateLimiterConfig{RequestsPerSecond: 1, Burst: 1}
	h := RateLimit(cfg, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {}))
	req := httptest.NewRequest("GET", "/", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req) // first allowed
	rec2 := httptest.NewRecorder()
	h.ServeHTTP(rec2, req) // second should be rate limited
	if rec2.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429 Too Many Requests, got %d", rec2.Code)
	}
}
