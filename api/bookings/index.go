package handler

import (
	"bytes"
	"context"
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
	"github.com/jackc/pgx/v5"
)

// ============================================================
// MODELS
// ============================================================

// Booking represents a booking record from the database.
type Booking struct {
	ID          string  `json:"id"`
	ClientName  string  `json:"client_name"`
	ClientEmail string  `json:"client_email"`
	Phone       *string `json:"phone,omitempty"`
	Service     *string `json:"service,omitempty"`
	Date        string  `json:"date"`
	TimeSlot    string  `json:"time_slot"`
	Notes       *string `json:"notes,omitempty"`
	Status      string  `json:"status"`
	CreatedAt   string  `json:"created_at"`
}

type bookingRequest struct {
	ClientName  string  `json:"client_name"`
	ClientEmail string  `json:"client_email"`
	Phone       *string `json:"phone,omitempty"`
	Service     *string `json:"service,omitempty"`
	Date        string  `json:"date"`
	TimeSlot    string  `json:"time_slot"`
	Notes       *string `json:"notes,omitempty"`
	Status      *string `json:"status,omitempty"`
}

type bookingsResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// ============================================================
// HANDLER (entrypoint)
// ============================================================

// Handler is the Vercel serverless entrypoint for /api/bookings.
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		writeJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Database not configured"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Invalid database URL"})
		return
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "DB connection error: %v\n", err)
		writeJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Database connection failed: " + err.Error()})
		return
	}
	defer conn.Close(ctx)

	switch r.Method {
	case http.MethodGet:
		handleGetBookings(ctx, conn, w, r)
	case http.MethodPost:
		handleCreateBooking(ctx, conn, w, r)
	case http.MethodPut:
		handleUpdateBooking(ctx, conn, w, r)
	case http.MethodDelete:
		handleDeleteBooking(ctx, conn, w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, bookingsResponse{Error: "Method not allowed"})
	}
}

// ============================================================
// CRUD OPERATIONS
// ============================================================

func handleGetBookings(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	date := r.URL.Query().Get("date")

	if id != "" {
		row := conn.QueryRow(ctx,
			"SELECT id, client_name, client_email, phone, service, date, time_slot, notes, status, created_at FROM bookings WHERE id = $1", id)
		var b Booking
		var createdAt time.Time
		var bDate time.Time
		err := row.Scan(&b.ID, &b.ClientName, &b.ClientEmail, &b.Phone, &b.Service, &bDate, &b.TimeSlot, &b.Notes, &b.Status, &createdAt)
		if err != nil {
			writeJSON(w, http.StatusNotFound, bookingsResponse{Error: "Booking not found"})
			return
		}
		b.Date = bDate.Format("2006-01-02")
		b.CreatedAt = createdAt.Format(time.RFC3339)
		writeJSON(w, http.StatusOK, bookingsResponse{Data: b})
		return
	}

	var query string
	var args []interface{}
	if date != "" {
		query = "SELECT id, client_name, client_email, phone, service, date, time_slot, notes, status, created_at FROM bookings WHERE date = $1 ORDER BY time_slot ASC"
		args = []interface{}{date}
	} else {
		query = "SELECT id, client_name, client_email, phone, service, date, time_slot, notes, status, created_at FROM bookings ORDER BY date ASC, time_slot ASC"
	}

	rows, err := conn.Query(ctx, query, args...)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Query error: %v\n", err)
		writeJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Failed to fetch bookings: " + err.Error()})
		return
	}
	defer rows.Close()

	var bookings []Booking
	for rows.Next() {
		var b Booking
		var createdAt time.Time
		var d time.Time
		if err := rows.Scan(&b.ID, &b.ClientName, &b.ClientEmail, &b.Phone, &b.Service, &d, &b.TimeSlot, &b.Notes, &b.Status, &createdAt); err != nil {
			continue
		}
		b.Date = d.Format("2006-01-02")
		b.CreatedAt = createdAt.Format(time.RFC3339)
		bookings = append(bookings, b)
	}
	if bookings == nil {
		bookings = []Booking{}
	}
	writeJSON(w, http.StatusOK, bookingsResponse{Data: bookings})
}

