# AI Mentor — Deployment Audit

> **Purpose:** A complete, read-only audit of this repository ahead of deploying to an AWS EC2 Ubuntu server. No code has been modified. This document is both an assessment and a practical guide to professional deployment.
>
> **Audit date:** 2026-07-03
> **Repo:** `Master-Ai-Mentor`  ·  **Branch:** `main`
> **Remediation update:** 2026-07-03 — the must-fix items and the listed medium risks have been addressed **without changing application functionality** (see §15).

---

## Remediation Summary (what changed)

All fixes are additive or configuration-only; no runtime behavior changes for a correctly configured deployment.

| # | Issue | Fix | Files |
|---|-------|-----|-------|
| 1 | Guessable `INTERNAL_API_TOKEN` default | Shared token module; no public default — env value, else unguessable per-process token | `backend/app/auth/internal_token.py`, `principal.py`, `chatbot/tools.py` |
| 2 | Dev-only compose (reload, bind mount, `postgres/postgres`) | New production compose: no reload, no mount, secrets from env, restart policies, mem limits | `docker-compose.prod.yml`, `.env.prod.example` |
| 3 | Silent `BACKEND_URL` localhost fallback | Build **fails loudly** if unset during a production build; Dockerfile requires the build arg | `frontend/next.config.ts`, `frontend/Dockerfile` |
| 4 | No TLS | Caddy reverse proxy with automatic HTTPS in front of the stack | `deploy/Caddyfile`, `docker-compose.prod.yml` |
| 5 | Drifting permission matrices | Guardrail test asserts `matrix.py` == `rbac.ts` | `backend/tests/test_rbac_sync.py`, `conftest.py` |
| 6 | Ollama/torch memory pressure | `mem_limit` on Ollama + API; sizing guidance | `docker-compose.prod.yml` |
| 7 | Per-tenant pool multiplication | Pool sizes now env-tunable (defaults unchanged) | `backend/app/chatbot/database.py`, `frontend/db/tenant-db-manager.ts` |
| 8 | `whoami` leaks principal info | Endpoint only registered when `ENABLE_DEBUG_ENDPOINTS` is truthy (off by default) | `backend/app/main.py` |

---

## 1. Repository Overview

**AI Mentor** is a multi-tenant SaaS platform that provides AI-powered student mentoring through two capabilities:

1. **ML predictions** — CatBoost models predict SGPA (grade), career path, 9‑box growth/potential position, and best subject/department for a student.
2. **AI chatbot** — a conversational assistant (LangChain orchestration over a local Ollama LLM) that resolves students and calls the prediction tools on the user's behalf.

The system is a **two-service application**:

| Service | Tech | Role |
|--------|------|------|
| `frontend/` | Next.js 16 (App Router, React 19) | UI, auth, RBAC, tenant provisioning, API proxy |
| `backend/` | FastAPI (Python 3.11) | ML inference + chatbot orchestration |

Both share a **PostgreSQL (pgvector)** instance. Authentication is handled by **Better Auth** in the frontend; the backend reads the *same* session table to authorize requests. Multi-tenancy uses a **database-per-organization** model.

The repo is documentation-heavy (`PROJECT_OVERVIEW.md`, `RBAC.md`, `ROADMAP.md`, `SYSTEM_WORK.md`, `db.md`, several `RUN*.md`) and contains a number of ad‑hoc helper scripts at the root (`create-*.mjs`, `debug-login.mjs`, `seed-*.mjs`).

---

## 2. Project Structure

