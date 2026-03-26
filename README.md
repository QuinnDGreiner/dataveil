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

---

## Local development

### Prerequisites
- Node.js 20+
- Python 3.12+
- A Supabase project (free tier works)

### Frontend

```bash
cd frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm install
npm run dev
```

### Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, SUPABASE_JWT_SECRET, STRIPE keys
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Extension (Chrome)

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Visit ChatGPT, Claude, or Gemini and type a prompt with a test SSN like `123-45-6789`

### Firefox extension

```bash
cd extension
node build-firefox.js
# Produces dataveil-firefox.zip — submit to addons.mozilla.org
# Or load temporarily: about:debugging → This Firefox → Load Temporary Add-on → select manifest.json
```

### Desktop tray app

```bash
# Requires Rust: https://rustup.rs
cd desktop
npm install
npm run tauri:dev
```

---

## Deployment

| Service | Platform | Notes |
|---|---|---|
| Frontend | Vercel | Auto-deploys on push to `main` |
| Backend | Railway | `railway up` from `backend/` |
| Database | Supabase | Session Pooler required for Railway IPv4 compatibility |

### Environment variables

**Frontend (Vercel)**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_URL=https://dataveil-api-production.up.railway.app
```

**Backend (Railway)**
```
DATABASE_URL=postgresql+asyncpg://postgres.PROJECT_REF:PASSWORD@aws-X-REGION.pooler.supabase.com:5432/postgres
SUPABASE_JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
FRONTEND_URL=https://your-vercel-url.vercel.app
```

---

## Roadmap

- [ ] spaCy/Presidio NLP-based PII detection (Phase 2)
- [ ] Weekly privacy digest email (Resend)
- [ ] Chrome Web Store submission
- [ ] Safari extension
- [ ] Team dashboard with aggregate stats
