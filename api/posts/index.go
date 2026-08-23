package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type Post struct {
	ID          string `json:"id"`
	TitlePL     string `json:"title_pl"`
	TitleEN     string `json:"title_en"`
	ContentPL   string `json:"content_pl"`
	ContentEN   string `json:"content_en"`
	Slug        string `json:"slug"`
	IsPublished bool   `json:"is_published"`
	CreatedAt   string `json:"created_at"`
}

type postRequest struct {
	TitlePL     string `json:"title_pl"`
	TitleEN     string `json:"title_en"`
	ContentPL   string `json:"content_pl"`
	ContentEN   string `json:"content_en"`
	Slug        string `json:"slug"`
	IsPublished *bool  `json:"is_published,omitempty"`
}

type response struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

// Handler manages blog posts.
// GET /api/posts — published posts (public)
// GET /api/posts?all=true — all posts (admin)
// GET /api/posts?slug=xxx — single post by slug
// POST /api/posts — create post (admin)
// PUT /api/posts?id=xxx — update post (admin)
// DELETE /api/posts?id=xxx — delete post (admin)
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
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
	case http.MethodGet:
		handleGetPosts(ctx, conn, w, r)
	case http.MethodPost:
		handleCreatePost(ctx, conn, w, r)
	case http.MethodPut:
		handleUpdatePost(ctx, conn, w, r)
	case http.MethodDelete:
		handleDeletePost(ctx, conn, w, r)
	default:
		writeJSON(w, http.StatusMethodNotAllowed, response{Error: "Method not allowed"})
	}
}

func handleGetPosts(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	slug := r.URL.Query().Get("slug")
	showAll := r.URL.Query().Get("all") == "true"

	if slug != "" {
		var p Post
		var createdAt time.Time
		err := conn.QueryRow(ctx,
			"SELECT id, title_pl, title_en, content_pl, content_en, slug, is_published, created_at FROM posts WHERE slug = $1", slug,
		).Scan(&p.ID, &p.TitlePL, &p.TitleEN, &p.ContentPL, &p.ContentEN, &p.Slug, &p.IsPublished, &createdAt)
		if err != nil {
			writeJSON(w, http.StatusNotFound, response{Error: "Post not found"})
			return
		}
		p.CreatedAt = createdAt.Format(time.RFC3339)
		writeJSON(w, http.StatusOK, response{Data: p})
		return
	}

	var query string
	if showAll {
		query = "SELECT id, title_pl, title_en, content_pl, content_en, slug, is_published, created_at FROM posts ORDER BY created_at DESC"
	} else {
		query = "SELECT id, title_pl, title_en, content_pl, content_en, slug, is_published, created_at FROM posts WHERE is_published = true ORDER BY created_at DESC"
	}

	rows, err := conn.Query(ctx, query)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to fetch posts"})
		return
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var p Post
		var createdAt time.Time
		if err := rows.Scan(&p.ID, &p.TitlePL, &p.TitleEN, &p.ContentPL, &p.ContentEN, &p.Slug, &p.IsPublished, &createdAt); err != nil {
			continue
		}
		p.CreatedAt = createdAt.Format(time.RFC3339)
		posts = append(posts, p)
	}
	if posts == nil {
		posts = []Post{}
	}
	writeJSON(w, http.StatusOK, response{Data: posts})
}

func handleCreatePost(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	var req postRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid request body"})
		return
	}
	if req.TitlePL == "" || req.ContentPL == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "title_pl and content_pl are required"})
		return
	}
	if req.Slug == "" {
		req.Slug = generateSlug(req.TitleEN)
		if req.Slug == "" {
			req.Slug = generateSlug(req.TitlePL)
		}
	}

	_, err := conn.Exec(ctx,
		"INSERT INTO posts (title_pl, title_en, content_pl, content_en, slug) VALUES ($1, $2, $3, $4, $5)",
		req.TitlePL, req.TitleEN, req.ContentPL, req.ContentEN, req.Slug)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to create post"})
		return
	}
	writeJSON(w, http.StatusCreated, response{Message: "Post created"})
}

func handleUpdatePost(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "id parameter required"})
		return
	}

	var req postRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, response{Error: "Invalid request body"})
		return
	}

	_, err := conn.Exec(ctx,
		"UPDATE posts SET title_pl=$1, title_en=$2, content_pl=$3, content_en=$4, slug=$5, is_published=COALESCE($6, is_published), updated_at=NOW() WHERE id=$7",
		req.TitlePL, req.TitleEN, req.ContentPL, req.ContentEN, req.Slug, req.IsPublished, id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to update post"})
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "Post updated"})
}

func handleDeletePost(ctx context.Context, conn *pgx.Conn, w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		writeJSON(w, http.StatusBadRequest, response{Error: "id parameter required"})
		return
	}
	_, err := conn.Exec(ctx, "DELETE FROM posts WHERE id = $1", id)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, response{Error: "Failed to delete post"})
		return
	}
	writeJSON(w, http.StatusOK, response{Message: "Post deleted"})
}

func generateSlug(title string) string {
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	// Remove non-alphanumeric except hyphens
	result := ""
	for _, c := range slug {
		if (c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') || c == '-' {
			result += string(c)
		}
	}
	return result
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
