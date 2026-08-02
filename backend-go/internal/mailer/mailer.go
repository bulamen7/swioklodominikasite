package mailer

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"io"
	"net/http"
)

// Mailer handles sending emails via Resend API.
type Mailer struct {
	apiKey string
	from   string
}

// New creates a new Mailer instance.
func New(apiKey, from string) *Mailer {
	return &Mailer{
		apiKey: apiKey,
		from:   from,
	}
}

// SendContact sends a contact form email via Resend.
func (m *Mailer) SendContact(to, name, email, message string) error {
	subject := fmt.Sprintf("New Contact Form Submission from %s", name)
	htmlBody := buildHTMLEmail(name, email, message)

	payload := map[string]interface{}{
		"from":     m.from,
		"to":       []string{to},
		"subject":  subject,
		"html":     htmlBody,
		"reply_to": email,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend API error (status %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}

func buildHTMLEmail(name, email, message string) string {
	return fmt.Sprintf(`<h3>New Contact Form Submission</h3>
<p><strong>Name:</strong> %s</p>
<p><strong>Email:</strong> %s</p>
<p><strong>Message:</strong></p>
<p>%s</p>`, html.EscapeString(name), html.EscapeString(email), html.EscapeString(message))
}
