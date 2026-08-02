# Dominika Swioklo — Therapy Site

A modern, responsive therapy practice website with multi-language support (Polish & English).

**Live:** [https://swioklodominika.pl](https://swioklodominika.pl/)

## Tech Stack

**Frontend:**
- React 19
- Vite 7
- React Router 7
- i18n (Polish / English)

**Backend:**
- Go (net/http, net/smtp)
- Contact form email via SMTP (Gmail)

**Deployment:**
- GitHub Pages (frontend)
- Custom domain: swioklodominika.pl

## Project Structure

```
├── src/                    # React frontend
│   ├── components/         # Shared components (Navbar, CalendarModal)
│   ├── pages/              # Default pages
│   ├── pages_pl/           # Polish language pages
│   ├── pages_en/           # English language pages
│   ├── config/             # Calendar & forms config
│   └── context/            # Language context
├── backend-go/             # Go backend (API server)
│   ├── cmd/server/         # Entrypoint
│   └── internal/           # Config, handlers, mailer, middleware
├── public/                 # Static assets & locale files
└── .github/workflows/      # CI/CD (GitHub Pages deploy)
```

## Local Development

### Prerequisites

- Node.js v18+
- Go 1.21+

### Setup

```bash
# Install frontend dependencies
npm install

# Start both frontend and backend
npm run dev
```

Frontend: `http://localhost:5173/dominikaswioklo/`
Backend: `http://localhost:3001`

### Available Scripts

| Command            | Description                          |
|--------------------|--------------------------------------|
| `npm run dev`      | Start frontend + Go backend together |
| `npm run build`    | Production build (frontend)          |
| `npm run preview`  | Preview production build locally     |
| `npm run lint`     | Run ESLint                           |
| `npm run backend`  | Start Go backend only                |

### Backend (Go)

```bash
cd backend-go
cp .env.example .env   # Fill in SMTP credentials
go run ./cmd/server
```

## Deployment

Frontend auto-deploys to GitHub Pages on push to `main`.

## License

Private project.
