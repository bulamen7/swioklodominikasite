package handler

// Booking represents a booking record from the database.
type Booking struct {
	ID          string  `json:"id"`
	ClientName  string  `json:"client_name"`
	ClientEmail string  `json:"client_email"`
	Phone       *string `json:"phone,omitempty"`
	Service     *string `json:"service,omitempty"`
	Date        string  `json:"date"`
	TimeSlot    string  `json:"time_slot"`
	Notes       *string `json:"notes,omitempty"`
	Status      string  `json:"status"`
	CreatedAt   string  `json:"created_at"`
}

// bookingRequest represents the incoming request body for creating/updating bookings.
type bookingRequest struct {
	ClientName  string  `json:"client_name"`
	ClientEmail string  `json:"client_email"`
	Phone       *string `json:"phone,omitempty"`
	Service     *string `json:"service,omitempty"`
	Date        string  `json:"date"`
	TimeSlot    string  `json:"time_slot"`
	Notes       *string `json:"notes,omitempty"`
	Status      *string `json:"status,omitempty"`
}

// bookingsResponse represents the API response structure.
type bookingsResponse struct {
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}
