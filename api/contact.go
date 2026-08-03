package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
	"os"
	"regexp"
)

type contactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
}

type contactResponse struct {
	Success bool   `json:"success,omitempty"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	// CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, contactResponse{Error: "Method not allowed"})
		return
	}

	var req contactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, contactResponse{Error: "Invalid request body"})
		return
	}

	if req.Name == "" || req.Email == "" || req.Message == "" {
		writeJSON(w, http.StatusBadRequest, contactResponse{Error: "All fields are required"})
		return
	}

	emailRegex := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	if !emailRegex.MatchString(req.Email) {
		writeJSON(w, http.StatusBadRequest, contactResponse{Error: "Invalid email address"})
		return
	}

	if err := sendEmail(req.Name, req.Email, req.Message); err != nil {
		fmt.Fprintf(os.Stderr, "Email error: %v\n", err)
		writeJSON(w, http.StatusInternalServerError, contactResponse{Error: "Failed to send email"})
		return
	}

	writeJSON(w, http.StatusOK, contactResponse{Success: true, Message: "Email sent successfully"})
}

func sendEmail(name, email, message string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	emailFrom := os.Getenv("EMAIL_FROM")
	emailTo := os.Getenv("EMAIL_TO")

	if apiKey == "" || emailFrom == "" || emailTo == "" {
		return fmt.Errorf("missing email configuration")
	}

	subject := fmt.Sprintf("New Contact Form Submission from %s", name)
	htmlBody := fmt.Sprintf(`<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> %s</p>
<p><strong>Email:</strong> %s</p>
<p><strong>Message:</strong></p>
<p>%s</p>`, html.EscapeString(name), html.EscapeString(email), html.EscapeString(message))

	payload := map[string]interface{}{
		"from":     emailFrom,
		"to":       []string{emailTo},
		"subject":  subject,
		"html":     htmlBody,
		"reply_to": email,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal payload: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
