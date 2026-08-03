# Backend (Go)

API server for the therapy site.

## Structure

```
backend-go/
├── cmd/server/        # Application entrypoint
│   └── main.go
├── internal/
│   ├── config/        # Environment & configuration loading
│   ├── handlers/      # HTTP route handlers
│   ├── mailer/        # Email sending logic
│   └── middleware/    # HTTP middleware (CORS, etc.)
├── .env               # Local environment variables (not committed)
├── .env.example       # Template for required env vars
├── go.mod
└── go.sum
```

## Running

```bash
# From this directory:
go run ./cmd/server

# Or from project root:
npm run backend
```

## Building

```bash
go build -o server ./cmd/server
./server
```

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable     | Description                  | Default        |
|-------------|------------------------------|----------------|
| PORT        | Server port                  | 3001           |
| SMTP_HOST   | SMTP server host             | smtp.gmail.com |
| SMTP_PORT   | SMTP server port             | 587            |
| SMTP_USER   | SMTP username                | -              |
| SMTP_PASS   | SMTP password / app password | -              |
| EMAIL_FROM  | Sender email address         | -              |
| EMAIL_TO    | Recipient email address      | -              |

## API Endpoints

### POST /api/contact

Send a contact form submission.

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello!"
}
```

**Success response (200):**
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```
