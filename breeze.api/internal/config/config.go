package config

import (
	"log"
	"math"
	"net/netip"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	DatabaseURL       string
	ClerkSecretKey    string
	Port              string
	Env               string
	SentryDSN         string
	PlaidClientID     string
	PlaidSecret       string
	PlaidEnv          string
	AllowedOrigin     string
	TrustedProxyCIDRs []netip.Prefix
	RateLimitRPS      float64
	RateLimitBurst    int
}

func Load() *Config {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	env := strings.TrimSpace(os.Getenv("ENV"))
	if env == "" {
		log.Fatal("ENV environment variable not set (use local, development, dev, staging, or production)")
	}

	clerkKey := strings.TrimSpace(os.Getenv("CLERK_SECRET_KEY"))
	if clerkKey == "" {
		log.Fatal("CLERK_SECRET_KEY environment variable not set")
	}

	trustedProxyCIDRs, err := parseTrustedProxyCIDRs(os.Getenv("TRUSTED_PROXY_CIDRS"))
	if err != nil {
		log.Fatalf("invalid TRUSTED_PROXY_CIDRS: %v", err)
	}

	rateLimitRPS := 30.0
	if value := os.Getenv("API_RATE_LIMIT_RPS"); value != "" {
		parsed, err := strconv.ParseFloat(value, 64)
		if err != nil || parsed <= 0 || math.IsNaN(parsed) || math.IsInf(parsed, 0) {
			log.Fatalf("API_RATE_LIMIT_RPS must be a positive finite number")
		}
		rateLimitRPS = parsed
	}

	rateLimitBurst := 60
	if value := os.Getenv("API_RATE_LIMIT_BURST"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed <= 0 {
			log.Fatalf("API_RATE_LIMIT_BURST must be a positive integer")
		}
		rateLimitBurst = parsed
	}

	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
		allowedOrigin = "http://localhost:3000"
	}

	return &Config{
		DatabaseURL:       dbURL,
		ClerkSecretKey:    clerkKey,
		Port:              os.Getenv("PORT"), // Optional, defaults to 8080 in main.go
		Env:               env,
		SentryDSN:         os.Getenv("SENTRY_DSN"), // Optional, only needed if using Sentry
		PlaidClientID:     os.Getenv("PLAID_CLIENT_ID"),
		PlaidSecret:       os.Getenv("PLAID_SECRET"),
		PlaidEnv:          os.Getenv("PLAID_ENV"),
		AllowedOrigin:     allowedOrigin,
		TrustedProxyCIDRs: trustedProxyCIDRs,
		RateLimitRPS:      rateLimitRPS,
		RateLimitBurst:    rateLimitBurst,
	}
}

// IsLocalEnv reports whether development-only behavior, such as skipping rate limiting, is enabled.
func (c *Config) IsLocalEnv() bool {
	return IsLocalEnv(c.Env)
}

// IsLocalEnv reports whether the given environment should be treated as local/dev.
func IsLocalEnv(env string) bool {
	switch strings.ToLower(strings.TrimSpace(env)) {
	case "local", "development", "dev":
		return true
	default:
		return false
	}
}

func parseTrustedProxyCIDRs(value string) ([]netip.Prefix, error) {
	if strings.TrimSpace(value) == "" {
		return nil, nil
	}

	var prefixes []netip.Prefix
	for _, item := range strings.Split(value, ",") {
		prefix, err := netip.ParsePrefix(strings.TrimSpace(item))
		if err != nil {
			return nil, err
		}
		prefixes = append(prefixes, prefix.Masked())
	}
	return prefixes, nil
}