```
Master-Ai-Mentor/
├── package.json                 # root: only bcryptjs + pg (used by helper .mjs scripts)
├── *.md                         # extensive design/doc set
├── create-*.mjs, seed-*.mjs     # ad-hoc user/seed scripts (dev tooling)
│
├── backend/                     # FastAPI service
│   ├── app/
│   │   ├── main.py              # app factory, router wiring, CORS, health
│   │   ├── auth/                # principal resolution + permission matrix (RBAC)
│   │   │   ├── principal.py     # reads Better Auth session cookie from shared DB
│   │   │   ├── matrix.py        # platform + org permission maps
│   │   │   └── deps.py          # require(permission, module) FastAPI dependency
│   │   ├── core/                # 4 ML "engines" (model load + predict)
│   │   │   ├── sgpa_ml_engine.py
│   │   │   ├── nine_box_ml_engine.py
│   │   │   ├── career_ml_engine.py
│   │   │   └── subject_ml_engine.py
│   │   ├── modules/             # one package per prediction API
│   │   │   ├── grade_predictor/    (+ .cbm model, feature_columns.json)
│   │   │   ├── nine_box_predictor/ (+ artifacts/*.cbm)
│   │   │   ├── career_predictor/   (+ .cbm, label mapping)
│   │   │   ├── subject_predictor/  (+ .cbm, label mapping)
│   │   │   ├── batch_predictor/
│   │   │   └── csv_mode/
│   │   └── chatbot/             # LangChain orchestrator, tools, LLM client, DB, security
│   ├── Dockerfile
│   ├── docker-compose.yml       # postgres(pgvector) + ollama + api + ollama-pull
│   ├── init.sql                 # students + chat_sessions schema, pgvector, indexes
│   ├── requirements.txt
│   └── test_*.py, pytest.ini
│
└── frontend/                    # Next.js app
    ├── app/
    │   ├── (landing)/           # public site + (auth) login/sign-up, pricing, register
    │   ├── (dashboard)/dashboard/(+ admin)
    │   ├── (tenant-app)/[slug]/ # per-tenant app (home, modules, settings, subject-prediction)
    │   └── api/                 # auth [...all], verify-membership, check-slug, tenant/provision
    ├── actionts/               # server actions (admin, auth, pricing, packages, subscriptions…)
    ├── components/             # UI + feature modules (ai-chatbot, batch, csv, live-prediction)
    ├── db/
    │   ├── schema/             # auth-schema, rbac-schema, package-schema (Drizzle)
    │   ├── tenant-schema.ts
    │   └── tenant-db-manager.ts# creates/connects per-tenant databases
    ├── lib/                    # auth, auth-client, permissions, rbac, tenant, api/*
    ├── drizzle/               # generated migrations
    ├── Dockerfile
    ├── next.config.ts          # rewrites /api/v1/* → BACKEND_URL
    └── package.json
```

> ⚠️ Note: `frontend/actionts/` (not `actions/`) is a spelling typo baked into the codebase — leave as-is; it is imported by that name.

---

## 3. Technology Stack

### Frontend
- **Next.js 16.1.1** (App Router) + **React 19.2** + **TypeScript 5**
- **React Compiler** enabled (`reactCompiler: true`, `babel-plugin-react-compiler`)
- **Better Auth 1.4** (email/password + Google OAuth, admin + organization plugins)
- **Drizzle ORM 0.45** + **drizzle-kit** (Postgres via `pg`)
- **Tailwind CSS 4** + Radix UI + shadcn-style components, `lucide-react`, `motion`/GSAP, Recharts/Chart.js
- **Zod 4**, `@tanstack/react-form`, `@tanstack/react-table`, `@dnd-kit`
- Package manager: **pnpm** (Dockerfile uses corepack + `pnpm-lock.yaml`)

### Backend
- **FastAPI ≥0.104** + **Uvicorn**, Python **3.11**
- **SQLAlchemy 2.0 async** + **asyncpg** + **pgvector**
- **CatBoost** (models), **pandas/numpy/scikit-learn**, **SHAP** (explanations)
- **sentence-transformers** (384‑dim embeddings) + **torch 2.12 (CPU)**
- **LangChain** + **langchain-community** (chatbot orchestration/memory)
- **httpx** (Ollama HTTP client), **pydantic 2 / pydantic-settings**, cachetools
- Testing: pytest + pytest-asyncio