func handleCreateBooking(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	var req bookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, bookingsResponse{Error: "Invalid request body"})
		return
	}

	if req.ClientName == "" || req.ClientEmail == "" || req.Date == "" || req.TimeSlot == "" {
		writeJSON(w, http.StatusBadRequest, bookingsResponse{Error: "client_name, client_email, date, and time_slot are required"})
		return
	}

	// Check if time slot is already taken
	var existingCount int
	err := conn.QueryRow(ctx,
		"SELECT COUNT(*) FROM bookings WHERE date = $1 AND time_slot = $2 AND status != 'cancelled'",
		req.Date, req.TimeSlot,
	).Scan(&existingCount)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Failed to check availability"})
		return
	}
	if existingCount > 0 {
		writeJSON(w, http.StatusConflict, bookingsResponse{Error: "This time slot is already booked"})
		return
	}

	var id string
	var createdAt time.Time
	err = conn.QueryRow(ctx,
		`INSERT INTO bookings (client_name, client_email, phone, service, date, time_slot, notes)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, created_at`,
		req.ClientName, req.ClientEmail, req.Phone, req.Service, req.Date, req.TimeSlot, req.Notes,
	).Scan(&id, &createdAt)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Failed to create booking"})
		return
	}

	// Sync to Google Calendar
	service := "Wizyta"
	if req.Service != nil && *req.Service != "" {
		service = *req.Service
	}
	if calErr := createCalendarEvent(req.ClientName, service, req.Date, req.TimeSlot); calErr != nil {
		fmt.Fprintf(os.Stderr, "Google Calendar sync error: %v\n", calErr)
	}

	// Send confirmation email
	if emailErr := sendBookingConfirmation(req.ClientEmail, req.ClientName, req.Date, req.TimeSlot, service); emailErr != nil {
		fmt.Fprintf(os.Stderr, "Booking confirmation email error: %v\n", emailErr)
	}

	writeJSON(w, http.StatusCreated, bookingsResponse{
		Data:    map[string]string{"id": id, "created_at": createdAt.Format(time.RFC3339)},
		Message: "Booking created successfully",
	})
}

func handleUpdateBooking(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, bookingsResponse{Error: "id query parameter is required"})
		return
	}

	var req bookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, bookingsResponse{Error: "Invalid request body"})
		return
	}

	var setClauses []string
	var args []interface{}
	argIdx := 1

	if req.ClientName != "" {
		setClauses = append(setClauses, fmt.Sprintf("client_name = $%d", argIdx))
		args = append(args, req.ClientName)
		argIdx++
	}
	if req.ClientEmail != "" {
		setClauses = append(setClauses, fmt.Sprintf("client_email = $%d", argIdx))
		args = append(args, req.ClientEmail)
		argIdx++
	}
	if req.Phone != nil {
		setClauses = append(setClauses, fmt.Sprintf("phone = $%d", argIdx))
		args = append(args, *req.Phone)
		argIdx++
	}
	if req.Service != nil {
		setClauses = append(setClauses, fmt.Sprintf("service = $%d", argIdx))
		args = append(args, *req.Service)
		argIdx++
	}
	if req.Date != "" {
		setClauses = append(setClauses, fmt.Sprintf("date = $%d", argIdx))
		args = append(args, req.Date)
		argIdx++
	}
	if req.TimeSlot != "" {
		setClauses = append(setClauses, fmt.Sprintf("time_slot = $%d", argIdx))
		args = append(args, req.TimeSlot)
		argIdx++
	}
	if req.Notes != nil {
		setClauses = append(setClauses, fmt.Sprintf("notes = $%d", argIdx))
		args = append(args, *req.Notes)
		argIdx++
	}
	if req.Status != nil {
		setClauses = append(setClauses, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}

	if len(setClauses) == 0 {
		writeJSON(w, http.StatusBadRequest, bookingsResponse{Error: "No fields to update"})
		return
	}

	query := "UPDATE bookings SET " + strings.Join(setClauses, ", ") + fmt.Sprintf(" WHERE id = $%d", argIdx)
	args = append(args, id)

	tag, err := conn.Exec(ctx, query, args...)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Failed to update booking"})
		return
	}
	if tag.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, bookingsResponse{Error: "Booking not found"})
		return
	}
	writeJSON(w, http.StatusOK, bookingsResponse{Message: "Booking updated successfully"})
}

func handleDeleteBooking(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, bookingsResponse{Error: "id query parameter is required"})
		return
	}

	tag, err := conn.Exec(ctx, "DELETE FROM bookings WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Failed to delete booking"})
		return
	}
	if tag.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, bookingsResponse{Error: "Booking not found"})
		return
	}
	writeJSON(w, http.StatusOK, bookingsResponse{Message: "Booking deleted successfully"})
}

// ============================================================
// GOOGLE CALENDAR SYNC
// ============================================================

func createCalendarEvent(clientName, service, date, timeSlot string) error {
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
	loc, _ := time.LoadLocation("Europe/Warsaw")
	startTime = time.Date(startTime.Year(), startTime.Month(), startTime.Day(), startTime.Hour(), startTime.Minute(), 0, 0, loc)
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
	calReq, err := http.NewRequest("POST", url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	calReq.Header.Set("Authorization", "Bearer "+token)
	calReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(calReq)
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

// ============================================================
// EMAIL NOTIFICATIONS
// ============================================================

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
		"to":      []string{toEmail},
		"subject": subject,
		"html":    htmlBody,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	emailReq, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}
	emailReq.Header.Set("Authorization", "Bearer "+apiKey)
	emailReq.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(emailReq)
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

// ============================================================
// HELPERS
// ============================================================

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
