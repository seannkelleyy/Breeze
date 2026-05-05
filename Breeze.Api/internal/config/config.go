package config

import (
	"log"
	"os"
	"strings"
)

type Config struct {
	DatabaseURL    string
	ClerkSecretKey string
	Port           string
	Env            string
	SentryDSN      string
	PlaidClientID  string
	PlaidSecret    string
	PlaidEnv       string
}

func Load() *Config {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	env := os.Getenv("ENV")

	clerkKey := os.Getenv("CLERK_SECRET_KEY")
	if !IsLocalEnv(env) && clerkKey == "" {
		log.Fatal("CLERK_SECRET_KEY environment variable not set")
	}

	return &Config{
		DatabaseURL:    dbURL,
		ClerkSecretKey: clerkKey,
		Port:           os.Getenv("PORT"), // Optional, defaults to 8080 in main.go
		Env:            env,
		SentryDSN:      os.Getenv("SENTRY_DSN"), // Optional, only needed if using Sentry
		PlaidClientID:  os.Getenv("PLAID_CLIENT_ID"),
		PlaidSecret:    os.Getenv("PLAID_SECRET"),
		PlaidEnv:       os.Getenv("PLAID_ENV"),
	}
}

// IsLocalEnv reports whether middleware requiring auth/rate limit should be skipped.
func (c *Config) IsLocalEnv() bool {
	return IsLocalEnv(c.Env)
}

// IsLocalEnv reports whether the given environment should be treated as local/dev.
func IsLocalEnv(env string) bool {
	switch strings.ToLower(strings.TrimSpace(env)) {
	case "", "local", "development", "dev":
		return true
	default:
		return false
	}
}
