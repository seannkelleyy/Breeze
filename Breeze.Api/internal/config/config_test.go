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
