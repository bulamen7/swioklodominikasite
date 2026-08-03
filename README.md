# Dominika Swioklo — Therapy Site

A modern, responsive therapy practice website with multi-language support (Polish & English).

**Live:** [https://swioklodominika.pl](https://swioklodominika.pl/)

## Tech Stack

- **Frontend:** React 19, Vite 7, React Router 7
- **Backend:** Vercel Serverless Functions (Go)
- **Email:** Resend API
- **Hosting:** Vercel
- **Languages:** Polish / English (auto-detected)

## Project Structure

```
├── api/                    # Vercel Serverless Functions (Go)
│   ├── contact.go          # POST /api/contact — email via Resend
│   └── go.mod              # Go module for serverless functions
├── src/
│   ├── components/         # Shared components (Navbar, CalendarModal)
│   ├── pages_pl/           # Polish language pages
│   ├── pages_en/           # English language pages
│   ├── config/             # Calendar config
│   └── context/            # Language context
├── public/                 # Static assets & locale files
├── vercel.json             # Vercel routing config
└── vite.config.js          # Vite configuration
```

## Local Development

```bash
npm install
npm run dev
```

Frontend: `http://localhost:5173/`

> Note: The contact form uses `/api/contact` which works on Vercel. Locally it won't send emails unless you run `vercel dev`.

## Available Scripts

| Command           | Description                     |
|-------------------|---------------------------------|
| `npm run dev`     | Start Vite dev server           |
| `npm run build`   | Production build                |
| `npm run preview` | Preview production build        |
| `npm run lint`    | Run ESLint                      |

## Deployment

Automatic deploy to Vercel on every push to `main`.

Environment variables (set in Vercel dashboard):
- `RESEND_API_KEY` — Resend API key
- `EMAIL_FROM` — Sender email (verified domain)
- `EMAIL_TO` — Recipient email

## Custom Domain

`swioklodominika.pl` → Vercel (DNS managed via OVH/Cloudflare)
