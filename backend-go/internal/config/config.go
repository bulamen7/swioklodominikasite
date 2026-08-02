package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all application configuration.
type Config struct {
	Port     int
	SMTP     SMTPConfig
	EmailTo  string
	EmailFrom string
}

// SMTPConfig holds SMTP server settings.
type SMTPConfig struct {
	Host string
	Port int
	User string
	Pass string
}

// Load reads configuration from environment variables (and .env file if present).
func Load() (*Config, error) {
	// Load .env file if it exists (ignore error if not found)
	_ = godotenv.Load()

	port, err := strconv.Atoi(getEnv("PORT", "3001"))
	if err != nil {
		return nil, fmt.Errorf("invalid PORT: %w", err)
	}

	smtpPort, err := strconv.Atoi(getEnv("SMTP_PORT", "587"))
	if err != nil {
		return nil, fmt.Errorf("invalid SMTP_PORT: %w", err)
	}

	cfg := &Config{
		Port: port,
		SMTP: SMTPConfig{
			Host: getEnvRequired("SMTP_HOST"),
			Port: smtpPort,
			User: getEnvRequired("SMTP_USER"),
			Pass: getEnvRequired("SMTP_PASS"),
		},
		EmailFrom: getEnvRequired("EMAIL_FROM"),
		EmailTo:   getEnvRequired("EMAIL_TO"),
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvRequired(key string) string {
	val := os.Getenv(key)
	if val == "" {
		fmt.Printf("WARNING: required env var %s is not set\n", key)
	}
	return val
}
