# Roadmap — Dominika Swioklo Therapy Site

## Aktualny stan (Sierpień 2026)

### Co dziala:
- [x] Strona React z dwoma jezykami (PL/EN)
- [x] Automatyczne wykrywanie jezyka przegladarki
- [x] Formularz kontaktowy (email via Resend API)
- [x] Rezerwacja wizyt (Google Calendar Appointment Scheduling)
- [x] Responsywny design
- [x] Deploy na Vercel (auto-deploy po pushu)
- [x] Custom domena swioklodominika.pl
- [x] Strona 404

### Hosting & Infrastruktura:
- Frontend: Vercel
- Backend: Vercel Serverless Functions
- Email: Resend API
- Rezerwacje: Google Calendar
- Domena: swioklodominika.pl (DNS via OVH)

---

## Nastepne kroki (priorytetowo)

### Faza 1 — Poprawa UX i stabilnosci
- [x] Dodac loading state na formularz kontaktowy (spinner/animacja)
- [ ] Dodac walidacje email po stronie frontendu (regex)
- [ ] Dodac meta tagi SEO (title, description, og:image)
- [ ] Dodac favicon
- [ ] Poprawic mobile navigation (hamburger menu)
- [ ] Dodac footer z linkami i informacjami

### Faza 2 — Funkcjonalnosc
- [ ] Panel administracyjny (login + dashboard)
  - Podglad wiadomosci z formularza
  - Edycja cennika
  - Zarzadzanie dostepnoscia
- [ ] Blog / artykuly o terapii (dobre dla SEO)
- [ ] Newsletter (zbieranie emaili zainteresowanych)
- [ ] Wlasny system rezerwacji (zamiast Google Calendar)
  - Wybor daty i godziny
  - Potwierdzenie mailem
  - Przypomnienia

### Faza 3 — Baza danych i backend
- [ ] Dodac baze danych (Vercel Postgres lub Supabase)
  - Przechowywanie wiadomosci kontaktowych
  - Przechowywanie rezerwacji
  - Dane uzytkownikow (panel admin)
- [ ] Autentykacja (NextAuth lub Clerk)
- [ ] API endpoints dla panelu admina

### Faza 4 — Marketing i skalowanie
- [ ] Google Analytics lub Plausible (prywatnosc)
- [ ] Integracja z Google My Business
- [ ] Optymalizacja Core Web Vitals
- [ ] Testy A/B na landing page
- [ ] Opinie klientow (testimonials)

---

## Notatki techniczne

- Env vars sa w Vercel dashboard (nie w repo)
- Serverless function: api/contact.js
- Jezyki: osobne foldery pages_pl/ i pages_en/ (nie i18n library)
- Router: HashRouter (dziala z SPA na Vercel)
- Resend domena: swioklodominika.pl (zweryfikowana)
