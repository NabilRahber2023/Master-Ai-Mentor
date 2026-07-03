# AI Mentor — Project Roadmap & Technical Status

> **Last updated:** 2026-06-22
> **Purpose:** Single source of truth for what this project is, its verified current state, and the prioritized work remaining. Read this first when resuming work.
> **Companion docs:** `db.md` (full database map), `RBAC.md` (access-control design), `DATASET_SPEC.md` (CSV contract), `RUN_THE_PROJECT.md` (fresh-clone run guide), `We have done.md` (change log).

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
npm install                       # if node_modules missing
npm run dev                       # http://localhost:3000
```
> ⚠️ `backend/master_dataset.csv` is **gitignored** — place it in `backend/` before ingesting
> (see `RUN_THE_PROJECT.md` §3). The dataset is the **63-column** augmented file (48 base +
> 15 columns for CSV-mode predictions).

**URLs**
- App: http://localhost:3000
- Swagger UI: http://localhost:8001/docs
- OpenAPI spec: http://localhost:8001/openapi.json
- Health: http://localhost:8001/health

**Demo login** (seeded): Org Owner `owner@daffodil.com` / `Owner@12345`, or platform super-admin `oxford@gmail.com` / `Admin@12345` → redirects to `/daffodil/home`. Full login table in [RUN.md](RUN.md).
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
| POST | `/api/v1/prediction/batch/{overview,predict,prescriptions,forecast}` | Batch Prediction cohort dashboard |
| GET  | `/api/v1/prediction/csv/students` | CSV mode — list/search students |
| GET  | `/api/v1/prediction/csv/{module}/predict/{id}` | CSV mode — single-student prediction |
| GET  | `/api/v1/prediction/csv/{module}/batch` | CSV mode — whole-cohort prediction |
| POST | `/api/v1/admin/upload-csv` | Admin CSV ingest |
| GET  | `/api/v1/auth/whoami` | Resolve caller principal (debug) |
| GET  | `/health` | Service health (public) |

> 🔒 **Auth (NEW):** every `/api/v1` endpoint above (except `/health`) now requires a valid
> Better Auth **session cookie** (validated against the shared `session` table) and enforces the
> RBAC matrix + per-org module entitlement. Trusted internal calls (chatbot → ML) use an
> `x-internal-token` header. See `RBAC.md`.

> ⚠️ **Trailing-slash note:** endpoints expect a trailing slash; calling without it returns a **308 redirect**. Browser `fetch` follows it (preserving POST + body), but always call the exact path to avoid double round-trips.

> ⚠️ **Strict enums:** request bodies enforce enums via Pydantic. Example for SGPA:
> `Father_Education`/`Mother_Education` ∈ `{Secondary, HigherSec, Primary, Graduate, Postgraduate, None}`,
> `Parental_Support`/`Active_Participation` ∈ `{Yes, No}`. Invalid values → **422**.

---

## 5. Current State (Verified, Not Assumed)

| Layer | Status | Evidence |
|-------|--------|----------|
| Docker stack (Postgres, Ollama, API) | ✅ Running & healthy | `/health` → 200; `phi3:mini` loaded |
| Swagger UI | ✅ Live | `/docs` → 200 |
| Auth + multi-tenant login | ✅ Working | `oxford@gmail.com` → `/daffodil/home` |
| **All 4 prediction modules** | ✅ Wired & live | manual Predict buttons → 200 with SHAP factors |
| **CSV mode** (single + whole-batch) | ✅ Working | per-module single + cohort over 10k students → 200 |
| **Batch Prediction** dashboard | ✅ Working | overview/predict/prescriptions/forecast → 200 |
| **AI Chatbot** | ✅ Working | search, **list cohorts**, predictions, disambiguation |
| **RBAC** (super_admin + org roles) | ✅ Implemented & enforced | backend 401 w/o cookie; module on/off console |
| **Light/Dark theme** | ✅ Logo toggle on all pages | switches app shell + shadcn surfaces |
| Student dataset | ✅ Ingested | **10,000 students**, 63 columns |

### 🔑 Status: end-to-end working
The 4 prediction modules, CSV mode, Batch Prediction, and the chatbot all call the live backend
and render real results. Auth/RBAC now protects every endpoint. The remaining work is
hardening (real OAuth, tenant data isolation, CI/deploy) — see §6.

### Database snapshot (`ai_mentor`)
~20 tables. Counts: `students` = **10,000**, `module_registry` = 6, `org_module` = 6,
`packages` = 3, `organization` = 1, `user` = 3 (1 `super_admin`). Full map in `db.md`.

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

## 5c. Progress Log — 2026-06-22 (this session)

**CSV Mode — predict directly off the uploaded dataset (DONE)**
- ✅ Added a **Manual | CSV** toggle to every prediction module. CSV mode → **Single student**
  (searchable picker; result drives the existing dashboard) and **Whole batch** (model over all
  10k students with KPIs + table). Backend: `app/modules/csv_mode/` + `/api/v1/prediction/csv/*`.
- ✅ Extended the dataset with **15 feature columns** (`backend/scripts/augment_dataset.py`) so
  Grade/Career/Growth models can run off the CSV; schema + ingestion updated (see `DATASET_SPEC.md`).
- 🐛 Fixed an ingestion bug: pandas 3.0 read literal `"None"` as NaN + `where(...,None)` re-coercion.

**Career Guidance — fully prediction-driven (DONE)**
- ✅ Every section (Industry Alignment Matrix, skill radar, gaps, telemetry, learning path,
  trajectory labels, AI insights) now derives from the live prediction + its inputs and updates
  per prediction. Alignment matrix is ranked so the predicted domain leads.

**AI Chatbot — cohort listing + help (DONE)**
- ✅ New `list_students` tool + deterministic parser → "list 10 mid-level students", "top 5 high
  performers in CSE" return student cards. Added a help intent; the LLM fallback never returns blank.

**RBAC — two-tier access control (DONE — see `RBAC.md`)**
- ✅ Platform roles `super_admin`/`support`/`user`; org roles `owner`/`admin`/`mentor`
  (`lib/permissions.ts`, `lib/auth.ts`, central matrix `lib/rbac.ts`).
- ✅ New tables `module_registry`, `org_module`, `audit_log`; migrated entitlements; promoted
  `oxford@gmail.com` to `super_admin`.
- ✅ **Super Admin module console** (`/dashboard/admin/modules`) — per-org module on/off grid +
  global kill-switch, audited. Sidebar + tenant layout now read `org_module`.
- ✅ **Backend secured**: new `backend/app/auth/` validates the forwarded session cookie against
  the shared `session` table and enforces the matrix + module entitlement on every `/api/v1`
  endpoint; chatbot's internal ML calls bypass via `x-internal-token`. Verified: 401 w/o cookie,
  200 with super-admin cookie, predictions/chatbot intact.

**Theme — light/dark (DONE)**
- ✅ The **logo is a theme switch** (`components/logo-theme-toggle.tsx`) on the sidebar (all app
  pages), public navbar, and login. Built on the existing `next-themes` provider.

**Docs:** added `db.md` (database map) and `RBAC.md` (access-control plan).

> ⏳ Not yet done: light mode for the bespoke neon module dashboards (hard-coded hex);
> tenant **data** isolation (backend `students` has no `organization_id` — RBAC gates *actions*,
> not *data* between orgs; see `db.md` §10 / `RBAC.md` §13).

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
- [x] **3.1** Packages / pricing / subscriptions / loyalty flows — server actions wired with `requireAdmin` guards.
- [~] **3.2** Tenant onboarding: org provisioning exists (`/api/tenant/provision`); **role management DONE** (RBAC, `RBAC.md`). ⏳ invitations UI + per-tenant DB wiring (currently provisioned-but-unused) remain.
- [ ] **3.3** Replace Google OAuth test credentials with real ones.

### 🟣 Phase 3.5 — RBAC & Theme — ✅ COMPLETE (this session)
- [x] Two-tier roles (platform + org), permission matrix, audit log.
- [x] Super Admin module on/off console (`org_module` + global kill-switch).
- [x] Backend auth on **every** `/api/v1` endpoint (session-cookie validation + matrix).
- [x] Logo-based light/dark theme toggle across the app.

### 🔵 Phase 4 — Production Hardening
- [ ] **4.1** Swap Ollama `phi3:mini` for a stronger/hosted LLM; fix Ollama Docker healthcheck (currently cosmetically "unhealthy" — no `curl` in image).
- [x] **4.2a** CORS locked to an env-driven allow-list (`CORS_ALLOW_ORIGINS`).
- [x] **4.2b** **Auth on ML endpoints — DONE** (session-cookie + RBAC; see `RBAC.md`).
- [ ] **4.3** Backend pytest suite + frontend e2e into CI.
- [ ] **4.4** Deploy: backend via Docker Compose, frontend via Coolify; set `BACKEND_URL` build arg + secrets (`BETTER_AUTH_SECRET`, real DB creds).
- [ ] **4.5** **Tenant data isolation** — add `organization_id` to backend `students` + scope queries (stop the global TRUNCATE on upload). RBAC gates actions, not data, until this lands.
- [ ] **4.6** Consolidate fragmented schema sources (`db.md` §9); switch vector index to HNSW.
- [ ] **4.7** Light mode for the bespoke neon module dashboards (hard-coded hex → theme tokens).

---

## 7. Recommended Next Step

Phases 1–3.5 are done — the app works end-to-end with auth/RBAC. The highest-value remaining
work is **Phase 4.5 (tenant data isolation)**: add `organization_id` to the backend `students`
table and scope every query, so uploading a CSV for one org no longer wipes/serves another's data.
That closes the biggest architectural gap (`db.md` §10). After that: real Google OAuth (3.3),
CI/deploy (4.3–4.4), and light-mode polish for the module dashboards (4.7).

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
| **RBAC matrix / roles** | `frontend/lib/rbac.ts`, `frontend/lib/permissions.ts` |
| **Backend auth (cookie + matrix)** | `backend/app/auth/{principal,deps,matrix}.py` |
| **Super Admin module console** | `frontend/app/(dashboard)/dashboard/admin/modules/`, `frontend/actionts/admin/module-actions.ts` |
| **CSV-mode predictions** | `backend/app/modules/csv_mode/`, `frontend/components/modules/csv-mode/`, `frontend/lib/api/csv-mode.ts` |
| **Dataset augmentation (15 cols)** | `backend/scripts/augment_dataset.py` |
| **Theme toggle (logo)** | `frontend/components/logo-theme-toggle.tsx` |
| **RBAC DB schema** | `frontend/db/schema/rbac-schema.ts` |