### Infrastructure / data
- **PostgreSQL 15** with **pgvector** + **pg_trgm** extensions
- **Ollama** running **phi3:mini** (local LLM, ~4 GB reserved)

---

## 4. Frontend Architecture

- **App Router with route groups:**
  - `(landing)` — public marketing, pricing, register, and `(auth)` login/sign-up.
  - `(dashboard)` — platform/admin dashboard including RBAC/module management.
  - `(tenant-app)/[slug]` — the tenant-scoped application (home, modules, settings, prediction UIs). Path-based multi-tenancy: all tenants share one domain, distinguished by URL slug.
- **API proxy pattern:** `next.config.ts` rewrites `/api/v1/:path*` to `BACKEND_URL` (default `http://localhost:8001`). This keeps the browser same-origin, so the Better Auth session cookie is forwarded to FastAPI. `skipTrailingSlashRedirect` is set specifically to avoid 307 redirects dropping the `SameSite=Lax` cookie.
- **Server actions** (`actionts/`) handle admin, auth, pricing, packages, promotions, loyalty, subscriptions.
- **Client-side API layer:** `lib/api/*` (`client.ts`, `predictions.ts`, `batch.ts`, `csv-mode.ts`).
- **RBAC on the client:** `lib/permissions.ts`, `lib/rbac.ts`, `lib/role-catalog.ts` mirror the backend permission matrix.
- **`BACKEND_URL` is consumed at BUILD time** for the rewrites — a critical deployment detail (see §12/§13).

---

## 5. Backend Architecture

- **App factory** in `app/main.py` with an async `lifespan` that:
  - loads the four CatBoost engines (each wrapped in `load_safe` so a failed load only warns),
  - initializes the chatbot DB (pgvector + tables),
  - verifies the system prompt and runs non-blocking startup checks.
- **Middleware:** custom `SecurityMiddleware` + CORS. CORS origins come from `CORS_ALLOW_ORIGINS` (comma-separated; default localhost). A global exception handler returns a generic 500.
- **Modular routers**, each mounted under `/api/v1/prediction/*` and **gated by a permission + module entitlement** via `Depends(require(...))`:
  - `sgpa` → `predict:single` + `grade-prediction`
  - `9box` → `predict:single` + `growth-potential`
  - `career` → `predict:single` + `career-guidance`
  - `subject` → `predict:single` + `subject-prediction`
  - `batch` → `predict:batch` + `batch-prediction`
  - `csv` → `predict:single`
  - chatbot → `chatbot:use` + `ai-chatbot`
  - admin (CSV upload) → `dataset:upload`
- **ML "engines"** (`app/core/*`) are singletons that lazily load `.cbm` artifacts committed in each module folder.
- **Chatbot subsystem** (`app/chatbot/*`): LangChain orchestrator, tool router/dispatcher (MCP-style), intent router with fallback, entity resolver, conversation-state persistence, LLM client (Ollama), prompt management, structured logging, performance cache.
- **Health endpoint** `/health` reports per-model load state and cache stats; `/api/v1/auth/whoami` echoes the resolved principal (debug).

---

## 6. Authentication Flow

**Better Auth owns identity; the backend trusts the shared session table.**

1. User signs in via Better Auth (email/password or Google) in the Next.js app. Session cookie: `better-auth.session_token` (or `__Secure-…` in production).
2. Browser calls `/api/v1/...`; Next.js rewrites forward the request **with the cookie** to FastAPI.
3. `app/auth/principal.py` resolves the caller:
   - **Internal service calls** carry `x-internal-token` (`INTERNAL_API_TOKEN`) → treated as a `super_admin` service principal (used by the chatbot calling ML endpoints).
   - **User calls** extract the token from the cookie/`Authorization: Bearer`, then query the shared DB: `session` JOIN `user` (role), `member` (org + org role), `org_module` (entitled modules), and `organization.metadata.tenantDbName`.
   - Result is cached in-process for 30 s.
