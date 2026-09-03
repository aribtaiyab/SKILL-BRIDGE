# SkillBridge Connect

**SkillBridge Connect** is an AI-powered skill verification, career readiness, and opportunity matching platform connecting Students, Academicians, Industry Partners, and Institutions.

---

## Architecture Overview

The repository is structured into decoupled, production-ready workspaces:

```
skillbridge/
├── frontend/             # Next.js 16 (App Router), React 19, Tailwind CSS
│   ├── src/              # Pages, components, hooks, auth actions, api-client
│   ├── public/           # Static assets, branding, diagrams
│   ├── package.json
│   ├── next.config.ts
│   └── tsconfig.json
│
├── backend/              # Node.js + Express REST API & Intelligence Engines
│   ├── src/
│   │   ├── config/       # Environment & Supabase client config
│   │   ├── controllers/  # Route handlers (auth, profile, student, industry, etc.)
│   │   ├── routes/       # Express route definitions under /api/*
│   │   ├── middleware/   # JWT auth, role validation, error handling
│   │   ├── services/     # Domain services
│   │   ├── intelligence/ # Deterministic scoring, matching & verification engine
│   │   ├── ai/           # AI Coach & diagnostic providers
│   │   ├── types/        # Shared data interfaces
│   │   └── server.ts     # Express application entrypoint
│   ├── package.json
│   └── tsconfig.json
│
├── supabase/             # Database migrations & seeds
│   ├── migrations/       # Versioned SQL migrations (00001 - 00015)
│   ├── seed/             # Seed data (seed.sql)
│   └── config.toml       # Supabase CLI configuration
│
├── .gitignore
└── README.md
```

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY

# Start backend dev server (defaults to port 5000)
npm run dev
```

Test backend health:
```bash
curl http://localhost:5000/api/health
```

### 2. Frontend Setup

```bash
cd frontend
npm install

# Configure environment variables
cp .env.example .env.local
# Ensure NEXT_PUBLIC_API_URL=http://localhost:5000

# Start frontend dev server (defaults to port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Express server port (default `5000`) |
| `NODE_ENV` | `development` or `production` |
| `FRONTEND_URL` | Allowed frontend origin for CORS (e.g. `http://localhost:3000`) |
| `SUPABASE_URL` | Supabase project API URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret (backend only) |
| `GROQ_API_KEY` | Optional AI provider API key |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of backend REST API (`http://localhost:5000`) |
| `NEXT_PUBLIC_APP_URL` | Base URL of frontend application (`http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

---

## Key Features & Endpoints

- **Health Check**: `GET /api/health`
- **Career Readiness & Skill Gaps**: `GET /api/student/readiness`, `GET /api/student/skill-gaps`
- **Skill Passport & Proof**: `GET /api/passport/public/:shareToken`, `GET /api/passport/summary`
- **Opportunity Matching**: `GET /api/opportunities`, `GET /api/opportunities/:id/proof-coverage`
- **Assessment Engine**: `POST /api/student/assessment/start`, `POST /api/student/assessment/submit`
- **AI Career Coach**: `POST /api/ai/coach/chat`, `POST /api/ai/coach/diagnose`
- **Stakeholder Dashboards**: Student (`/student`), Academician (`/academician`), Industry (`/industry`), Institution (`/institution`)
