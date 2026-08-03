package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5"
)

// Handler is the Vercel serverless entrypoint for /api/bookings.
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
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Database not configured"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Invalid database URL"})
		return
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "DB connection error: %v\n", err)
		writeBookingsJSON(w, http.StatusInternalServerError, bookingsResponse{Error: "Database connection failed: " + err.Error()})
		return
	}
	defer conn.Close(ctx)

	switch r.Method {
	case http.MethodGet:
		handleGetBookings(ctx, conn, w, r)
	case http.MethodPost:
		handleCreateBooking(ctx, conn, w, r)
	case http.MethodPut:
		handleUpdateBooking(ctx, conn, w, r)
	case http.MethodDelete:
		handleDeleteBooking(ctx, conn, w, r)
	default:
		writeBookingsJSON(w, http.StatusMethodNotAllowed, bookingsResponse{Error: "Method not allowed"})
	}
}

func writeBookingsJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func itoa(i int) string {
	return fmt.Sprintf("%d", i)
}