4. `_activate_tenant` publishes the tenant DB name into a `contextvars` var so every downstream session binds to the correct tenant database.
5. **Authorization** = `require(permission, module)` dependency → `has_permission(platform_role, org_role, perm)` in `matrix.py`. A permission is granted if the platform role **or** org role grants it; `super_admin`/`admin` bypass all. Module-gated endpoints additionally require the org to have the module entitled.

**Roles:**
- Platform (`user.role`): `super_admin` / `admin` (legacy) / `support` / `user` / `guest`.
- Org (`member.role`): `owner` / `admin` / `analyst` / `mentor` (`member` legacy alias) / `viewer` / `guest`.

> ⚠️ The two permission maps (`backend/app/auth/matrix.py` and `frontend/lib/rbac.ts`) are **manually kept in sync** — a documented drift risk.

---

## 7. AI Modules

| Module | Artifact(s) | Output |
|--------|-------------|--------|
| **Grade / SGPA** | `grade_predictor/sgpa_predictor.cbm` | Next-semester SGPA + dashboard |
| **9‑Box (growth/potential)** | `nine_box_predictor/artifacts/performance_classifier.cbm`, `potential_classifier.cbm`, `nine_box_mapping.json` | 9‑box grid position |
| **Career** | `career_predictor/career_predictor.cbm`, `career_label_mapping.json` | Predicted career path |
| **Subject / Department** | `subject_predictor/subject_predictor.cbm`, `subject_label_mapping.json` | Best subject/department |
| **Batch predictor** | reuses above engines | Overview / predict / prescriptions / forecast over many students |
| **CSV mode** | reuses above | Prediction directly from ingested CSV student rows |

- **Chatbot** ties these together: intent detection → tool selection → calls the prediction endpoints (as an internal service principal) → conversational response. Backed by **Ollama phi3:mini** and **LangChain**. Uses **sentence-transformers** embeddings (`VECTOR(384)`) + pgvector for student semantic search, and `pg_trgm` for fuzzy name matching.
- All `.cbm` model files and mapping JSONs are **committed to the repo** and copied into the Docker image (no external model store).

---

## 8. API Structure

All backend routes are under `/api/v1` and reached from the browser through the Next.js rewrite.

**Prediction**
- `POST /api/v1/prediction/sgpa/` · `/sgpa/batch` · `/sgpa/dashboard`
- `POST /api/v1/prediction/9box/` · `/9box/batch`
- `POST /api/v1/prediction/career/career` · `/career/batch`
- `POST /api/v1/prediction/subject/subject_choice` · `/subject/batch`
- `POST /api/v1/prediction/batch/predict` · `/prescriptions` · `/forecast` · `GET /overview`
- `GET  /api/v1/prediction/csv/students` · `/students/{id}` · `/{module}/predict/{id}` · `/{module}/batch`

**Chatbot & admin**
- `POST /api/v1/chat...` (chatbot router) · `GET` session/history
- `POST /api/v1/...` admin CSV upload (dataset:upload)

**Diagnostics**
- `GET /health` · `GET /api/v1/auth/whoami`

**Frontend API routes**
- `app/api/auth/[...all]` (Better Auth handler), `auth/verify-membership`, `check-slug`, `tenant/provision`, `tenant`.

---

## 9. Database Structure

**PostgreSQL 15 + pgvector + pg_trgm.** Two logical planes:

### Control / shared DB (Better Auth + RBAC + billing)
- Better Auth: `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation` (Drizzle `auth-schema.ts`).
- RBAC (`rbac-schema.ts`): `module_registry` (catalog + `global_enabled` kill-switch), `org_module` (per-org entitlement), `audit_log` (append-only).
- Billing/packages (`package-schema.ts`).
- `organization.metadata.tenantDbName` points to each org's dedicated database.

