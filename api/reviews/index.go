package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

type Review struct {
	ID         string `json:"id"`
	ClientName string `json:"client_name"`
	Rating     int    `json:"rating"`
	Content    string `json:"content"`
	IsApproved bool   `json:"is_approved"`
	CreatedAt  string `json:"created_at"`
}

type reviewRequest struct {
	ClientName string `json:"client_name"`
	Rating     int    `json:"rating"`
	Content    string `json:"content"`
	UserID     string `json:"user_id,omitempty"`
}

type reviewsResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Handler manages reviews.
// GET /api/reviews — approved reviews (public)
// GET /api/reviews?all=true — all reviews (admin)
// POST /api/reviews — submit a review (patient)
// PUT /api/reviews?id=xxx&action=approve — approve review (admin)
// PUT /api/reviews?id=xxx&action=reject — reject/delete review (admin)
// DELETE /api/reviews?id=xxx — delete review (admin)
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
		writeJSON(w, http.StatusInternalServerError, reviewsResponse{Error: "Database not configured"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, reviewsResponse{Error: "Invalid database URL"})
		return
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, reviewsResponse{Error: "Database connection failed"})
		return
	}
	defer conn.Close(ctx)

	switch r.Method {
	case http.MethodGet:
		handleGetReviews(ctx, conn, w, r)
	case http.MethodPost:
		handleCreateReview(ctx, conn, w, r)
	case http.MethodPut:
		handleUpdateReview(ctx, conn, w, r)
	case http.MethodDelete:
		handleDeleteReview(ctx, conn, w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, reviewsResponse{Error: "Method not allowed"})
	}
}

func handleGetReviews(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	showAll := r.URL.Query().Get("all") == "true"

	var query string
	if showAll {
		query = "SELECT id, client_name, rating, content, is_approved, created_at FROM reviews ORDER BY created_at DESC"
	} else {
		query = "SELECT id, client_name, rating, content, is_approved, created_at FROM reviews WHERE is_approved = true ORDER BY created_at DESC"
	}

	rows, err := conn.Query(ctx, query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, reviewsResponse{Error: "Failed to fetch reviews"})
		return
	}
	defer rows.Close()

	var reviews []Review
	for rows.Next() {
		var r Review
		var createdAt time.Time
		if err := rows.Scan(&r.ID, &r.ClientName, &r.Rating, &r.Content, &r.IsApproved, &createdAt); err != nil {
			continue
		}
		r.CreatedAt = createdAt.Format(time.RFC3339)
		reviews = append(reviews, r)
	}
	if reviews == nil {
		reviews = []Review{}
	}
	writeJSON(w, http.StatusOK, reviewsResponse{Data: reviews})
}

func handleCreateReview(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	var req reviewRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, reviewsResponse{Error: "Invalid request body"})
		return
	}

	if req.ClientName == "" || req.Content == "" || req.Rating < 1 || req.Rating > 5 {
		writeJSON(w, http.StatusBadRequest, reviewsResponse{Error: "client_name, content (1-5 rating) are required"})
		return
	}

	var userID interface{}
	if req.UserID != "" {
		userID = req.UserID
	} else {
		userID = nil
	}

	_, err := conn.Exec(ctx,
		"INSERT INTO reviews (user_id, client_name, rating, content) VALUES ($1, $2, $3, $4)",
		userID, req.ClientName, req.Rating, req.Content)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, reviewsResponse{Error: "Failed to create review"})
		return
	}

	writeJSON(w, http.StatusCreated, reviewsResponse{Message: "Review submitted for approval"})
}

func handleUpdateReview(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	action := r.URL.Query().Get("action")

	if id == "" || action == "" {
		writeJSON(w, http.StatusBadRequest, reviewsResponse{Error: "id and action parameters required"})
		return
	}

	switch action {
	case "approve":
		_, err := conn.Exec(ctx, "UPDATE reviews SET is_approved = true WHERE id = $1", id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, reviewsResponse{Error: "Failed to approve"})
			return
		}
		writeJSON(w, http.StatusOK, reviewsResponse{Message: "Review approved"})
	case "reject":
		_, err := conn.Exec(ctx, "UPDATE reviews SET is_approved = false WHERE id = $1", id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, reviewsResponse{Error: "Failed to reject"})
			return
		}
		writeJSON(w, http.StatusOK, reviewsResponse{Message: "Review rejected"})
	default:
		writeJSON(w, http.StatusBadRequest, reviewsResponse{Error: "Invalid action (use approve or reject)"})
	}
}

func handleDeleteReview(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, reviewsResponse{Error: "id parameter required"})
		return
	}

	_, err := conn.Exec(ctx, "DELETE FROM reviews WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, reviewsResponse{Error: "Failed to delete review"})
		return
	}
	writeJSON(w, http.StatusOK, reviewsResponse{Message: "Review deleted"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
