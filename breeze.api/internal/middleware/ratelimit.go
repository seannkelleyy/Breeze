package middleware

import (
	"container/list"

	"net"
	"net/http"
	"net/netip"
	"strings"
	"sync"
	"time"

	"golang.org/x/time/rate"
)

// RateLimiterConfig holds config for the rate limiter.
type RateLimiterConfig struct {
	RequestsPerSecond float64
	Burst             int
	MaxClients        int
	IdleTimeout       time.Duration
	TrustedProxies    []netip.Prefix
}

type limiterStore struct {
	mu      sync.Mutex
	clients map[string]*list.Element
	lru     *list.List
}

type limiterEntry struct {
	key     string
	limiter *rate.Limiter
	seen    time.Time
}

func newLimiterStore() *limiterStore {
	return &limiterStore{
		clients: make(map[string]*list.Element),
		lru:     list.New(),
	}
}

func (s *limiterStore) get(ip string, cfg RateLimiterConfig, now time.Time) *rate.Limiter {
	maxClients := cfg.MaxClients
	if maxClients <= 0 {
		maxClients = 10_000
	}
	idleTimeout := cfg.IdleTimeout
	if idleTimeout <= 0 {
		idleTimeout = 10 * time.Minute
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	for oldest := s.lru.Back(); oldest != nil; oldest = s.lru.Back() {
		entry := oldest.Value.(*limiterEntry)
		if now.Sub(entry.seen) < idleTimeout {
			break
		}
		delete(s.clients, entry.key)
		s.lru.Remove(oldest)
	}

	if element, exists := s.clients[ip]; exists {
		entry := element.Value.(*limiterEntry)
		entry.seen = now
		s.lru.MoveToFront(element)
		return entry.limiter
	}

	if s.lru.Len() >= maxClients {
		oldest := s.lru.Back()
		entry := oldest.Value.(*limiterEntry)
		delete(s.clients, entry.key)
		s.lru.Remove(oldest)
	}

	entry := &limiterEntry{
		key:     ip,
		limiter: rate.NewLimiter(rate.Limit(cfg.RequestsPerSecond), cfg.Burst),
		seen:    now,
	}
	s.clients[ip] = s.lru.PushFront(entry)
	return entry.limiter
}

func remoteIP(r *http.Request) (netip.Addr, bool) {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = strings.Trim(r.RemoteAddr, "[]")
	}
	ip, err := netip.ParseAddr(host)
	if err != nil {
		return netip.Addr{}, false
	}
	return ip.Unmap(), true
}

func isTrustedProxy(ip netip.Addr, trusted []netip.Prefix) bool {
	for _, prefix := range trusted {
		if prefix.Contains(ip) {
			return true
		}
	}
	return false
}

// clientIP uses forwarded addresses only when the immediate peer is explicitly
// configured as a trusted proxy. Otherwise, client-supplied forwarding headers
// are ignored.
func clientIP(r *http.Request, trusted []netip.Prefix) string {
	peer, ok := remoteIP(r)
	if !ok {
		return "unknown"
	}
	if !isTrustedProxy(peer, trusted) {
		return peer.String()
	}

	forwarded := strings.Split(r.Header.Get("X-Forwarded-For"), ",")
	if len(forwarded) == 0 || len(forwarded) > 16 {
		return peer.String()
	}
	ips := make([]netip.Addr, 0, len(forwarded))
	for _, value := range forwarded {
		ip, err := netip.ParseAddr(strings.TrimSpace(value))
		if err != nil {
			return peer.String()
		}
		ips = append(ips, ip.Unmap())
	}

	for i := len(ips) - 1; i >= 0 && isTrustedProxy(peer, trusted); i-- {
		peer = ips[i]
	}
	return peer.String()
}

// RateLimit middleware applies a bounded, per-client token bucket.
func RateLimit(cfg RateLimiterConfig, next http.Handler) http.Handler {
	store := newLimiterStore()
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r, cfg.TrustedProxies)
		limiter := store.get(ip, cfg, time.Now())
		if !limiter.Allow() {
			http.Error(w, http.StatusText(http.StatusTooManyRequests), http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}
