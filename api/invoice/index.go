package handler

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jung-kurt/gofpdf"
)

type invoiceBooking struct {
	Date       string
	TimeSlot   string
	Service    string
	ClientName string
	ClientEmail string
	Price      float64
}

// Handler generates invoice PDFs.
// GET /api/invoice?id=BOOKING_ID — single invoice
// GET /api/invoice?month=2026-08&email=CLIENT_EMAIL — monthly summary (admin)
func Handler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		http.Error(w, "Database not configured", http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config, err := pgx.ParseConfig(dbURL)
	if err != nil {
		http.Error(w, "Invalid database URL", http.StatusInternalServerError)
		return
	}
	config.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	conn, err := pgx.ConnectConfig(ctx, config)
	if err != nil {
		http.Error(w, "Database connection failed", http.StatusInternalServerError)
		return
	}
	defer conn.Close(ctx)

	bookingID := r.URL.Query().Get("id")
	month := r.URL.Query().Get("month")

	var bookings []invoiceBooking
	var invoiceTitle string
	var clientName string

	if bookingID != "" {
		// Single booking invoice
		row := conn.QueryRow(ctx,
			"SELECT client_name, client_email, date, time_slot, COALESCE(service, 'Wizyta') FROM bookings WHERE id = $1 AND status = 'completed'",
			bookingID)
		var b invoiceBooking
		var date time.Time
		err := row.Scan(&b.ClientName, &b.ClientEmail, &date, &b.TimeSlot, &b.Service)
		if err != nil {
			http.Error(w, "Booking not found or not completed", http.StatusNotFound)
			return
		}
		b.Date = date.Format("2006-01-02")
		b.Price = 150.00
		clientName = b.ClientName
		bookings = append(bookings, b)
		invoiceTitle = fmt.Sprintf("FV/%s/%s", date.Format("01"), date.Format("2006"))
	} else if month != "" {
		// Monthly summary invoice (admin)
		rows, err := conn.Query(ctx,
			"SELECT client_name, client_email, date, time_slot, COALESCE(service, 'Wizyta') FROM bookings WHERE status = 'completed' AND TO_CHAR(date, 'YYYY-MM') = $1 ORDER BY date ASC, time_slot ASC",
			month)
		if err != nil {
			http.Error(w, "Query failed", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var b invoiceBooking
			var date time.Time
			if err := rows.Scan(&b.ClientName, &b.ClientEmail, &date, &b.TimeSlot, &b.Service); err != nil {
				continue
			}
			b.Date = date.Format("2006-01-02")
			b.Price = 150.00
			bookings = append(bookings, b)
		}

		if len(bookings) == 0 {
			http.Error(w, "No completed bookings for this month", http.StatusNotFound)
			return
		}

		clientName = "Zestawienie zbiorcze"
		parts := strings.Split(month, "-")
		if len(parts) == 2 {
			invoiceTitle = fmt.Sprintf("FV-ZB/%s/%s", parts[1], parts[0])
		} else {
			invoiceTitle = "FV-ZB"
		}
	} else {
		http.Error(w, "Provide 'id' or 'month' parameter", http.StatusBadRequest)
		return
	}

	// Generate PDF
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.AddPage()

	// Header
	pdf.SetFont("Helvetica", "B", 18)
	pdf.CellFormat(0, 12, "FAKTURA", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)
	pdf.CellFormat(0, 6, invoiceTitle, "", 1, "L", false, 0, "")
	pdf.CellFormat(0, 6, fmt.Sprintf("Data wystawienia: %s", time.Now().Format("2006-01-02")), "", 1, "L", false, 0, "")
	pdf.Ln(10)

	// Seller
	pdf.SetFont("Helvetica", "B", 11)
	pdf.CellFormat(95, 6, "Sprzedawca:", "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 6, "Nabywca:", "", 1, "L", false, 0, "")
	pdf.SetFont("Helvetica", "", 10)

	pdf.CellFormat(95, 5, "Gabinet Fizjoterapii Dominika Swioklo", "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 5, clientName, "", 1, "L", false, 0, "")

	pdf.CellFormat(95, 5, "ul. Odolanska 10, 02-697 Warszawa", "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 5, "", "", 1, "L", false, 0, "")

	pdf.CellFormat(95, 5, "NIP: 1234567890", "", 0, "L", false, 0, "")
	pdf.CellFormat(95, 5, "", "", 1, "L", false, 0, "")

	pdf.CellFormat(95, 5, "Nr konta: 00 1234 5678 9012 3456 7890 1234", "", 0, "L", false, 0, "")
	pdf.Ln(15)

	// Table header
	pdf.SetFont("Helvetica", "B", 9)
	pdf.SetFillColor(45, 95, 93)
	pdf.SetTextColor(255, 255, 255)
	pdf.CellFormat(10, 8, "Lp.", "1", 0, "C", true, 0, "")
	pdf.CellFormat(30, 8, "Data", "1", 0, "C", true, 0, "")
	pdf.CellFormat(15, 8, "Godz.", "1", 0, "C", true, 0, "")
	pdf.CellFormat(60, 8, "Usluga", "1", 0, "C", true, 0, "")
	pdf.CellFormat(35, 8, "Klient", "1", 0, "C", true, 0, "")
	pdf.CellFormat(25, 8, "Kwota", "1", 0, "C", true, 0, "")
	pdf.Ln(-1)

	// Table rows
	pdf.SetFont("Helvetica", "", 9)
	pdf.SetTextColor(0, 0, 0)
	var total float64

	for i, b := range bookings {
		pdf.CellFormat(10, 7, fmt.Sprintf("%d", i+1), "1", 0, "C", false, 0, "")
		pdf.CellFormat(30, 7, b.Date, "1", 0, "C", false, 0, "")
		pdf.CellFormat(15, 7, b.TimeSlot, "1", 0, "C", false, 0, "")
		pdf.CellFormat(60, 7, b.Service, "1", 0, "L", false, 0, "")
		pdf.CellFormat(35, 7, b.ClientName, "1", 0, "L", false, 0, "")
		pdf.CellFormat(25, 7, fmt.Sprintf("%.2f zl", b.Price), "1", 0, "R", false, 0, "")
		pdf.Ln(-1)
		total += b.Price
	}

	// Total
	pdf.SetFont("Helvetica", "B", 10)
	pdf.CellFormat(150, 9, "RAZEM:", "1", 0, "R", false, 0, "")
	pdf.CellFormat(25, 9, fmt.Sprintf("%.2f zl", total), "1", 0, "R", false, 0, "")
	pdf.Ln(20)

	// Footer
	pdf.SetFont("Helvetica", "", 8)
	pdf.CellFormat(0, 5, "Dokument wygenerowany automatycznie.", "", 1, "C", false, 0, "")

	// Output PDF
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s.pdf", invoiceTitle))

	if err := pdf.Output(w); err != nil {
		http.Error(w, "Failed to generate PDF", http.StatusInternalServerError)
	}
}
