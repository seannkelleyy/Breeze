package middleware

import (
	"net/http"
	"net/http/httptest"
	"net/netip"
	"testing"
	"time"
)

func TestRateLimit_AllowsRequests(t *testing.T) {
	cfg := RateLimiterConfig{RequestsPerSecond: 100, Burst: 10}
	calls := 0
	h := RateLimit(cfg, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
	}))
	req := httptest.NewRequest(http.MethodGet, "/", http.NoBody)
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
	cfg := RateLimiterConfig{RequestsPerSecond: 1, Burst: 1}
	h := RateLimit(cfg, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))
	req := httptest.NewRequest(http.MethodGet, "/", http.NoBody)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	rec = httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("expected 429 Too Many Requests, got %d", rec.Code)
	}
}

func TestRateLimit_IgnoresUntrustedForwardedFor(t *testing.T) {
	cfg := RateLimiterConfig{RequestsPerSecond: 1, Burst: 1}
	h := RateLimit(cfg, http.HandlerFunc(func(http.ResponseWriter, *http.Request) {}))

	for i, forwardedFor := range []string{"198.51.100.1", "198.51.100.2"} {
		req := httptest.NewRequest(http.MethodGet, "/", http.NoBody)
		req.RemoteAddr = "203.0.113.10:1234"
		req.Header.Set("X-Forwarded-For", forwardedFor)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)

		want := http.StatusOK
		if i == 1 {
			want = http.StatusTooManyRequests
		}
		if rec.Code != want {
			t.Fatalf("request %d: status = %d, want %d", i+1, rec.Code, want)
		}
	}
}

func TestClientIP_UsesForwardedChainOnlyThroughTrustedProxies(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", http.NoBody)
	req.RemoteAddr = "10.1.1.3:8080"
	req.Header.Set("X-Forwarded-For", "198.51.100.4, 10.2.2.5")

	trusted := []netip.Prefix{netip.MustParsePrefix("10.0.0.0/8")}
	if got, want := clientIP(req, trusted), "198.51.100.4"; got != want {
		t.Fatalf("clientIP() = %q, want %q", got, want)
	}

	if got, want := clientIP(req, nil), "10.1.1.3"; got != want {
		t.Fatalf("clientIP() without trusted proxies = %q, want %q", got, want)
	}
}

func TestLimiterStore_BoundsClientEntries(t *testing.T) {
	store := newLimiterStore()
	cfg := RateLimiterConfig{RequestsPerSecond: 1, Burst: 1, MaxClients: 2, IdleTimeout: time.Hour}
	now := time.Now()
	store.get("one", cfg, now)
	store.get("two", cfg, now.Add(time.Second))
	store.get("three", cfg, now.Add(2*time.Second))

	if got := len(store.clients); got != 2 {
		t.Fatalf("limiter store has %d entries, want at most 2", got)
	}
	if _, exists := store.clients["one"]; exists {
		t.Fatal("expected least-recently-used client to be evicted")
	}
}

func TestLimiterStore_ExpiresIdleClients(t *testing.T) {
	store := newLimiterStore()
	cfg := RateLimiterConfig{RequestsPerSecond: 1, Burst: 1, MaxClients: 2, IdleTimeout: time.Minute}
	now := time.Now()
	store.get("one", cfg, now)
	store.get("two", cfg, now.Add(2*time.Minute))

	if _, exists := store.clients["one"]; exists {
		t.Fatal("expected idle client entry to be expired")
	}
}
