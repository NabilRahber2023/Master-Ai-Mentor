# AI Mentor — Project Roadmap & Technical Status

> **Last updated:** 2026-06-21
> **Purpose:** Single source of truth for what this project is, its verified current state, and the prioritized work remaining. Read this first when resuming work.

---

## 1. What This Project Is

A **multi-tenant SaaS platform** for AI-powered student mentoring. It has two halves:

| Half | Stack | Responsibility |
|------|-------|----------------|
| **SaaS shell** | Next.js 16 (App Router, Turbopack) · Better Auth · Drizzle ORM · PostgreSQL | Orgs/tenants, login, packages, pricing, subscriptions, loyalty, promotions |
| **AI/ML engine** | FastAPI · CatBoost · scikit-learn · SHAP · sentence-transformers · Ollama (`phi3:mini`) · pgvector | 4 ML predictors + a RAG chatbot |

**Multi-tenancy model:** path-based (`/{org-slug}/...`), all tenants on one domain.

---

## 2. Architecture & Ports

```
┌─────────────────────────────────────────────────────────────┐
│  Browser → http://localhost:3000  (Next.js frontend)         │
│     │                                                         │
│     ├── Better Auth  → Postgres (5433) directly  [auth/orgs] │
│     │                                                         │
│     └── /api/v1/*  ──rewrite──►  http://localhost:8001        │
│                                   (FastAPI backend)           │
│                                      │                        │
│                                      ├── Postgres 5432 (int)  │
│                                      └── Ollama 11434         │
└─────────────────────────────────────────────────────────────┘
```

| Service | Container | Host Port | Notes |
|---------|-----------|-----------|-------|
| Frontend (Next.js) | — (local `next dev`) | 3000 | loads `.env.local` + `.env` |
| Backend API (FastAPI) | `ai_mentor_api` | 8001 → 8000 | `--reload` enabled |
| PostgreSQL + pgvector | `ai_mentor_db` | 5433 → 5432 | DB name `ai_mentor`, user/pass `postgres` |
| Ollama LLM | `ai_mentor_ollama` | 11434 | model `phi3:mini` |

**Key config:** `frontend/next.config.ts` rewrites `/api/v1/:path*` → `${BACKEND_URL}/api/v1/:path*` (`BACKEND_URL` defaults to `http://localhost:8001`).

---

## 3. How to Run Locally

```bash
# 1. Backend stack (from backend/)
cd backend
docker compose up -d --build      # first time; use --no-build after images exist

# 2. Frontend (from frontend/)
cd frontend
pnpm install                      # if node_modules missing
pnpm dev                          # http://localhost:3000
```

**URLs**
- App: http://localhost:3000
- Swagger UI: http://localhost:8001/docs
- OpenAPI spec: http://localhost:8001/openapi.json
- Health: http://localhost:8001/health

**Demo login** (seeded): `oxford@gmail.com` / `@oxford123#` → redirects to `/daffodil/home`.
A "Fill demo credentials" button was added to the login form for convenience (`frontend/components/auth/email-login-form.tsx`).

---

## 4. API Surface (verified from OpenAPI)

| Method | Path | Module |
|--------|------|--------|
| POST | `/api/v1/prediction/sgpa/` | Grade (SGPA) predictor |
| POST | `/api/v1/prediction/sgpa/batch` | Grade batch |
| POST | `/api/v1/prediction/sgpa/dashboard` | Grade dashboard |
| POST | `/api/v1/prediction/9box/` | 9-Box / Growth Potential |
| POST | `/api/v1/prediction/9box/batch` | 9-Box batch |
| POST | `/api/v1/prediction/career/career` | Career guidance |
| POST | `/api/v1/prediction/career/batch` | Career batch |
| POST | `/api/v1/prediction/subject/subject_choice` | Subject prediction |
| POST | `/api/v1/prediction/subject/batch` | Subject batch |
| POST | `/api/v1/chat/` | Chatbot message |
| POST | `/api/v1/chat/reset` | Reset chat session |
| GET  | `/api/v1/chat/health` | Chatbot/LLM health |
| POST | `/api/v1/admin/upload-csv` | Admin CSV ingest |
| GET  | `/health` | Service health |

> ⚠️ **Trailing-slash note:** endpoints expect a trailing slash; calling without it returns a **308 redirect**. Browser `fetch` follows it (preserving POST + body), but always call the exact path to avoid double round-trips.

