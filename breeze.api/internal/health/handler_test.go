package health

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

type fakeDatabasePinger struct {
	err         error
	called      bool
	hasDeadline bool
	deadline    time.Time
}

func (p *fakeDatabasePinger) Ping(ctx context.Context) error {
	p.called = true
	p.deadline, p.hasDeadline = ctx.Deadline()
	return p.err
}

func TestHealthHandlerReturnsOKWhenDatabaseIsReachable(t *testing.T) {
	pinger := &fakeDatabasePinger{}
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/health", http.NoBody)

	NewHandler(pinger).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}
	if recorder.Body.String() != "ok\n" {
		t.Fatalf("expected body %q, got %q", "ok\n", recorder.Body.String())
	}
	if !pinger.called {
		t.Fatal("expected database ping")
	}
	remaining := time.Until(pinger.deadline)
	if !pinger.hasDeadline || remaining <= 0 || remaining > pingTimeout {
		t.Fatalf("expected ping deadline within %s, got %s", pingTimeout, remaining)
	}
}

func TestHealthHandlerReturnsUnavailableWhenDatabasePingFails(t *testing.T) {
	pinger := &fakeDatabasePinger{err: errors.New("private database details")}
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/health", http.NoBody)

	NewHandler(pinger).ServeHTTP(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status %d, got %d", http.StatusServiceUnavailable, recorder.Code)
	}
	if strings.Contains(recorder.Body.String(), "private database details") {
		t.Fatal("health response leaked database error details")
	}
	if !pinger.called {
		t.Fatal("expected database ping")
	}
}
