package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

type Service struct {
	ID            string  `json:"id"`
	NamePL        string  `json:"name_pl"`
	NameEN        string  `json:"name_en"`
	Duration      string  `json:"duration"`
	Price         float64 `json:"price"`
	DescriptionPL *string `json:"description_pl,omitempty"`
	DescriptionEN *string `json:"description_en,omitempty"`
	IsActive      bool    `json:"is_active"`
	SortOrder     int     `json:"sort_order"`
}

type serviceRequest struct {
	NamePL        string  `json:"name_pl"`
	NameEN        string  `json:"name_en"`
	Duration      string  `json:"duration"`
	Price         float64 `json:"price"`
	DescriptionPL *string `json:"description_pl,omitempty"`
	DescriptionEN *string `json:"description_en,omitempty"`
	IsActive      *bool   `json:"is_active,omitempty"`
	SortOrder     *int    `json:"sort_order,omitempty"`
}

type response struct {
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
		handleGetServices(ctx, conn, w, r)
	case http.MethodPost:
		handleCreateService(ctx, conn, w, r)
	case http.MethodPut:
		handleUpdateService(ctx, conn, w, r)
	case http.MethodDelete:
		handleDeleteService(ctx, conn, w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, response{Error: "Method not allowed"})
	}
}

func handleGetServices(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	showAll := r.URL.Query().Get("all") == "true"
	var query string
	if showAll {
		query = "SELECT id, name_pl, name_en, duration, price, description_pl, description_en, is_active, sort_order FROM services ORDER BY sort_order ASC"
	} else {
		query = "SELECT id, name_pl, name_en, duration, price, description_pl, description_en, is_active, sort_order FROM services WHERE is_active = true ORDER BY sort_order ASC"
	}

	rows, err := conn.Query(ctx, query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to fetch services"})
		return
	}
	defer rows.Close()

	var services []Service
	for rows.Next() {
		var s Service
		if err := rows.Scan(&s.ID, &s.NamePL, &s.NameEN, &s.Duration, &s.Price, &s.DescriptionPL, &s.DescriptionEN, &s.IsActive, &s.SortOrder); err != nil {
			continue
		}
		services = append(services, s)
	}
	if services == nil {
		services = []Service{}
	}
	writeJSON(w, http.StatusOK, response{Data: services})
}

func handleCreateService(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	var req serviceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid request body"})
		return
	}
	if req.NamePL == "" || req.NameEN == "" || req.Price <= 0 {
		writeJSON(w, http.StatusBadRequest, response{Error: "name_pl, name_en, and price are required"})
		return
	}

	_, err := conn.Exec(ctx,
		"INSERT INTO services (name_pl, name_en, duration, price, description_pl, description_en) VALUES ($1, $2, $3, $4, $5, $6)",
		req.NamePL, req.NameEN, req.Duration, req.Price, req.DescriptionPL, req.DescriptionEN)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to create service"})
		return
	}
	writeJSON(w, http.StatusCreated, response{Message: "Service created"})
}

func handleUpdateService(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "id parameter required"})
		return
	}

	var req serviceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid request body"})
		return
	}

	_, err := conn.Exec(ctx,
		"UPDATE services SET name_pl=$1, name_en=$2, duration=$3, price=$4, description_pl=$5, description_en=$6, is_active=COALESCE($7, is_active), sort_order=COALESCE($8, sort_order) WHERE id=$9",
		req.NamePL, req.NameEN, req.Duration, req.Price, req.DescriptionPL, req.DescriptionEN, req.IsActive, req.SortOrder, id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to update service"})
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "Service updated"})
}

func handleDeleteService(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "id parameter required"})
		return
	}
	_, err := conn.Exec(ctx, "DELETE FROM services WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to delete service"})
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "Service deleted"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
