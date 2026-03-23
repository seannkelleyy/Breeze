package config

import (
	"log"
	"os"
)

type Config struct {
	DatabaseURL    string
	ClerkSecretKey string
	Port           string
	Env            string
}

func Load() *Config {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable not set")
	}

	clerkKey := os.Getenv("CLERK_SECRET_KEY")
	if clerkKey == "" {
		log.Fatal("CLERK_SECRET_KEY environment variable not set")
	}

	env := os.Getenv("ENV")

	return &Config{
		DatabaseURL:    dbURL,
		ClerkSecretKey: clerkKey,
		Port:           os.Getenv("PORT"), // Optional, defaults to 8080 in main.go
		Env:            env,
	}
}
