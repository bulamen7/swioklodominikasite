package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gcclinux/dominikaswioklo/backend-go/internal/mailer"
)

// ContactHandler handles contact form submissions.
type ContactHandler struct {
	mailer  *mailer.Mailer
	emailTo string
}

// NewContactHandler creates a new ContactHandler.
func NewContactHandler(m *mailer.Mailer, emailTo string) *ContactHandler {
	return &ContactHandler{
		mailer:  m,
		emailTo: emailTo,
	}
}

// contactRequest represents the incoming contact form data.
type contactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
}

// contactResponse represents the API response.
type contactResponse struct {
	Success bool   `json:"success,omitempty"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

// Handle processes POST /api/contact requests.
func (h *ContactHandler) Handle(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, contactResponse{Error: "Method not allowed"})
		return
	}

	// Limit request body to 1MB
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20)

	var req contactRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, contactResponse{Error: "Invalid request body"})
		return
	}

	if req.Name == "" || req.Email == "" || req.Message == "" {
		writeJSON(w, http.StatusBadRequest, contactResponse{Error: "All fields are required"})
		return
	}

	if err := h.mailer.SendContact(h.emailTo, req.Name, req.Email, req.Message); err != nil {
		log.Printf("Email error: %v", err)
		writeJSON(w, http.StatusInternalServerError, contactResponse{Error: "Failed to send email"})
		return
	}

	writeJSON(w, http.StatusOK, contactResponse{Success: true, Message: "Email sent successfully"})
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}
