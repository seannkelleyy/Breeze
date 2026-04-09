package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequireAuth_RejectsUnauthenticatedRequest(t *testing.T) {
	called := false
	h := RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, rec.Code)
	}
	if called {
		t.Fatal("expected downstream handler not to be called")
	}
}
