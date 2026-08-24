package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

type Variant struct {
	ID        string  `json:"id"`
	ServiceID string  `json:"service_id"`
	Duration  string  `json:"duration"`
	Price     float64 `json:"price"`
	SortOrder int     `json:"sort_order"`
}

type variantRequest struct {
	ServiceID string  `json:"service_id"`
	Duration  string  `json:"duration"`
	Price     float64 `json:"price"`
	SortOrder int     `json:"sort_order"`
}

type response struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Handler manages service variants.
// GET /api/variants?service_id=xxx — variants for a service
// GET /api/variants — all variants
// POST /api/variants — create variant
// DELETE /api/variants?id=xxx — delete variant
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
	serviceID := r.URL.Query().Get("service_id")

	var rows pgx.Rows
	var err error

	if serviceID != "" {
		rows, err = conn.Query(ctx,
			"SELECT id, service_id, duration, price, sort_order FROM service_variants WHERE service_id = $1 ORDER BY sort_order ASC, price ASC", serviceID)
	} else {
		rows, err = conn.Query(ctx,
			"SELECT id, service_id, duration, price, sort_order FROM service_variants ORDER BY service_id, sort_order ASC, price ASC")
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to fetch variants"})
		return
	}
	defer rows.Close()

	var variants []Variant
	for rows.Next() {
		var v Variant
		if err := rows.Scan(&v.ID, &v.ServiceID, &v.Duration, &v.Price, &v.SortOrder); err != nil {
			continue
		}
		variants = append(variants, v)
	}
	if variants == nil {
		variants = []Variant{}
	}
	writeJSON(w, http.StatusOK, response{Data: variants})
}

func handleCreate(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	var req variantRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid request body"})
		return
	}
	if req.ServiceID == "" || req.Duration == "" || req.Price <= 0 {
		writeJSON(w, http.StatusBadRequest, response{Error: "service_id, duration, and price are required"})
		return
	}

	_, err := conn.Exec(ctx,
		"INSERT INTO service_variants (service_id, duration, price, sort_order) VALUES ($1, $2, $3, $4)",
		req.ServiceID, req.Duration, req.Price, req.SortOrder)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to create variant"})
		return
	}
	writeJSON(w, http.StatusCreated, response{Message: "Variant created"})
}

func handleDelete(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "id parameter required"})
		return
	}
	_, err := conn.Exec(ctx, "DELETE FROM service_variants WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to delete variant"})
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "Variant deleted"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
