package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gcclinux/dominikaswioklo/backend-go/internal/config"
	"github.com/gcclinux/dominikaswioklo/backend-go/internal/handlers"
	"github.com/gcclinux/dominikaswioklo/backend-go/internal/mailer"
	"github.com/gcclinux/dominikaswioklo/backend-go/internal/middleware"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	m := mailer.New(cfg.SMTP, cfg.EmailFrom)

	contactHandler := handlers.NewContactHandler(m, cfg.EmailTo)

	mux := http.NewServeMux()
	mux.HandleFunc("/api/contact", contactHandler.Handle)

	// Wrap with middleware
	handler := middleware.CORS(mux)

	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Server running on port %d", cfg.Port)

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
