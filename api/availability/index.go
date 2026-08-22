package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

type Slot struct {
	ID          string `json:"id"`
	DayOfWeek   int    `json:"day_of_week"`
	TimeSlot    string `json:"time_slot"`
	IsAvailable bool   `json:"is_available"`
}

type slotRequest struct {
	DayOfWeek   int    `json:"day_of_week"`
	TimeSlot    string `json:"time_slot"`
	IsAvailable *bool  `json:"is_available,omitempty"`
}

type response struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Handler manages availability slots.
// GET /api/availability — all slots
// GET /api/availability?day=1 — slots for Monday (1=Mon, 5=Fri)
// PUT /api/availability?id=xxx — toggle availability
// POST /api/availability — add new slot
// DELETE /api/availability?id=xxx — remove slot
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
		handleGetSlots(ctx, conn, w, r)
	case http.MethodPost:
		handleCreateSlot(ctx, conn, w, r)
	case http.MethodPut:
		handleToggleSlot(ctx, conn, w, r)
	case http.MethodDelete:
		handleDeleteSlot(ctx, conn, w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, response{Error: "Method not allowed"})
	}
}

func handleGetSlots(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	day := r.URL.Query().Get("day")

	var rows pgx.Rows
	var err error

	if day != "" {
		rows, err = conn.Query(ctx,
			"SELECT id, day_of_week, time_slot, is_available FROM availability WHERE day_of_week = $1 ORDER BY time_slot ASC", day)
	} else {
		rows, err = conn.Query(ctx,
			"SELECT id, day_of_week, time_slot, is_available FROM availability ORDER BY day_of_week ASC, time_slot ASC")
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to fetch slots"})
		return
	}
	defer rows.Close()

	var slots []Slot
	for rows.Next() {
		var s Slot
		if err := rows.Scan(&s.ID, &s.DayOfWeek, &s.TimeSlot, &s.IsAvailable); err != nil {
			continue
		}
		slots = append(slots, s)
	}
	if slots == nil {
		slots = []Slot{}
	}
	writeJSON(w, http.StatusOK, response{Data: slots})
}

func handleCreateSlot(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	var req slotRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid request body"})
		return
	}
	if req.TimeSlot == "" || req.DayOfWeek < 0 || req.DayOfWeek > 6 {
		writeJSON(w, http.StatusBadRequest, response{Error: "day_of_week (0-6) and time_slot are required"})
		return
	}

	_, err := conn.Exec(ctx,
		"INSERT INTO availability (day_of_week, time_slot) VALUES ($1, $2) ON CONFLICT DO NOTHING",
		req.DayOfWeek, req.TimeSlot)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to create slot"})
		return
	}
	writeJSON(w, http.StatusCreated, response{Message: "Slot created"})
}

func handleToggleSlot(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "id parameter required"})
		return
	}

	var req slotRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid request body"})
		return
	}

	if req.IsAvailable != nil {
		_, err := conn.Exec(ctx, "UPDATE availability SET is_available = $1 WHERE id = $2", *req.IsAvailable, id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to update slot"})
			return
		}
	}
	writeJSON(w, http.StatusOK, response{Message: "Slot updated"})
}

func handleDeleteSlot(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "id parameter required"})
		return
	}
	_, err := conn.Exec(ctx, "DELETE FROM availability WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to delete slot"})
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "Slot deleted"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
