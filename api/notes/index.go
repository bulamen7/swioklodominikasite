package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

type Note struct {
	ID        string `json:"id"`
	BookingID string `json:"booking_id"`
	Note      string `json:"note"`
	CreatedAt string `json:"created_at"`
}

type noteRequest struct {
	BookingID string `json:"booking_id"`
	Note      string `json:"note"`
}

type response struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Handler manages session notes.
// GET /api/notes?booking_id=xxx — get note for booking
// GET /api/notes — all notes
// POST /api/notes — create/update note
// DELETE /api/notes?id=xxx — delete note
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
		handleGetNotes(ctx, conn, w, r)
	case http.MethodPost:
		handleSaveNote(ctx, conn, w, r)
	case http.MethodDelete:
		handleDeleteNote(ctx, conn, w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, response{Error: "Method not allowed"})
	}
}

func handleGetNotes(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	bookingID := r.URL.Query().Get("booking_id")

	if bookingID != "" {
		var n Note
		var createdAt time.Time
		err := conn.QueryRow(ctx,
			"SELECT id, booking_id, note, created_at FROM session_notes WHERE booking_id = $1", bookingID,
		).Scan(&n.ID, &n.BookingID, &n.Note, &createdAt)
		if err != nil {
			writeJSON(w, http.StatusOK, response{Data: nil})
			return
		}
		n.CreatedAt = createdAt.Format(time.RFC3339)
		writeJSON(w, http.StatusOK, response{Data: n})
		return
	}

	rows, err := conn.Query(ctx, "SELECT id, booking_id, note, created_at FROM session_notes ORDER BY created_at DESC")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to fetch notes"})
		return
	}
	defer rows.Close()

	var notes []Note
	for rows.Next() {
		var n Note
		var createdAt time.Time
		if err := rows.Scan(&n.ID, &n.BookingID, &n.Note, &createdAt); err != nil {
			continue
		}
		n.CreatedAt = createdAt.Format(time.RFC3339)
		notes = append(notes, n)
	}
	if notes == nil {
		notes = []Note{}
	}
	writeJSON(w, http.StatusOK, response{Data: notes})
}

func handleSaveNote(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	var req noteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid request body"})
		return
	}
	if req.BookingID == "" || req.Note == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "booking_id and note are required"})
		return
	}

	// Upsert — insert or update if exists
	_, err := conn.Exec(ctx,
		"INSERT INTO session_notes (booking_id, note) VALUES ($1, $2) ON CONFLICT (booking_id) DO UPDATE SET note = $2",
		req.BookingID, req.Note)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to save note"})
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "Note saved"})
}

func handleDeleteNote(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "id parameter required"})
		return
	}
	_, err := conn.Exec(ctx, "DELETE FROM session_notes WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to delete note"})
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "Note deleted"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
