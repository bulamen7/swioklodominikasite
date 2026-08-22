# Dominika Swioklo — Therapy Site

A full-featured therapy practice website with booking system, admin panel, and patient management.

**Live:** [https://swioklodominika.pl](https://swioklodominika.pl/)

## Tech Stack

- **Frontend:** React 19, Vite 7, React Router 7
- **Backend:** Go (Vercel Serverless Functions)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth (email + password, roles)
- **Email:** Resend API
- **Calendar:** Google Calendar API sync
- **Hosting:** Vercel (auto-deploy on push)
- **Analytics:** Google Analytics 4

## Features

### Public
- Bilingual site (Polish / English)
- Dynamic pricing page (loaded from database)
- Contact form with email delivery + database storage
- Client reviews/testimonials
- Dark mode toggle
- Responsive design with mobile hamburger menu
- SEO meta tags + Schema.org structured data
- Cookie consent banner (GDPR)

### Patient (registered user)
- Account registration with email confirmation
- Book appointments (date, time, service selection)
- View own appointments with status
- Cancel pending appointments
- Add reviews for completed visits
- Edit profile (name, phone)
- Change password
- Download invoices (PDF)

### Admin
- Dashboard with booking management (status changes, delete)
- Messages tab (contact form submissions)
- Reviews moderation (approve/reject)
- Pricing management (add/edit/remove services)
- Availability management (time slots per day)
- Statistics (monthly visits, revenue, new patients, chart)
- Patient list with profile view
- Session notes per booking
- Client profile with full visit history
- CSV export of all bookings
- Monthly invoice PDF generation
- Booking search/filter

### Integrations
- Google Calendar sync (events created on booking)
- Email confirmations (booking, reminders)
- Admin notifications on new bookings
- Daily appointment reminders (Vercel Cron)

## Project Structure

```
├── api/
│   ├── bookings/       # Bookings CRUD + calendar sync + emails
│   ├── contact/        # Contact form + save to DB
│   ├── services/       # Pricing CRUD
│   ├── availability/   # Time slots management
│   ├── messages/       # Contact messages CRUD
│   ├── reviews/        # Reviews CRUD
│   ├── invoice/        # PDF invoice generation
│   ├── notes/          # Therapist session notes
│   └── reminders/      # Daily email reminders (cron)
├── src/
│   ├── components/     # Navbar, Footer, BookingModal, Toast, etc.
│   ├── config/         # Supabase client, API helpers
│   ├── context/        # Language context
│   ├── pages/admin/    # Admin panel components
│   ├── pages_pl/       # Polish pages
│   └── pages_en/       # English pages
├── public/             # Static assets
├── vercel.json         # Routing + cron config
└── vite.config.js      # Build config with code splitting
```

## Local Development

```bash
npm install
npm run dev
```

> Contact form and bookings work only on production (Vercel serverless).

## Environment Variables (Vercel)

- `DATABASE_URL` — Supabase Postgres connection string
- `RESEND_API_KEY` — Resend email API key
- `EMAIL_FROM` — Sender email (verified domain)
- `EMAIL_TO` — Admin notification recipient
- `ADMIN_EMAIL` — Admin email for notifications
- `GOOGLE_CALENDAR_ID` — Google Calendar ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — Service account email
- `GOOGLE_PRIVATE_KEY` — Service account private key

## Deployment

Automatic deploy to Vercel on every push to `main`.
