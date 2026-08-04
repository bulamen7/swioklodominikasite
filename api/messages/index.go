package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

type Message struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Message   string `json:"message"`
	IsRead    bool   `json:"is_read"`
	CreatedAt string `json:"created_at"`
}

type messagesResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Handler manages contact messages.
// GET /api/messages — list all messages
// PUT /api/messages?id=xxx — mark as read
// DELETE /api/messages?id=xxx — delete message
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		writeJSON(w, http.StatusInternalServerError, messagesResponse{Error: "Database not configured"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, messagesResponse{Error: "Invalid database URL"})
		return
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, messagesResponse{Error: "Database connection failed"})
		return
	}
	defer conn.Close(ctx)

	switch r.Method {
	case http.MethodGet:
		handleGetMessages(ctx, conn, w)
	case http.MethodPut:
		handleMarkRead(ctx, conn, w, r)
	case http.MethodDelete:
		handleDeleteMessage(ctx, conn, w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, messagesResponse{Error: "Method not allowed"})
	}
}

func handleGetMessages(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter) {
	rows, err := conn.Query(ctx,
		"SELECT id, name, email, message, is_read, created_at FROM messages ORDER BY created_at DESC")
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, messagesResponse{Error: "Failed to fetch messages"})
		return
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var m Message
		var createdAt time.Time
		if err := rows.Scan(&m.ID, &m.Name, &m.Email, &m.Message, &m.IsRead, &createdAt); err != nil {
			continue
		}
		m.CreatedAt = createdAt.Format(time.RFC3339)
		messages = append(messages, m)
	}
	if messages == nil {
		messages = []Message{}
	}
	writeJSON(w, http.StatusOK, messagesResponse{Data: messages})
}

func handleMarkRead(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, messagesResponse{Error: "id parameter required"})
		return
	}

	_, err := conn.Exec(ctx, "UPDATE messages SET is_read = true WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, messagesResponse{Error: "Failed to update message"})
		return
	}
	writeJSON(w, http.StatusOK, messagesResponse{Message: "Message marked as read"})
}

func handleDeleteMessage(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, messagesResponse{Error: "id parameter required"})
		return
	}

	tag, err := conn.Exec(ctx, "DELETE FROM messages WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, messagesResponse{Error: "Failed to delete message"})
		return
	}
	if tag.RowsAffected() == 0 {
		writeJSON(w, http.StatusNotFound, messagesResponse{Error: "Message not found"})
		return
	}
	writeJSON(w, http.StatusOK, messagesResponse{Message: "Message deleted"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
