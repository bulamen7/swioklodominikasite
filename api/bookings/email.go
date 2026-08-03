package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

// sendBookingConfirmation sends a confirmation email to the patient after booking.
func sendBookingConfirmation(toEmail, clientName, date, timeSlot, service string) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	emailFrom := os.Getenv("EMAIL_FROM")

	if apiKey == "" || emailFrom == "" {
		return fmt.Errorf("email not configured")
	}

	subject := "Potwierdzenie rezerwacji wizyty"
	htmlBody := fmt.Sprintf(`
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2d5f5d;">Potwierdzenie rezerwacji</h2>
  <p>Dzien dobry %s,</p>
  <p>Twoja wizyta zostala zarezerwowana pomyslnie. Ponizej szczegoly:</p>
  <table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">
    <tr style="background: #f8f9fa;">
      <td style="padding: 12px; font-weight: bold; border: 1px solid #dee2e6;">Data</td>
      <td style="padding: 12px; border: 1px solid #dee2e6;">%s</td>
    </tr>
    <tr>
      <td style="padding: 12px; font-weight: bold; border: 1px solid #dee2e6;">Godzina</td>
      <td style="padding: 12px; border: 1px solid #dee2e6;">%s</td>
    </tr>
    <tr style="background: #f8f9fa;">
      <td style="padding: 12px; font-weight: bold; border: 1px solid #dee2e6;">Usluga</td>
      <td style="padding: 12px; border: 1px solid #dee2e6;">%s</td>
    </tr>
    <tr>
      <td style="padding: 12px; font-weight: bold; border: 1px solid #dee2e6;">Cena</td>
      <td style="padding: 12px; border: 1px solid #dee2e6;">150 zl</td>
    </tr>
  </table>
  <p style="color: #6c757d; font-size: 14px;">Adres: Warszawa, ul. Odolanska 10</p>
  <p style="color: #6c757d; font-size: 14px;">W razie pytan prosimy o kontakt: +48 797 194 841</p>
  <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Gabinet Fizjoterapii Dominika Swioklo</p>
</div>`, clientName, date, timeSlot, service)

	payload := map[string]interface{}{
		"from":    emailFrom,
		"to":     []string{toEmail},
		"subject": subject,
		"html":    htmlBody,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
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
