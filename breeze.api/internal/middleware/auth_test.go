package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	clerk "github.com/clerk/clerk-sdk-go/v2"
)

func TestRequireAuth_RejectsUnauthenticatedRequest(t *testing.T) {
	called := false
	h := RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", http.NoBody)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, rec.Code)
	}
	if called {
		t.Fatal("expected downstream handler not to be called")
	}
}

func TestRequireAuth_RejectsInvalidBearerToken(t *testing.T) {
	called := false
	h := RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", http.NoBody)
	req.Header.Set("Authorization", "Bearer not-a-real-token")
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	// clerkhttp.RequireHeaderAuthorization returns 403 for both missing and invalid tokens
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, rec.Code)
	}
	if called {
		t.Fatal("expected downstream handler not to be called")
	}
}

func TestDevAuth_InjectsUserIDIntoContext(t *testing.T) {
	var gotID string
	h := DevAuth("user_dev123")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotID = UserIDFromCtx(r.Context())
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", http.NoBody)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	if gotID != "user_dev123" {
		t.Fatalf("expected dev user ID %q, got %q", "user_dev123", gotID)
	}
}

func TestUserIDFromCtx_EmptyContextReturnsEmpty(t *testing.T) {
	if got := UserIDFromCtx(context.Background()); got != "" {
		t.Fatalf("expected empty user ID, got %q", got)
	}
}

func TestUserIDFromCtx_DevIDTakesPriorityOverClaims(t *testing.T) {
	claims := &clerk.SessionClaims{}
	claims.Subject = "user_clerk"
	ctx := clerk.ContextWithSessionClaims(context.Background(), claims)
	ctx = context.WithValue(ctx, devUserIDKey, "user_dev")

	if got := UserIDFromCtx(ctx); got != "user_dev" {
		t.Fatalf("expected dev user ID to win, got %q", got)
	}
}

func TestUserIDFromCtx_ReturnsClerkSubjectWhenNoDevID(t *testing.T) {
	claims := &clerk.SessionClaims{}
	claims.Subject = "user_clerk456"
	ctx := clerk.ContextWithSessionClaims(context.Background(), claims)

	if got := UserIDFromCtx(ctx); got != "user_clerk456" {
		t.Fatalf("expected Clerk subject, got %q", got)
	}
}

func TestCORS_SetsHeadersAndPassesThrough(t *testing.T) {
	called := false
	h := CORS("https://app.example.com")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", http.NoBody)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	wantHeaders := map[string]string{
		"Access-Control-Allow-Origin":  "https://app.example.com",
		"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		"Access-Control-Allow-Headers": "Authorization, Content-Type",
		"Vary":                         "Origin",
	}
	for name, want := range wantHeaders {
		if got := rec.Header().Get(name); got != want {
			t.Errorf("header %s: expected %q, got %q", name, want, got)
		}
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected downstream status %d, got %d", http.StatusOK, rec.Code)
	}
	if !called {
		t.Error("expected downstream handler to be called for non-OPTIONS request")
	}
}

func TestCORS_PreflightShortCircuits(t *testing.T) {
	called := false
	h := CORS("*")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodOptions, "/", http.NoBody)
	rec := httptest.NewRecorder()

	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected status %d for preflight, got %d", http.StatusNoContent, rec.Code)
	}
	if called {
		t.Fatal("expected downstream handler not to be called for preflight")
	}
}
