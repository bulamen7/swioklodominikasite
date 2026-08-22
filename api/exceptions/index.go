package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

type Exception struct {
	ID             string   `json:"id"`
	Date           string   `json:"date"`
	IsBlocked      bool     `json:"is_blocked"`
	AvailableHours []string `json:"available_hours"`
	Reason         *string  `json:"reason,omitempty"`
}

type exceptionRequest struct {
	Date           string   `json:"date"`
	IsBlocked      bool     `json:"is_blocked"`
	AvailableHours []string `json:"available_hours,omitempty"`
	Reason         *string  `json:"reason,omitempty"`
}

type response struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Handler manages availability exceptions.
// GET /api/exceptions — all exceptions
// GET /api/exceptions?date=2026-08-10 — check specific date
// POST /api/exceptions — create exception
// DELETE /api/exceptions?id=xxx — remove exception
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Database not configured"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Invalid database URL"})
		return
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Database connection failed"})
		return
	}
	defer conn.Close(ctx)

	switch r.Method {
	case http.MethodGet:
		handleGet(ctx, conn, w, r)
	case http.MethodPost:
		handleCreate(ctx, conn, w, r)
	case http.MethodDelete:
		handleDelete(ctx, conn, w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, response{Error: "Method not allowed"})
	}
}

func handleGet(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	date := r.URL.Query().Get("date")

	if date != "" {
		var e Exception
		var d time.Time
		var hours []string
		err := conn.QueryRow(ctx,
			"SELECT id, date, is_blocked, COALESCE(available_hours, '{}'), reason FROM availability_exceptions WHERE date = $1", date,
		).Scan(&e.ID, &d, &e.IsBlocked, &hours, &e.Reason)
		if err != nil {
			writeJSON(w, http.StatusOK, response{Data: nil})
			return
		}
		e.Date = d.Format("2006-01-02")
		e.AvailableHours = hours
		writeJSON(w, http.StatusOK, response{Data: e})
		return
	}

	rows, err := conn.Query(ctx,
		"SELECT id, date, is_blocked, COALESCE(available_hours, '{}'), reason FROM availability_exceptions WHERE date >= CURRENT_DATE ORDER BY date ASC")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to fetch exceptions"})
		return
	}
	defer rows.Close()

	var exceptions []Exception
	for rows.Next() {
		var e Exception
		var d time.Time
		var hours []string
		if err := rows.Scan(&e.ID, &d, &e.IsBlocked, &hours, &e.Reason); err != nil {
			continue
		}
		e.Date = d.Format("2006-01-02")
		e.AvailableHours = hours
		exceptions = append(exceptions, e)
	}
	if exceptions == nil {
		exceptions = []Exception{}
	}
	writeJSON(w, http.StatusOK, response{Data: exceptions})
}

func handleCreate(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	var req exceptionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid request body"})
		return
	}
	if req.Date == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "date is required"})
		return
	}

	_, err := conn.Exec(ctx,
		"INSERT INTO availability_exceptions (date, is_blocked, available_hours, reason) VALUES ($1, $2, $3, $4) ON CONFLICT (date) DO UPDATE SET is_blocked = $2, available_hours = $3, reason = $4",
		req.Date, req.IsBlocked, req.AvailableHours, req.Reason)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to create exception"})
		return
	}
	writeJSON(w, http.StatusCreated, response{Message: "Exception saved"})
}

func handleDelete(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "id parameter required"})
		return
	}
	_, err := conn.Exec(ctx, "DELETE FROM availability_exceptions WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to delete exception"})
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "Exception deleted"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
