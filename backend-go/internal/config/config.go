package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all application configuration.
type Config struct {
	Port      int
	SMTP      SMTPConfig
	EmailTo   string
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

	var missing []string

	smtpHost := getEnvRequired("SMTP_HOST", &missing)
	smtpUser := getEnvRequired("SMTP_USER", &missing)
	smtpPass := getEnvRequired("SMTP_PASS", &missing)
	emailFrom := getEnvRequired("EMAIL_FROM", &missing)
	emailTo := getEnvRequired("EMAIL_TO", &missing)

	if len(missing) > 0 {
		return nil, fmt.Errorf("missing required environment variables: %v", missing)
	}

	cfg := &Config{
		Port: port,
		SMTP: SMTPConfig{
			Host: smtpHost,
			Port: smtpPort,
			User: smtpUser,
			Pass: smtpPass,
		},
		EmailFrom: emailFrom,
		EmailTo:   emailTo,
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}

func getEnvRequired(key string, missing *[]string) string {
	val := os.Getenv(key)
	if val == "" {
		*missing = append(*missing, key)
	}
	return val
}
