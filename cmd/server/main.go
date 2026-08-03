package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/bulamen7/swioklodominikasite/internal/handlers"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	mux := http.NewServeMux()

	// Register handlers
	mux.HandleFunc("/api/contact", cors(handlers.Contact))

	// Add more endpoints here as you build them:
	// mux.HandleFunc("/api/bookings", cors(handlers.Bookings))
	// mux.HandleFunc("/api/admin/login", cors(handlers.AdminLogin))

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Backend running on http://localhost%s", addr)

	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

// cors wraps a handler with CORS headers.
func cors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}
