package config

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad_ReturnsConfigFromEnv(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db")
	t.Setenv("CLERK_SECRET_KEY", "secret")
	t.Setenv("ENV", "test")
	t.Setenv("PORT", "1234")
	t.Setenv("TRUSTED_PROXY_CIDRS", "10.0.0.0/8, 192.168.1.0/24")
	t.Setenv("API_RATE_LIMIT_RPS", "12.5")
	t.Setenv("API_RATE_LIMIT_BURST", "24")
	cfg := Load()
	assert.Equal(t, "postgres://user:pass@localhost:5432/db", cfg.DatabaseURL)
	assert.Equal(t, "secret", cfg.ClerkSecretKey)
	assert.Equal(t, "test", cfg.Env)
	assert.Equal(t, "1234", cfg.Port)
	assert.Equal(t, 2, len(cfg.TrustedProxyCIDRs))
	assert.Equal(t, "10.0.0.0/8", cfg.TrustedProxyCIDRs[0].String())
	assert.Equal(t, 12.5, cfg.RateLimitRPS)
	assert.Equal(t, 24, cfg.RateLimitBurst)
}

func TestIsLocalEnv(t *testing.T) {
	tests := []struct {
		name string
		env  string
		want bool
	}{
		{name: "empty", env: "", want: false},
		{name: "local", env: "local", want: true},
		{name: "development", env: "development", want: true},
		{name: "dev", env: "dev", want: true},
		{name: "production", env: "production", want: false},
		{name: "staging", env: "staging", want: false},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, tc.want, IsLocalEnv(tc.env))
		})
	}
}
