package handler

import (
	"bytes"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// CreateCalendarEvent adds a booking event to Google Calendar.
func CreateCalendarEvent(clientName, service, date, timeSlot string) error {
	calendarID := os.Getenv("GOOGLE_CALENDAR_ID")
	serviceEmail := os.Getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL")
	privateKeyPEM := os.Getenv("GOOGLE_PRIVATE_KEY")

	if calendarID == "" || serviceEmail == "" || privateKeyPEM == "" {
		return fmt.Errorf("Google Calendar not configured")
	}

	token, err := getGoogleAccessToken(serviceEmail, privateKeyPEM)
	if err != nil {
		return fmt.Errorf("failed to get access token: %w", err)
	}

	startTime, err := time.Parse("2006-01-02 15:04", date+" "+timeSlot)
	if err != nil {
		return fmt.Errorf("failed to parse date/time: %w", err)
	}
	endTime := startTime.Add(50 * time.Minute)

	summary := fmt.Sprintf("%s - %s", clientName, service)
	event := map[string]interface{}{
		"summary": summary,
		"start": map[string]string{
			"dateTime": startTime.Format(time.RFC3339),
			"timeZone": "Europe/Warsaw",
		},
		"end": map[string]string{
			"dateTime": endTime.Format(time.RFC3339),
			"timeZone": "Europe/Warsaw",
		},
	}

	body, _ := json.Marshal(event)

	url := fmt.Sprintf("https://www.googleapis.com/calendar/v3/calendars/%s/events", calendarID)
	req, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Google Calendar API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func getGoogleAccessToken(serviceEmail, privateKeyPEM string) (string, error) {
	privateKeyPEM = strings.ReplaceAll(privateKeyPEM, "\\n", "\n")

	block, _ := pem.Decode([]byte(privateKeyPEM))
	if block == nil {
		return "", fmt.Errorf("failed to decode PEM block")
	}

	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return "", fmt.Errorf("failed to parse private key: %w", err)
	}

	rsaKey, ok := key.(*rsa.PrivateKey)
	if !ok {
		return "", fmt.Errorf("key is not RSA")
	}

	now := time.Now()
	claims := jwt.MapClaims{
		"iss":   serviceEmail,
		"scope": "https://www.googleapis.com/auth/calendar.events",
		"aud":   "https://oauth2.googleapis.com/token",
		"iat":   now.Unix(),
		"exp":   now.Add(time.Hour).Unix(),
	}

	jwtToken := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	signedJWT, err := jwtToken.SignedString(rsaKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign JWT: %w", err)
	}

	resp, err := http.PostForm("https://oauth2.googleapis.com/token", map[string][]string{
		"grant_type": {"urn:ietf:params:oauth:grant-type:jwt-bearer"},
		"assertion":  {signedJWT},
	})
	if err != nil {
		return "", fmt.Errorf("token exchange failed: %w", err)
	}
	defer resp.Body.Close()

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		Error       string `json:"error"`
	}
	json.NewDecoder(resp.Body).Decode(&tokenResp)

	if tokenResp.Error != "" {
		return "", fmt.Errorf("token error: %s", tokenResp.Error)
	}

	return tokenResp.AccessToken, nil
}
