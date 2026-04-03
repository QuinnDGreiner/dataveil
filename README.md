# Dataveil

**Automatically strips personal data from your AI prompts before they leave your device.**

Dataveil is a browser extension + web dashboard that redacts PII — SSNs, emails, phone numbers, credit cards, and more — from every prompt you send to ChatGPT, Claude, Gemini, Copilot, Grok, and Perplexity. Everything runs locally in your browser. Only anonymized metadata (redaction counts, service name) is ever sent to the server.

**Live:** https://frontend-rho-three-95.vercel.app

---

## What it does

- **Extension** intercepts every prompt before it's sent and scrubs PII using regex patterns
- **Dashboard** shows your redaction history, privacy score, and settings
- **Keywords** let you add custom words/phrases to always redact (company names, project codenames, IDs)
- **Custom rules** let you define your own regex patterns for advanced redaction
- **Incognito mode** (Pro) scrubs locally without logging anything to the server
- **Desktop tray app** (Pro) shows live stats in your system tray with OS notifications

---

## Project structure

```
dataveil/
├── extension/          # Chrome MV3 browser extension (also Firefox-compatible)
│   ├── manifest.json
│   ├── background.js   # Service worker — fetches settings, calls scrubber
│   ├── content.js      # Injected into AI sites — intercepts fetch/XHR
│   ├── popup/          # Extension popup UI
│   ├── pii/
│   │   └── scrubber.js # Core PII detection and redaction engine
│   └── build-firefox.js # Script to build Firefox-compatible zip for AMO
│
├── frontend/           # React + Vite + Tailwind dashboard
│   └── src/
│       ├── pages/
│       │   ├── Landing.tsx      # Marketing landing page
│       │   ├── Dashboard.tsx    # Audit log + privacy score
│       │   ├── Settings.tsx     # PII categories, keywords, custom rules
│       │   ├── Billing.tsx      # Stripe subscription management
│       │   └── Onboarding.tsx   # First-run 4-step wizard
│       ├── components/
│       │   ├── PrivacyScore.tsx      # Animated A-F grade ring
│       │   ├── ActivityHeatmap.tsx   # 91-day calendar heatmap
│       │   ├── BreachChecker.tsx     # HIBP email breach lookup
│       │   ├── KeywordsEditor.tsx    # Custom keyword chip input
│       │   ├── CustomRulesEditor.tsx # Regex rules editor
│       │   ├── HeroAnimation.tsx     # Landing page animated demo
│       │   └── LiveScanner.tsx       # Landing page live demo scanner
│       └── lib/
│           ├── api.ts      # All backend API calls
│           └── supabase.ts # Supabase auth client
│
├── backend/            # FastAPI + SQLAlchemy + Supabase Postgres
│   └── app/
│       ├── main.py          # App entry point, CORS, middleware
│       ├── auth.py          # JWT + API token auth dependencies
│       ├── database.py      # Async SQLAlchemy engine (IPv4-forced for Railway)
│       ├── models/          # SQLAlchemy ORM models
│       ├── schemas/         # Pydantic request/response schemas
│       └── routers/
│           ├── logs.py      # POST/GET audit log entries
│           ├── settings.py  # GET/PUT user settings + API token endpoints
│           ├── stats.py     # GET blocked_today + prompts_scanned
│           ├── billing.py   # Stripe checkout + webhook
│           └── security.py  # HIBP breach check proxy
│
└── desktop/            # Tauri system tray app (Rust + React)
    ├── src/
    │   ├── TrayDashboard.tsx  # Compact stats view (360×520px)
    │   └── api.ts             # API calls using stored API token
    └── src-tauri/
        ├── src/main.rs        # System tray, window show/hide
        └── tauri.conf.json    # Window config (frameless, always hidden on close)
```

---

## Tech stack

| Layer | Tech |
|---|---|
| Browser extension | Chrome MV3 (also Firefox via `build-firefox.js`) |
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Auth | Supabase (email + password) |
| Backend | FastAPI, SQLAlchemy (async), asyncpg |
| Database | Supabase Postgres (via Session Pooler for IPv4 compatibility) |
| Payments | Stripe Checkout + webhooks |
| Frontend hosting | Vercel |
| Backend hosting | Railway (Docker) |
| Desktop app | Tauri 1.x (Rust + React webview) |

---

## PII categories detected

| Category | Example |
|---|---|
| Social Security Number | `123-45-6789` |
| Credit Card Number | `4111 1111 1111 1111` |
| Email Address | `user@example.com` |
| Phone Number | `(555) 867-5309` |
| Date of Birth | `DOB: 01/15/1990` |
| Passport / ID Number | `A12345678` |
| IP Address | `192.168.1.1` |
| Street Address | `123 Main St, Springfield` |
| Custom keywords | anything you add in Settings |
| Custom regex rules | your own patterns (Pro) |

---

## Plans

| | Free | Pro | Team |
|---|---|---|---|
| AI services | ChatGPT only | All 8 services | All 8 services |
| Audit log history | 7 days | Unlimited | Unlimited |
| Custom keywords | ✓ | ✓ | ✓ |
| Custom regex rules | ✗ | ✓ | ✓ |
| Incognito mode | ✗ | ✓ | ✓ |
| Desktop tray app | ✗ | ✓ | ✓ |
| Team seats | ✗ | ✗ | Up to 25 |
