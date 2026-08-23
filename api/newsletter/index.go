package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"regexp"
	"time"

	"github.com/jackc/pgx/v5"
)

type subscribeRequest struct {
	Email string `json:"email"`
}

type response struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type Subscriber struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	SubscribedAt string `json:"subscribed_at"`
	IsActive     bool   `json:"is_active"`
}

// Handler manages newsletter subscriptions.
// POST /api/newsletter — subscribe
// GET /api/newsletter — list subscribers (admin)
// DELETE /api/newsletter?id=xxx — unsubscribe
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

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
	case http.MethodPost:
		handleSubscribe(ctx, conn, w, r)
	case http.MethodGet:
		handleGetSubscribers(ctx, conn, w)
	case http.MethodDelete:
		handleUnsubscribe(ctx, conn, w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, response{Error: "Method not allowed"})
	}
}

func handleSubscribe(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	var req subscribeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid request body"})
		return
	}

	emailRegex := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	if !emailRegex.MatchString(req.Email) {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid email"})
		return
	}

	_, err := conn.Exec(ctx,
		"INSERT INTO newsletter (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET is_active = true",
		req.Email)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to subscribe"})
		return
	}
	writeJSON(w, http.StatusCreated, response{Message: "Subscribed successfully"})
}

func handleGetSubscribers(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter) {
	rows, err := conn.Query(ctx,
		"SELECT id, email, subscribed_at, is_active FROM newsletter ORDER BY subscribed_at DESC")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to fetch subscribers"})
		return
	}
	defer rows.Close()

	var subs []Subscriber
	for rows.Next() {
		var s Subscriber
		var t time.Time
		if err := rows.Scan(&s.ID, &s.Email, &t, &s.IsActive); err != nil {
			continue
		}
		s.SubscribedAt = t.Format(time.RFC3339)
		subs = append(subs, s)
	}
	if subs == nil {
		subs = []Subscriber{}
	}
	writeJSON(w, http.StatusOK, response{Data: subs})
}

func handleUnsubscribe(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "id parameter required"})
		return
	}
	_, err := conn.Exec(ctx, "UPDATE newsletter SET is_active = false WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to unsubscribe"})
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "Unsubscribed"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