### Per-tenant DBs (one database per organization)
- Created by `frontend/db/tenant-db-manager.ts` → `createTenantDatabase(slug)` → `tenant_<slug>` on the same Postgres instance.
- Schema from `backend/init.sql` / `app/chatbot/models.py`:
  - **`students`** — ~60 feature columns (academics, skills, interests, scores, 9‑box fields) + `embedding VECTOR(384)`; B‑tree, GIN‑trgm, ivfflat (cosine), and composite indexes.
  - **`chat_sessions`** — conversation memory: selected/resolved student, pending fields (JSONB), last intent/tool, context (JSONB).
- The backend ensures tenant schema on first request (`ensure_tenant_ready`: creates pgvector extension + tables), caching one connection pool per tenant.

> Both the frontend (`pg`/Drizzle) and backend (`asyncpg`/SQLAlchemy) create per-tenant connection pools — connection-count planning matters at scale (see §13).

---

## 10. External Services

| Service | Used for | Config |
|---------|----------|--------|
| **PostgreSQL (pgvector)** | all persistence + vector search | `DATABASE_URL` (both services) |
| **Ollama (phi3:mini)** | chatbot LLM inference | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |
| **Google OAuth** | social login | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
| **Better Auth** | session/identity | `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET` |

No third-party paid AI API (Anthropic/OpenAI) is used — inference is fully local via Ollama. There is **no email provider** configured (email verification/reset would need one). No S3/object storage — CSV uploads and models live on local disk / in-image.

---

## 11. Production Dependencies

**Runtime prerequisites on the server**
- Docker + Docker Compose (recommended path), OR native Node 20 (pnpm) + Python 3.11.
- PostgreSQL 15 with `pgvector` and `pg_trgm` extensions.
- Ollama with the `phi3:mini` model pulled (~2–4 GB) — needs meaningful RAM.
- Sufficient memory for CatBoost + torch (CPU) + sentence-transformers + Ollama. **Plan for ≥ 8 GB RAM**; the compose file alone reserves 4 GB for Ollama.

**Environment variables**

Backend:
- `DATABASE_URL` (`postgresql+asyncpg://…`)
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL`
- `CORS_ALLOW_ORIGINS`
- `INTERNAL_API_TOKEN` (**currently defaults to `ai-mentor-internal-dev-token`**)

Frontend:
- `DATABASE_URL` (`postgresql://…` for `pg`/Drizzle)
- `BACKEND_URL` (**build-time** — bakes into rewrites)
- `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `NODE_ENV=production`

> Note: frontend uses `postgresql://` (node `pg`) while backend uses `postgresql+asyncpg://` (SQLAlchemy) — **same DB, different URL scheme**. Don't copy one into the other verbatim.

---

## 12. Deployment Requirements (AWS EC2 Ubuntu)

### Recommended architecture
```
Internet
  │  443 (TLS)
  ▼
Nginx / Caddy reverse proxy  ──►  Next.js (frontend) :3000
                                     │  /api/v1/*  (build-time BACKEND_URL rewrite)
                                     ▼
                                  FastAPI (backend) :8001→8000
                                     ├── PostgreSQL (pgvector) :5432
                                     └── Ollama :11434
```

### Instance sizing
- **Minimum:** `t3.large` (2 vCPU / 8 GB) — tight with Ollama loaded.
- **Comfortable:** `t3.xlarge` / `m6i.xlarge` (4 vCPU / 16 GB). Ollama + torch + embeddings are memory-hungry.
- Root EBS: **≥ 30 GB gp3** (Docker images, Ollama model, Postgres data, uploads).

