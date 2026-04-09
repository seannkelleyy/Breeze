package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoad_ReturnsConfigFromEnv(t *testing.T) {
	os.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/db")
	os.Setenv("CLERK_SECRET_KEY", "secret")
	os.Setenv("ENV", "test")
	os.Setenv("PORT", "1234")
	cfg := Load()
	assert.Equal(t, "postgres://user:pass@localhost:5432/db", cfg.DatabaseURL)
	assert.Equal(t, "secret", cfg.ClerkSecretKey)
	assert.Equal(t, "test", cfg.Env)
	assert.Equal(t, "1234", cfg.Port)
}

func TestIsLocalEnv(t *testing.T) {
	tests := []struct {
		name string
		env  string
		want bool
	}{
		{name: "empty", env: "", want: true},
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