> ⚠️ **Strict enums:** request bodies enforce enums via Pydantic. Example for SGPA:
> `Father_Education`/`Mother_Education` ∈ `{Secondary, HigherSec, Primary, Graduate, Postgraduate, None}`,
> `Parental_Support`/`Active_Participation` ∈ `{Yes, No}`. Invalid values → **422**.

---

## 5. Current State (Verified, Not Assumed)

| Layer | Status | Evidence |
|-------|--------|----------|
| Docker stack (Postgres, Ollama, API) | ✅ Running & healthy | startup checks pass; `/health` → 200 |
| Swagger UI | ✅ Live | `/docs` → 200 |
| Auth + multi-tenant login | ✅ Working | `oxford@gmail.com` → `/daffodil/home`; 1 org seeded |
| **ML APIs** (sgpa, 9box, career, subject) | ✅ Backend works | live SGPA call returned `predicted_sgpa: 3.06` + SHAP factors |
| **AI Chatbot wiring** | ⚠️ Connected but data-starved | frontend calls `/api/v1/chat/`, but `students` table = **0 rows** |
| **Grade / Career / Subject / Growth UI** | ❌ **Not connected** | zero `fetch` to `/api/v1/prediction/*` — pure mock UIs |
| Student dataset | ❌ Not ingested | `backend/master_dataset.csv` has 10,001 rows; DB has 0 |

### 🔑 The Core Gap
The backend ML APIs **work** and the frontend pages **look complete**, but **only the chatbot is actually wired**. The 4 prediction modules are polished front-ends rendering **hardcoded/mock data** — none call the live ML endpoints visible in Swagger.

### Frontend ↔ Backend connection map

| Frontend page | Calls backend? | Endpoint it *should* use |
|---------------|----------------|--------------------------|
| `modules/ai-chatbot/page.tsx` | ✅ Yes (`/api/v1/chat/`, `/chat/reset`) — but has mock fallback at line ~309 | `/api/v1/chat/` |
| `modules/grade-prediction` → `StudentAnalyticsDashboard.tsx` | ❌ No | `/api/v1/prediction/sgpa/` |
| `modules/subject-prediction` (a.k.a. `subject-prediction/page.tsx`) | ❌ No | `/api/v1/prediction/subject/subject_choice` |
| `modules/career-guidance/page.tsx` (797 lines) | ❌ No | `/api/v1/prediction/career/career` |
| `modules/growth-potential/page.tsx` | ❌ No | `/api/v1/prediction/9box/` |

### Database snapshot (`ai_mentor`)
15 tables present. Counts: `students` = **0** ⚠️, `packages` = 3, `organization` = 1, `subscriptions` = 1, `user` = 3.

---

## 5b. Progress Log — 2026-06-21 (this session)

**Phase 1 — DONE. Every module is now wired to the live ML APIs.**
- ✅ Ingested `master_dataset.csv` → **10,000 students** in DB; chatbot student-lookup now returns real people.
- ✅ Built a shared typed API client: [lib/api/client.ts](frontend/lib/api/client.ts) + [lib/api/predictions.ts](frontend/lib/api/predictions.ts) (types mirror backend Pydantic enums).
- ✅ Live prediction panels added & mounted in all four modules
  ([grade](frontend/components/modules/live-prediction/grade-prediction-panel.tsx),
  [subject](frontend/components/modules/live-prediction/subject-prediction-panel.tsx),
  [career](frontend/components/modules/live-prediction/career-prediction-panel.tsx),
  [9-box](frontend/components/modules/live-prediction/nine-box-prediction-panel.tsx)).
- ✅ Removed the chatbot mock fallback — failures now surface a real error.
- 🐛 **Fixed a backend bug**: 9-Box endpoint threw 500 (`only 0-dimensional arrays…`); CatBoost output now flattened to a scalar in [nine_box_ml_engine.py](backend/app/core/nine_box_ml_engine.py).

**Phase 2 (partial) — DONE**
- ✅ Loading / error / empty states built into every prediction panel.
- ✅ Client constrains enum fields via `<select>` + numeric min/max; API client formats FastAPI 422s into readable messages.
- ✅ Admin **CSV upload UI** wired to `/api/v1/admin/upload-csv` ([csv-upload.tsx](frontend/components/admin/csv-upload.tsx), mounted at `/dashboard/admin`).
- ✅ "Fill demo credentials" button env-gated to non-production.

**Phase 3 — Reviewed**
- ✅ SaaS server actions (packages/pricing/subscriptions/loyalty/promotions) are already implemented with `requireAdmin` guards and wired to admin pages — no gap in the CRUD layer.
- ⏳ Remaining (needs external secrets, not doable in-chat): real Google OAuth credentials, production tenant onboarding hardening.