### Step outline (Docker Compose path — using the new production files)
1. Launch Ubuntu 22.04/24.04 EC2; security group opens **22, 80, 443** only (never expose 5432/11434/8000/3000 publicly).
2. Install Docker Engine + Compose plugin.
3. Clone repo; `cp .env.prod.example .env` and fill in real secrets + your `APP_DOMAIN` (never commit `.env`).
4. Point your domain's DNS `A` record at the instance's public IP (Caddy needs this to issue a certificate).
5. Bring up the whole stack: `docker compose -f docker-compose.prod.yml up -d --build`. This builds the backend + frontend (with `BACKEND_URL=http://api:8000` baked in), starts Postgres/Ollama, pulls `phi3:mini`, and starts Caddy which auto-provisions TLS for `APP_DOMAIN`.
6. Provision the shared DB schema (Drizzle: `pnpm db:push` / `db:migrate` from `frontend/`, or run inside the frontend container) and seed the module registry + a super-admin.
7. Verify: `https://<APP_DOMAIN>` loads over TLS, login works, org creation provisions a tenant DB, a prediction runs, and the chatbot responds.

> The original `backend/docker-compose.yml` remains as the **local dev** stack (with `--reload` and bind mounts) — use `docker-compose.prod.yml` for the server.

### Professional practices to apply
- **systemd or Docker restart policies** (`restart: unless-stopped`) for auto-recovery.
- **Reverse proxy TLS** (Caddy is simplest for auto-HTTPS).
- **Secrets** via `.env` files with `chmod 600`, or AWS SSM Parameter Store / Secrets Manager — not in the image or git.
- **Backups:** automated `pg_dump` (all tenant DBs) to S3; snapshot EBS.
- **Log aggregation / rotation**; ship health checks to CloudWatch.
- **CI/CD:** build images in CI, push to ECR, pull on the host — avoid building on a small instance.

---

## 13. Production Risks

Ranked, with the concrete issue and fix.

### 🔴 High
1. **Hardcoded default secrets.** ✅ **FIXED**
   - `INTERNAL_API_TOKEN` no longer has a public default. Resolution now lives in `app/auth/internal_token.py`: it uses the env value, and if unset mints an unguessable per-process token (with a warning) instead of the old `ai-mentor-internal-dev-token`. The old default is explicitly flagged if someone re-sets it. → Still **set a strong `INTERNAL_API_TOKEN`** for multi-worker/multi-host.
   - `docker-compose.prod.yml` takes Postgres credentials from `.env` (required, no defaults).
