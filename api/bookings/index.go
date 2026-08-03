package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

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
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Database not configured"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Invalid database URL"})
		return
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "DB connection error: %v\n", err)
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Database connection failed: " + err.Error()})
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
		writeBookingsJSON(w, http.StatusMethodNotAllowed, bookingsResponse{Error: "Method not allowed"})
	}
}

func handleGetBookings(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	// GET /api/bookings?id=xxx — single booking
	// GET /api/bookings?date=xxx — bookings for a date
	// GET /api/bookings — all bookings
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
			writeBookingsJSON(w, http.StatusNotFound, bookingsResponse{Error: "Booking not found"})
			return
		}
		b.Date = bDate.Format("2006-01-02")
		b.CreatedAt = createdAt.Format(time.RFC3339)
		writeBookingsJSON(w, http.StatusOK, bookingsResponse{Data: b})
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
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Failed to fetch bookings: " + err.Error()})
		return
	}
	defer rows.Close()

	var bookings []Booking
	for rows.Next() {
		var b Booking
		var createdAt time.Time
		var date time.Time
		if err := rows.Scan(&b.ID, &b.ClientName, &b.ClientEmail, &b.Phone, &b.Service, &date, &b.TimeSlot, &b.Notes, &b.Status, &createdAt); err != nil {
			continue
		}
		b.Date = date.Format("2006-01-02")
		b.CreatedAt = createdAt.Format(time.RFC3339)
		bookings = append(bookings, b)
	}

	if bookings == nil {
		bookings = []Booking{}
	}

	writeBookingsJSON(w, http.StatusOK, bookingsResponse{Data: bookings})
}

func handleCreateBooking(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	var req bookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeBookingsJSON(w, http.StatusBadRequest, bookingsResponse{Error: "Invalid request body"})
		return
	}

	if req.ClientName == "" || req.ClientEmail == "" || req.Date == "" || req.TimeSlot == "" {
		writeBookingsJSON(w, http.StatusBadRequest, bookingsResponse{Error: "client_name, client_email, date, and time_slot are required"})
		return
	}

	// Check if time slot is already taken (exclude cancelled bookings)
	var existingCount int
	err := conn.QueryRow(ctx,
		"SELECT COUNT(*) FROM bookings WHERE date = $1 AND time_slot = $2 AND status != 'cancelled'",
		req.Date, req.TimeSlot,
	).Scan(&existingCount)
	if err != nil {
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Failed to check availability"})
		return
	}
	if existingCount > 0 {
		writeBookingsJSON(w, http.StatusConflict, bookingsResponse{Error: "This time slot is already booked"})
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
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Failed to create booking"})
		return
	}

	// Sync to Google Calendar (non-blocking — don't fail booking if calendar sync fails)
	service := "Wizyta"
	if req.Service != nil && *req.Service != "" {
		service = *req.Service
	}
	if calErr := CreateCalendarEvent(req.ClientName, service, req.Date, req.TimeSlot); calErr != nil {
		fmt.Fprintf(os.Stderr, "Google Calendar sync error: %v\n", calErr)
	}

	writeBookingsJSON(w, http.StatusCreated, bookingsResponse{
		Data:    map[string]string{"id": id, "created_at": createdAt.Format(time.RFC3339)},
		Message: "Booking created successfully",
	})
}

func handleUpdateBooking(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeBookingsJSON(w, http.StatusBadRequest, bookingsResponse{Error: "id query parameter is required"})
		return
	}

	var req bookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeBookingsJSON(w, http.StatusBadRequest, bookingsResponse{Error: "Invalid request body"})
		return
	}

	// Build dynamic update query
	var setClauses []string
	var args []interface{}
	argIdx := 1

	if req.ClientName != "" {
		setClauses = append(setClauses, "client_name = $"+itoa(argIdx))
		args = append(args, req.ClientName)
		argIdx++
	}
	if req.ClientEmail != "" {
		setClauses = append(setClauses, "client_email = $"+itoa(argIdx))
		args = append(args, req.ClientEmail)
		argIdx++
	}
	if req.Phone != nil {
		setClauses = append(setClauses, "phone = $"+itoa(argIdx))
		args = append(args, *req.Phone)
		argIdx++
	}
	if req.Service != nil {
		setClauses = append(setClauses, "service = $"+itoa(argIdx))
		args = append(args, *req.Service)
		argIdx++
	}
	if req.Date != "" {
		setClauses = append(setClauses, "date = $"+itoa(argIdx))
		args = append(args, req.Date)
		argIdx++
	}
	if req.TimeSlot != "" {
		setClauses = append(setClauses, "time_slot = $"+itoa(argIdx))
		args = append(args, req.TimeSlot)
		argIdx++
	}
	if req.Notes != nil {
		setClauses = append(setClauses, "notes = $"+itoa(argIdx))
		args = append(args, *req.Notes)
		argIdx++
	}
	if req.Status != nil {
		setClauses = append(setClauses, "status = $"+itoa(argIdx))
		args = append(args, *req.Status)
		argIdx++
	}

	if len(setClauses) == 0 {
		writeBookingsJSON(w, http.StatusBadRequest, bookingsResponse{Error: "No fields to update"})
		return
	}

	query := "UPDATE bookings SET " + strings.Join(setClauses, ", ") + " WHERE id = $" + itoa(argIdx)
	args = append(args, id)

	tag, err := conn.Exec(ctx, query, args...)
	if err != nil {
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Failed to update booking"})
		return
	}

	if tag.RowsAffected() == 0 {
		writeBookingsJSON(w, http.StatusNotFound, bookingsResponse{Error: "Booking not found"})
		return
	}

	writeBookingsJSON(w, http.StatusOK, bookingsResponse{Message: "Booking updated successfully"})
}

func handleDeleteBooking(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeBookingsJSON(w, http.StatusBadRequest, bookingsResponse{Error: "id query parameter is required"})
		return
	}

	tag, err := conn.Exec(ctx, "DELETE FROM bookings WHERE id = $1", id)
	if err != nil {
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Failed to delete booking"})
		return
	}

	if tag.RowsAffected() == 0 {
		writeBookingsJSON(w, http.StatusNotFound, bookingsResponse{Error: "Booking not found"})
		return
	}

	writeBookingsJSON(w, http.StatusOK, bookingsResponse{Message: "Booking deleted successfully"})
}

func writeBookingsJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
}