**Phase 4 (partial) — DONE**
- ✅ Tightened CORS: replaced `allow_origins=["*"]` (invalid with credentials) with an env-driven allow-list (`CORS_ALLOW_ORIGINS`, defaults to localhost) in [main.py](backend/app/main.py).
- ⏳ Remaining: auth on ML endpoints, stronger LLM, Ollama healthcheck, CI, deploy.

**All verified:** frontend `tsc --noEmit` = 0 errors; all 4 prediction endpoints + chatbot return live 200s; CORS now echoes the specific origin.

---

## 6. Roadmap

### 🔴 Phase 1 — Make Everything Actually Connected — ✅ COMPLETE
Converts the project from "looks done" to "works end-to-end."

- [ ] **1.1** Ingest the dataset so chatbot/student-lookup returns real students
  `docker compose exec api python -m app.chatbot.ingest_csv <path>` (confirm arg in `app/chatbot/ingest_csv.py`).
- [ ] **1.2** Build a shared **typed API client** in the frontend (request/response types mirroring backend Pydantic schemas, incl. strict enums).
- [ ] **1.3** Wire **Grade Prediction** → POST `/api/v1/prediction/sgpa/` (use as the template; its API is already proven).
- [ ] **1.4** Wire **Subject Prediction** → `/api/v1/prediction/subject/subject_choice`.
- [ ] **1.5** Wire **Career Guidance** → `/api/v1/prediction/career/career`.
- [ ] **1.6** Wire **Growth Potential (9-Box)** → `/api/v1/prediction/9box/`.
- [ ] **1.7** Remove the chatbot **mock fallback** (`mockMsg`, `ai-chatbot/page.tsx:~309`) so all replies come from the backend.

### 🟡 Phase 2 — Robustness & UX
- [ ] **2.1** Loading / error / empty states for every prediction call.
- [ ] **2.2** Client-side validation mirroring backend enums to prevent 422s.
- [ ] **2.3** Wire **batch** + **dashboard** endpoints and an **admin CSV upload** UI → `/api/v1/admin/upload-csv`.
- [ ] **2.4** Always call endpoints with the correct trailing slash (avoid 308 round-trips).
- [ ] **2.5** Env-gate or remove the "Fill demo credentials" button before any shared deploy.

### 🟢 Phase 3 — SaaS Completeness
- [ ] **3.1** Finish packages / pricing / subscriptions / loyalty flows (server actions exist in `frontend/actionts/`; verify they're wired to admin UI).
- [ ] **3.2** Tenant onboarding: real org provisioning (`/api/tenant/provision`), invitations, role management.
- [ ] **3.3** Replace Google OAuth test credentials with real ones.

### 🔵 Phase 4 — Production Hardening
- [ ] **4.1** Swap Ollama `phi3:mini` for a stronger/hosted LLM; fix Ollama Docker healthcheck (currently cosmetically "unhealthy" — no `curl` in image).
- [ ] **4.2** Lock down CORS (currently `allow_origins=["*"]`) and add auth on ML endpoints (currently open).
- [ ] **4.3** Backend pytest suite + frontend e2e into CI.
- [ ] **4.4** Deploy: backend via Docker Compose, frontend via Coolify; set `BACKEND_URL` build arg + secrets (`BETTER_AUTH_SECRET`, real DB creds).

---

## 7. Recommended Next Step

Start with **Phase 1.1 + 1.3**: ingest the dataset (so the chatbot is real), then wire **Grade Prediction** as the reference implementation. Once one module is cleanly connected with a shared API client, replicate the pattern across Subject, Career, and Growth Potential.

---

## 8. Reference — Key Files

| Concern | File |
|---------|------|
| Backend app entry / routers | `backend/app/main.py` |
| ML engines | `backend/app/core/{sgpa,nine_box,career,subject}_ml_engine.py` |
| ML modules (router/schema/service/model) | `backend/app/modules/<module>/` |
| Chatbot (orchestrator, tools, ingest) | `backend/app/chatbot/` |
| Compose / infra | `backend/docker-compose.yml`, `backend/Dockerfile` |
| Frontend API rewrite | `frontend/next.config.ts` |
| Auth config | `frontend/lib/auth.ts`, `frontend/lib/auth-client.ts` |
| DB schema (Drizzle) | `frontend/db/schema/` |
| Server actions (SaaS) | `frontend/actionts/` |
| Tenant module pages | `frontend/app/(tenant-app)/[slug]/modules/` |
| Login form (+ demo button) | `frontend/components/auth/email-login-form.tsx` |