2. **Compose file is dev-configured.** ✅ **FIXED** — `docker-compose.yml` is now clearly the DEV file; `docker-compose.prod.yml` runs the plain `CMD` (no `--reload`), no source bind-mount, `restart: unless-stopped`, and memory limits.
3. **`BACKEND_URL` is baked at build time.** ✅ **FIXED (fail-loud)** — `next.config.ts` now throws during a production build if `BACKEND_URL` is unset (scoped to the build phase so it never blocks `next start`/`next dev`), and `frontend/Dockerfile` fails the build if the arg is missing. The silent `localhost:8001` fallback can no longer ship to production. (The value is still build-time by nature of Next.js rewrites — rebuild per environment.)
4. **No TLS in the stack itself.** ✅ **FIXED** — `deploy/Caddyfile` + the `caddy` service terminate HTTPS (Let's Encrypt) in front of the frontend, so `Secure`/`SameSite` cookies work. Only 80/443 are published.

### 🟠 Medium
5. **Dual permission matrices drift.** ✅ **FIXED (guardrail)** — `backend/tests/test_rbac_sync.py` parses `frontend/lib/rbac.ts` and asserts it matches `matrix.py` (platform + org planes, wildcard-aware). Drift now fails the test suite. *(Verified passing.)*
6. **Ollama memory pressure.** ✅ **MITIGATED** — `mem_limit` on the `ollama` and `api` services (`OLLAMA_MEM_LIMIT`/`API_MEM_LIMIT`) + sizing guidance in §12. Still monitor RAM.
7. **Connection pool multiplication.** ✅ **MITIGATED** — pool sizes are env-tunable with unchanged defaults (`DB_CONTROL_POOL_SIZE`, `DB_CONTROL_MAX_OVERFLOW`, `DB_TENANT_POOL_SIZE`, `DB_TENANT_MAX_OVERFLOW` in the backend; `TENANT_DB_POOL_MAX` in the frontend). Point `DATABASE_URL` at PgBouncer or lower these at scale.
8. **Tenant DB creation from the app.** ⚠️ **Unchanged (by design).** `createTenantDatabase` still issues `CREATE DATABASE`, so its DB user needs `CREATEDB`. Left as-is to avoid altering provisioning behavior — recommend a dedicated provisioning role in operations.
9. **Permissive CORS defaults.** ✅ **ADDRESSED** — `docker-compose.prod.yml` requires `CORS_ALLOW_ORIGINS` (no default), so production is locked to your origin. The app code default remains localhost for dev.
10. **`/api/v1/auth/whoami` debug endpoint.** ✅ **FIXED** — only registered when `ENABLE_DEBUG_ENDPOINTS` is truthy; off by default (and forced off in the prod compose), so it returns 404 in production.

### 🟡 Lower
11. **Repo hygiene:** stray/garbage files in `backend/` (`sues`, `tgres container found_`, `e and environment info…`, `..._`) and many root-level `.mjs` dev scripts. Cosmetic, but review before shipping.
12. **No email provider** — password reset / verification flows can't send mail.
13. **Models committed in-repo** inflate image size; acceptable but consider an artifact store later.
14. **`version: '3.8'` compose key** is obsolete (harmless warning on modern Compose).
15. **Single-node, no HA** — Postgres, Ollama, and both apps on one box is a single point of failure.

---

## 14. Deployment Checklist

### Pre-deploy (local / CI)
- [ ] Generate strong secrets: `INTERNAL_API_TOKEN`, `BETTER_AUTH_SECRET`, Postgres password.
- [ ] Create `backend/.env` and `frontend/.env` (or `.env.local`) — never commit.
- [ ] Confirm `BACKEND_URL` build-arg is correct for the target environment.
- [ ] Set `CORS_ALLOW_ORIGINS` and Better Auth `trustedOrigins` to the prod domain.
- [ ] Register the prod OAuth redirect URI in Google Cloud console.
- [ ] Build frontend + backend images in CI; push to ECR (don't build on a small instance).
- [ ] Produce a **production** compose/manifest: no `--reload`, no `./app` bind mount, `restart: unless-stopped`, real credentials.

### Server provisioning (EC2 Ubuntu)
- [ ] Launch ≥ `t3.large` (prefer `t3.xlarge`/16 GB), ≥ 30 GB gp3 EBS, Ubuntu LTS.
- [ ] Security group: allow **22, 80, 443** only; keep 3000/8001/5432/11434 internal.
- [ ] Install Docker Engine + Compose plugin; enable Docker on boot.
- [ ] Install & configure reverse proxy (Caddy or Nginx + Certbot) for HTTPS.
- [ ] Point DNS at the instance; obtain TLS cert.

### Bring-up
- [ ] Start Postgres (pgvector) with secure credentials; verify `vector` + `pg_trgm` extensions.
- [ ] Start Ollama; confirm `phi3:mini` pulled and responding on 11434.
- [ ] Run frontend DB migrations (`pnpm db:push`/`db:migrate`) against the control DB.
- [ ] Seed `module_registry` and create the first **super-admin** user.
- [ ] Start backend; check `GET /health` shows models loaded.
- [ ] Start frontend; verify login, org creation, tenant DB provisioning, a prediction, and the chatbot end-to-end.

### Post-deploy hardening
- [ ] Verify `NODE_ENV=production` → secure cookies working over HTTPS.
- [ ] Remove/protect `/api/v1/auth/whoami`.
- [ ] Confirm no default `postgres/postgres` or default internal token remains.
- [ ] Configure automated `pg_dump` backups (all tenant DBs) → S3; test a restore.
- [ ] Set up log rotation + monitoring/alerts (CPU, RAM, Postgres connections, Ollama health).
- [ ] Add PgBouncer or connection-pool caps if onboarding many tenants.
- [ ] Document runbook: restart, redeploy (with `BACKEND_URL` rebuild), rollback.

---

## 15. Remediation Detail & Verification

Applied 2026-07-03. Guiding principle: **fix the risk, do not change what the app does** when correctly configured.

### 15.1 Internal service token
- **New:** `backend/app/auth/internal_token.py` — single source of truth. Env `INTERNAL_API_TOKEN` wins; if unset, an unguessable `secrets.token_urlsafe(32)` per-process token is generated (with a warning). The legacy public default is never used and is flagged if re-introduced.
- **Changed:** `app/auth/principal.py` (receiver) and `app/chatbot/tools.py` (sender) both import `INTERNAL_API_TOKEN` from the new module, so they always agree within a process.
- **Behavior preserved:** single-process deployments work with no config. Multi-worker/multi-host **must** set the env var (documented + warned).
- **Verified:** module imports and emits the warning; ephemeral token length 43.

### 15.2 Production compose, secrets & TLS
- **New:** `docker-compose.prod.yml` — no `--reload`, no source bind-mount, `restart: unless-stopped`, `mem_limit` on Ollama/API, all secrets/credentials from `.env` (required, no defaults), `ENABLE_DEBUG_ENDPOINTS=false`. Only Caddy publishes 80/443.
- **New:** `deploy/Caddyfile` — automatic HTTPS + security headers, reverse-proxies to the frontend.
- **New:** `.env.prod.example` — documents every required secret with generation commands.
- **Unchanged:** `backend/docker-compose.yml` stays as the dev stack.

### 15.3 `BACKEND_URL` fail-loud
- **Changed:** `frontend/next.config.ts` now exports a phase-aware factory that throws during `phase-production-build` if `BACKEND_URL` is unset — but never blocks `next start`/`next dev`. `frontend/Dockerfile` fails the build if the arg is missing. Rewrite behavior for correct builds is identical.

### 15.4 Permission-matrix drift guardrail
- **New:** `backend/tests/test_rbac_sync.py` (+ `tests/conftest.py`) parses `frontend/lib/rbac.ts` and asserts platform/org permission sets equal `matrix.py` (treating the backend `{"*"}` wildcard as the full permission set). **Verified passing** against the current matrices. No runtime code changed.

### 15.5 Connection-pool tunables
- **Changed:** `backend/app/chatbot/database.py` reads `DB_CONTROL_POOL_SIZE`/`DB_CONTROL_MAX_OVERFLOW`/`DB_TENANT_POOL_SIZE`/`DB_TENANT_MAX_OVERFLOW`; `frontend/db/tenant-db-manager.ts` reads `TENANT_DB_POOL_MAX`. **Defaults are identical to the previous hardcoded values**, so nothing changes unless you opt in.

### 15.6 Debug endpoint gating
- **Changed:** `backend/app/main.py` only registers `/api/v1/auth/whoami` when `ENABLE_DEBUG_ENDPOINTS` is truthy. Off by default and forced off in prod compose → 404 in production. The frontend does not use this endpoint.

### Verification performed
- `python -m py_compile` on all changed backend files — **OK**.
- Imported `app/auth/internal_token.py` — ephemeral token generated with warning — **OK**.
- Ran the three RBAC-sync test functions against the real `rbac.ts` — **ALL PASSED**.
- Reviewed that no functional/runtime path changed for a correctly configured deployment (pool defaults, rewrite behavior, and auth flow are unchanged).

> Not changed intentionally: tenant-DB `CREATE DATABASE` privilege model (§13.8) and the fundamental build-time nature of `BACKEND_URL` (mitigated, not eliminated). These require operational/architectural decisions rather than silent code changes.

---

*End of audit. Remediations are additive/configuration-only; existing application functionality is unchanged for correctly configured deployments.*
