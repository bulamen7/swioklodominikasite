package handler

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

type reminder struct {
	ClientName  string
	ClientEmail string
	Date        string
	TimeSlot    string
	Service     string
}

// Handler sends reminder emails for tomorrow's bookings.
// Called by Vercel Cron daily at 18:00 (evening before appointment).
func Handler(w http.ResponseWriter, r *http.Request) {
	// Verify cron secret to prevent unauthorized calls
	cronSecret := os.Getenv("CRON_SECRET")
	if cronSecret != "" && r.Header.Get("Authorization") != "Bearer "+cronSecret {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		http.Error(w, "Database not configured", http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		http.Error(w, "Invalid database URL", http.StatusInternalServerError)
		return
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		http.Error(w, "Database connection failed", http.StatusInternalServerError)
		return
	}
	defer conn.Close(ctx)

	// Get tomorrow's date in Warsaw timezone
	loc, _ := time.LoadLocation("Europe/Warsaw")
	tomorrow := time.Now().In(loc).Add(24 * time.Hour).Format("2006-01-02")

	// Fetch confirmed/pending bookings for tomorrow
	rows, err := conn.Query(ctx,
		"SELECT client_name, client_email, date, time_slot, COALESCE(service, 'Wizyta') FROM bookings WHERE date = $1 AND status IN ('confirmed', 'pending') ORDER BY time_slot ASC",
		tomorrow)
	if err != nil {
		http.Error(w, "Query failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var reminders []reminder
	for rows.Next() {
		var r reminder
		var d time.Time
		if err := rows.Scan(&r.ClientName, &r.ClientEmail, &d, &r.TimeSlot, &r.Service); err != nil {
			continue
		}
		r.Date = d.Format("2006-01-02")
		reminders = append(reminders, r)
	}

	// Send reminder emails
	sent := 0
	for _, rem := range reminders {
		if err := sendReminderEmail(rem); err != nil {
			fmt.Fprintf(os.Stderr, "Reminder error for %s: %v\n", rem.ClientEmail, err)
		} else {
			sent++
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    fmt.Sprintf("Sent %d reminders for %s", sent, tomorrow),
		"total":      len(reminders),
		"sent":       sent,
		"date":       tomorrow,
	})
}

func sendReminderEmail(rem reminder) error {
	apiKey := os.Getenv("RESEND_API_KEY")
	emailFrom := os.Getenv("EMAIL_FROM")

	if apiKey == "" || emailFrom == "" {
		return fmt.Errorf("email not configured")
	}

	subject := fmt.Sprintf("Przypomnienie: wizyta jutro o %s", rem.TimeSlot)
	htmlBody := fmt.Sprintf(`
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2d5f5d;">Przypomnienie o wizycie</h2>
  <p>Dzien dobry %s,</p>
  <p>Przypominamy o jutrzejszej wizycie:</p>
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
  </table>
  <p style="color: #6c757d; font-size: 14px;">Adres: Warszawa, ul. Odolanska 10</p>
  <p style="color: #6c757d; font-size: 14px;">W razie pytan: +48 797 194 841</p>
  <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
  <p style="color: #999; font-size: 12px;">Gabinet Fizjoterapii Dominika Swioklo</p>
</div>`, rem.ClientName, rem.Date, rem.TimeSlot, rem.Service)

	payload := map[string]interface{}{
		"from":    emailFrom,
		"to":     []string{rem.ClientEmail},
		"subject": subject,
		"html":    htmlBody,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend error (status %d): %s", resp.StatusCode, string(respBody))
	}
	return nil
}
