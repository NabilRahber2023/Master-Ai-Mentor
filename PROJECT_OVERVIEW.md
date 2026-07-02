# PROJECT OVERVIEW — AI Mentor (AI-updates-mentor)

> **Authoritative reference document.** Every statement below is derived from verified source code in this repository. This file is designed to function as the project's complete technical DNA — a standalone reference that allows a developer or another AI to understand, operate, and extend the system without reading the source.

---

## TABLE OF CONTENTS

1. [Project Information](#1-project-information)
2. [Complete Project Summary](#2-complete-project-summary)
3. [Business Logic](#3-business-logic)
4. [Folder Structure](#4-folder-structure)
5. [Technology Stack](#5-technology-stack)
6. [Architecture](#6-architecture)
7. [Frontend Analysis](#7-frontend-analysis)
8. [Backend Analysis](#8-backend-analysis)
9. [Database Analysis](#9-database-analysis)
10. [Authentication](#10-authentication)
11. [API Documentation](#11-api-documentation)
12. [AI Module Analysis](#12-ai-module-analysis)
13. [User Journey](#13-user-journey)
14. [Admin Journey](#14-admin-journey)
15. [Role Management](#15-role-management)
16. [Feature Breakdown](#16-feature-breakdown)
17. [Module Breakdown](#17-module-breakdown)
18. [Important Functions](#18-important-functions)
19. [Configuration](#19-configuration)
20. [Dependencies](#20-dependencies)
21. [Security](#21-security)
22. [Performance](#22-performance)
23. [Error Handling](#23-error-handling)
24. [Deployment](#24-deployment)
25. [Project Execution Flow](#25-project-execution-flow)
26. [Complete Data Flow](#26-complete-data-flow)
27. [External Services](#27-external-services)
28. [File-by-File Analysis](#28-file-by-file-analysis)
29. [Code Patterns](#29-code-patterns)
30. [Project Limitations](#30-project-limitations)
31. [Future Improvements](#31-future-improvements)
32. [Development Setup](#32-development-setup)
33. [Complete Feature List](#33-complete-feature-list)
34. [Text Flowchart](#34-text-flowchart)
35. [Component Relationships](#35-component-relationships)
36. [Glossary](#36-glossary)
37. [AI Knowledge Base](#37-ai-knowledge-base)

---

## 1. Project Information

| Attribute | Value |
|-----------|-------|
| **Project Name** | AI Mentor (repository: `AI-updates-mentor`) |
| **Backend API** | `AI Mentor SaaS Unified API` **v2.1.0** (FastAPI `title`/`version`) |
| **Product Branding** | "AI Mentor" / "Intellector" (production domain `intellector.daffodilglobal.ai`) |
| **Type** | Multi-tenant SaaS platform for AI-driven student academic & career intelligence |
| **Primary Working Directory** | `c:\AIMENTOR\AI-updates-mentor` |
| **Architecture Style** | Decoupled frontend (Next.js) + backend (FastAPI) + local LLM (Ollama) |
| **Tenancy Model** | Path-based multi-tenancy (`/{org-slug}/...`) on a single shared domain |
| **Primary Domain Focus** | Predictive academic analytics (SGPA, career, talent grid, subject choice) + conversational AI |
| **Target Users** | Educational institutions, mentors, analysts, academic administrators |

### Repository structure (top level)

```
AI-updates-mentor/
├── backend/          # FastAPI application + ML engines + chatbot
├── frontend/         # Next.js 16 application (App Router)
├── RBAC.md           # RBAC design document
├── ROADMAP.md        # Project status / roadmap (as of 2026-06-22)
├── RUN.md            # Run/operations documentation
└── PROJECT_OVERVIEW.md (this file)
```

---

## 2. Complete Project Summary

AI Mentor is a **multi-tenant SaaS platform** that applies machine learning to student data in order to produce four kinds of predictive intelligence and to surface that intelligence through a conversational AI chatbot. The platform serves educational organizations, each of which lives at its own URL path (`/{org-slug}/...`) on a shared domain.

The system is split into three cooperating runtimes:

1. **Frontend** — A Next.js 16 (App Router, React 19) application that handles authentication, tenant routing, role-based UI gating, and all user-facing dashboards. It uses **Better Auth** (email/password + Google OAuth) for identity and **Drizzle ORM** for managing the auth/RBAC/billing schema in PostgreSQL.

2. **Backend** — A FastAPI (Python 3.11) application (`AI Mentor SaaS Unified API` v2.1.0) exposing prediction APIs and a chatbot API. At startup it loads **four CatBoost ML engines** into memory (SGPA regressor, career classifier, subject classifier, and the 9-box engine — which itself loads **two** classifiers: performance + potential, so **five** `.cbm` files total). It performs ML inference, generates **SHAP-based contributing-factor explanations**, and orchestrates a chatbot via a custom **MCP (Model Context Protocol) dispatcher** pattern. Database access is via **SQLAlchemy 2.0 async** + **asyncpg**, with **pgvector** for semantic search.

3. **Local LLM** — An **Ollama** server running **phi3:mini** is used as the chatbot's reasoning/orchestration engine (it decides which tool to call) and as a fallback responder. It never produces predictions itself; predictions always come from the CatBoost models.

The four ML capabilities are:
- **SGPA Predictor** — regression model predicting a student's SGPA (grade) with a risk level.
- **Career Predictor** — classifier predicting the best-fit career path with alternatives.
- **9-Box Talent Grid Predictor** — **two** CatBoost classifiers (performance + potential) whose outputs place a student in a 9-box grid (exposed as the `growth-potential` module). Confidence is the average of both models' top-class probabilities.
- **Subject/Department Predictor** — classifier recommending a subject/department choice.

The chatbot ties everything together: a user can ask natural-language questions ("predict SGPA for AB-1234", "list students in CSE", "what career fits Maria?"), and the chatbot resolves the student entity, detects intent, calls the relevant ML tool, and returns a structured, explained answer.

**Authentication and authorization** use defense-in-depth across four layers (middleware → server layout → Next API routes → FastAPI). Authorization is a **two-tier RBAC** model: platform roles (super_admin/support/user/guest) crossed with organization roles (owner/admin/analyst/mentor/viewer/guest). Module availability is additionally gated by a per-organization **module entitlement** system (`org_module` table) that a Super Admin toggles.

---

## 3. Business Logic

### 3.1 Core value proposition

The platform converts raw student records into **actionable, explainable predictions** that mentors and analysts can use to intervene early (e.g., flagging students at "High Risk" of low SGPA) and to guide students toward suitable careers/subjects.

### 3.2 Key business rules (verified from code)

| Rule | Source of truth |
|------|-----------------|
| Each organization sees only the modules a Super Admin has enabled for it | `org_module.enabled AND module_registry.globalEnabled` ([layout.tsx:119-125](frontend/app/(tenant-app)/[slug]/layout.tsx#L119-L125)) |
| A permission is granted if **either** the platform role OR the org role grants it | `has_permission()` ([matrix.py:39-46](backend/app/auth/matrix.py#L39-L46)), `can()` ([rbac.ts:103-109](frontend/lib/rbac.ts#L103-L109)) |
| `super_admin` (and legacy `admin`) can do everything | `is_super_admin()` ([matrix.py:35-36](backend/app/auth/matrix.py#L35-L36)) |
| The LLM must **never** predict values itself — it only calls tools | `system_prompt_v1.txt` |
| Batch/cohort predictions require `predict:batch`; single predictions require `predict:single` | `ENDPOINT_PERMISSIONS` ([rbac.ts:158-164](frontend/lib/rbac.ts#L158-L164)) |
| Dataset upload requires `dataset:upload` | `ENDPOINT_PERMISSIONS` |
| Chatbot use requires `chatbot:use` AND the `ai-chatbot` module enabled | `ENDPOINT_PERMISSIONS` |

### 3.3 Monetization model (from schema)

The billing schema (`package-schema.ts`) defines a **tiered subscription** model:
- **Package tiers**: `silver`, `gold`, `platinum`, `custom` (`packageTierEnum`).
- **Subscription statuses**: `active`, `suspended`, `expired`, `cancelled` (`subscriptionStatusEnum`).
- Supporting tables for `promotions`, `loyaltyRedemptionRules`, `durationDiscounts`, and `volumeDiscounts`.
- An org's package id is stored in `organization.metadata` JSON (`packageId`, defaulting to `"gold"` — [layout.tsx:110-117](frontend/app/(tenant-app)/[slug]/layout.tsx#L110-L117)).

> **Note:** Module entitlements are no longer derived from the package; they come from `org_module`. The package id is retained in metadata but module gating is independent.

---

## 4. Folder Structure

```
AI-updates-mentor/
├── backend/
│   ├── app/
│   │   ├── main.py                      # FastAPI entry; loads 4 ML engines at startup
│   │   ├── auth/
│   │   │   ├── principal.py             # Resolve caller identity from cookie/token
│   │   │   ├── matrix.py                # Permission matrix (mirrors rbac.ts)
│   │   │   └── deps.py                  # require(permission, module) dependency
│   │   ├── core/
│   │   │   ├── sgpa_ml_engine.py        # SGPA CatBoost regressor singleton
│   │   │   ├── career_ml_engine.py      # Career CatBoost classifier + SHAP
│   │   │   ├── (9box engine)
│   │   │   └── (subject engine)
│   │   ├── modules/
│   │   │   ├── grade_predictor/         # router.py + schemas.py
│   │   │   ├── career_predictor/        # router.py
│   │   │   ├── nine_box_predictor/      # router.py
│   │   │   ├── subject_predictor/       # router.py
│   │   │   └── batch_predictor/         # router.py (cohort analytics)
│   │   └── chatbot/
│   │       ├── mcp_dispatcher.py        # Core orchestration flow
│   │       ├── tools.py                 # ToolExecutor: 7 tools
│   │       ├── entity_resolver.py       # StudentResolver
│   │       ├── llm_client.py            # OllamaClient (phi3:mini)
│   │       ├── langchain_orchestrator.py# Conversation memory (additive)
│   │       ├── models.py                # Student + ChatSession SQLAlchemy models
│   │       ├── database.py              # Async engine + pgvector
│   │       ├── schemas.py               # Pydantic request/response schemas
│   │       ├── security.py              # SecurityMiddleware (rate limit, headers)
│   │       ├── performance.py           # AsyncTTLCache, PerformanceMonitor
│   │       ├── ingest_csv.py            # CSV ingestion + embeddings
│   │       ├── admin_router.py          # POST /admin/upload-csv
│   │       └── prompts/system_prompt_v1.txt
│   ├── Dockerfile                       # Python 3.11-slim, non-root, port 8000
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── (tenant-app)/[slug]/
    │   │   ├── layout.tsx               # Server layout: auth + membership + module gate
    │   │   └── modules/
    │   │       ├── grade-prediction/page.tsx
    │   │       ├── career-guidance/...
    │   │       ├── subject-prediction/...
    │   │       ├── growth-potential/...      (9-box)
    │   │       ├── batch-prediction/...
    │   │       └── ai-chatbot/page.tsx
    │   └── api/
    │       ├── v1/...                    # Rewritten to FastAPI
    │       └── tenant/provision/route.ts # Create tenant database
    ├── lib/
    │   ├── auth.ts                       # Better Auth config
    │   ├── rbac.ts                       # Central RBAC matrix
    │   ├── permissions.ts                # Better Auth access-control roles
    │   └── api/
    │       ├── client.ts                 # apiPost<T>()
    │       └── predictions.ts            # Typed prediction API functions
    ├── db/
    │   ├── config/                       # Drizzle db client
    │   └── schema/
    │       ├── auth-schema.ts            # user/session/account/org/member/invitation
    │       ├── rbac-schema.ts            # moduleRegistry/orgModule/auditLog
    │       └── package-schema.ts         # packages/subscriptions/discounts
    ├── actionts/admin/module-actions.ts  # Server actions for module matrix
    ├── components/                       # UI (dashboards, panels, chatbot)
    ├── hooks/use-tenant.tsx              # TenantProvider context
    ├── next.config.ts                    # Rewrites /api/v1/* → backend
    └── package.json
```

---

## 5. Technology Stack

### 5.1 Backend

| Layer | Technology | Notes |
|-------|-----------|-------|
| Language | Python 3.11 | `Dockerfile` uses `python:3.11-slim` |
| Web framework | FastAPI | ASGI, dependency injection for RBAC |
| ASGI server | Uvicorn | Port 8000 (container), proxied to 8001 |
| ML | CatBoost | 4 models (1 regressor, 3 classifiers) |
| ML explainability | SHAP | `get_feature_importance(..., type="ShapValues")` |
| Data processing | pandas, numpy, scikit-learn | CSV ingestion + feature handling |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) | 384-dim |
| Vector DB | pgvector (PostgreSQL extension) | `Vector(384)` column, cosine distance |
| ORM | SQLAlchemy 2.0 async + asyncpg | Pool size 10, max overflow 20 |
| Validation | Pydantic | Request/response schemas |
| HTTP client | httpx | Async calls to Ollama + internal endpoints |
| LLM orchestration | LangChain + langchain-community | `ChatOllama`, conversation memory |
| Caching | cachetools (`TTLCache`) | Session principal + student + embedding caches |
| Deep learning runtime | torch==2.12.0+cpu | CPU-only (for sentence-transformers) |

### 5.2 Frontend

| Layer | Technology | Version (from package.json) |
|-------|-----------|------------------------------|
| Framework | Next.js | 16.1.1 (App Router) |
| UI library | React | 19.2.0 |
| Auth | better-auth | 1.4.10 |
| ORM | drizzle-orm | 0.45.1 |
| Charts | chart.js 4.4.1, recharts 2.15.4 | dashboards |
| Tables | @tanstack/react-table | 8.21.3 |
| Forms | @tanstack/react-form | 1.27.7 |
| Drag & drop | @dnd-kit/* | module ordering / UI |
| UI primitives | Radix UI, lucide-react | components & icons |
| Animation | gsap, motion | UI motion |
| Styling | tailwindcss | 4 |
| Validation | zod | 4.3.5 |
| Toasts/Drawers | sonner, vaul | notifications/sheets |
| React Compiler | enabled (`reactCompiler: true`) | `next.config.ts` |

### 5.3 Data layer

- **PostgreSQL** with the **pgvector** extension.
- The auth/RBAC/billing schema is managed by **Drizzle** (frontend).
- The student data + chat sessions are managed by **SQLAlchemy** (backend).
- Both connect to PostgreSQL; the `session`, `user`, `member`, and `org_module` tables are **shared** (backend reads them for principal resolution).

---

## 6. Architecture

### 6.1 High-level topology


                          ┌──────────────────────────────────────────┐
        Browser  ───────► │  Next.js 16 (App Router, port 3000)       │
                          │  • Better Auth (cookies)                  │
                          │  • Tenant routing /{slug}/...             │
                          │  • RBAC UI gating                         │
                          │  • Server Components + Server Actions     │
                          └───────────────┬──────────────────────────┘
                                          │  rewrite /api/v1/* (forwards
                                          │  better-auth.session_token cookie)
                                          ▼
                          ┌──────────────────────────────────────────┐
                          │  FastAPI (port 8001 ← container 8000)     │
                          │  • Principal resolution (cookie/token)    │
                          │  • RBAC matrix enforcement                │
                          │  • 4 CatBoost ML engines (loaded at boot) │
                          │  • Chatbot MCP dispatcher                 │
                          └───────┬───────────────────────┬──────────┘
                                  │                       │
                                  ▼                       ▼
                  ┌─────────────────────────┐   ┌────────────────────┐
                  │ PostgreSQL + pgvector    │   │ Ollama (port 11434)│
                  │ • auth/rbac/billing      │   │ • phi3:mini        │
                  │ • students (Vector 384)  │   │ • orchestration    │
                  │ • chat_session           │   │ • fallback replies │
                  └─────────────────────────┘   └────────────────────┘
```

### 6.2 Request paths

- **UI page render** → Next server layout authenticates + authorizes, then renders the page.
- **Prediction / chat** → browser calls `/api/v1/...` → Next rewrite forwards to FastAPI with the session cookie → FastAPI resolves principal, enforces permission, runs ML/chatbot.

### 6.3 Why decoupled?

- ML inference (CatBoost, SHAP, sentence-transformers, torch) lives naturally in Python.
- The interactive UI, auth, and tenant routing live naturally in Next.js.
- The cookie-forwarding rewrite lets the browser talk to one origin while two runtimes cooperate.

---

## 7. Frontend Analysis

### 7.1 App Router structure

The frontend uses the Next.js App Router with a **route group** `(tenant-app)` and a dynamic `[slug]` segment so that every tenant lives under `/{slug}/...`. The tenant layout ([layout.tsx](frontend/app/(tenant-app)/[slug]/layout.tsx)) is a **Server Component** that runs on every tenant request and performs:

1. **Session read** — `auth.api.getSession({ headers })`. If unauthenticated → `redirect("/login")`.
2. **Org lookup** — find `organization` by `slug`. If none → `redirect("/")`.
3. **Membership check** — find the `member` row for `(org.id, user.id)`. If the user is not a member, it tries to redirect them to *their own* org's `/home`, else `/`.
4. **Module entitlement load** — join `org_module` with `module_registry`, keep modules where `enabled && globalEnabled`.
5. **Per-route authorization guard** — using `x-pathname` header, match the path against `MODULE_ROUTES`; if the module isn't enabled → "Module disabled", if `can(principal, perm)` is false → "Insufficient permissions". Otherwise render children.
6. **Context** — provides `TenantInfo` (slug, orgId, orgName, packageId, enabledModules, userRole, platformRole) via `TenantProvider`.
7. **Chrome** — renders `ThemeSlider`, `ImpersonationBanner`, `TenantSidebar`, and the `FloatingChatbot`.

### 7.2 Module pages

Each module page is a Client Component under `modules/`. Example: **Grade Prediction** ([grade-prediction/page.tsx](frontend/app/(tenant-app)/[slug]/modules/grade-prediction/page.tsx)):

- Two input modes via `ModeSwitch`: `"manual"` and `"csv"`.
- **Manual**: `GradePredictionPanel` collects metrics → on result sets `livePrediction` + `liveInput` → renders a "Live Prediction" banner (predicted SGPA, risk level with color coding, top contributing factor) plus a full `StudentAnalyticsDashboard`.
- **CSV**: `CsvModePanel` (module="grade") supports single or batch.
- Risk color coding: high → red, mid → amber, else → emerald.
- Empty state shown until a prediction exists.

### 7.3 AI Chatbot page

The chatbot UI ([ai-chatbot/page.tsx](frontend/app/(tenant-app)/[slug]/modules/ai-chatbot/page.tsx)) maintains state for messages, `sessionId`, typing animation (`12ms` per char), active sources, memory items, and utilization. It POSTs to `/api/v1/chat/` with `{ session_id, message }`. It renders:
- **Disambiguation cards** when the backend returns multiple matching students (`requires_selection`).
- **Structured prediction results** (metrics grid + recharts).
- **Command shortcuts**: `@grade`, `@career`, `@subject`, `@9box`.
- **Export chat** as JSON.

### 7.4 Server actions

`actionts/admin/module-actions.ts` (`"use server"`) provides Super-Admin-only operations:
- `getModuleMatrix()` — org × module grid.
- `toggleOrgModule()` — upsert `org_module` + write `audit_log`.
- `setModuleGlobal()` — update `module_registry.globalEnabled`.
- All guarded by `requireSuperAdmin()`.

### 7.5 Typed API client

`lib/api/predictions.ts` exposes `predictSGPA`, `predictSubject`, `predictCareer`, `predictNineBox`, each calling `apiPost<T>()` from `lib/api/client.ts`, with full TypeScript interfaces mirroring the Pydantic schemas.

---

## 8. Backend Analysis

### 8.1 Application entry — `main.py`

- Uses a **FastAPI lifespan** context manager to **load all four ML engines at startup** (so the first request isn't penalized by cold model loads).
- Registers all routers with RBAC dependencies.
- Configures **CORS** from env (`CORS_ALLOW_ORIGINS`).
- Installs `SecurityMiddleware`.
- Defines a **global exception handler** and a `/health` endpoint.

### 8.2 Auth subsystem

| File | Responsibility |
|------|----------------|
| `auth/principal.py` | Resolves caller from session cookie or Bearer token. Queries shared `session` + `user` + `member` + `org_module` tables. **30-second in-process TTL cache** keyed by token. Returns a `Principal` dataclass (`user_id`, `platform_role`, `org_id`, `org_role`, `modules` set, `is_service`, `is_authenticated`). |
| `auth/matrix.py` | `PLATFORM_PERMS` + `ORG_PERMS` dicts; `has_permission(platform_role, org_role, perm)` grants if **either** plane grants. Super admins → `{"*"}`. |
| `auth/deps.py` | FastAPI dependency `require(permission, module)`. Service accounts and super admins bypass role/module gates. Returns `Principal`. |

### 8.3 ML engines (`core/`)

- **`SGPAMLEngine`** (singleton) — loads `sgpa_predictor.cbm` (CatBoostRegressor) + `feature_columns.json` at startup.
- **`CareerMLEngine`** — `predict_career()` returns `(best_career, confidence, alternatives, contributing_factors)`. Computes **SHAP values** via `get_feature_importance(pool, type="ShapValues")`, returning the **top 5** contributing factors.
- The 9-box and subject engines follow the same singleton + SHAP pattern.

### 8.4 Module routers (`modules/`)

Each predictor has its own router (see [Section 11](#11-api-documentation) for full endpoint list). They share a pattern: a single-prediction endpoint, a `/batch` CSV-upload endpoint, and (for grade) a `/dashboard` analytics endpoint. The `batch_predictor` router operates on the **whole students table** for cohort-level analytics.

### 8.5 Chatbot subsystem

The chatbot is the most intricate part of the backend. See [Section 12](#12-ai-module-analysis) for the complete flow.

---

## 9. Database Analysis

### 9.1 Auth schema (`auth-schema.ts`, Drizzle)

| Table | Key columns |
|-------|-------------|
| `user` | id, name, email, emailVerified, image, **role** (platform role), banned, banReason, banExpires |
| `session` | id, expiresAt, **token**, ipAddress, userAgent, userId, impersonatedBy |
| `account` | OAuth/credential accounts |
| `verification` | email/verification tokens |
| `organization` | id, name, slug, logo, **metadata** (JSON: packageId, tenantDbName) |
| `member` | id, organizationId, userId, **role** (org role) |
| `invitation` | org invitations |

### 9.2 RBAC schema (`rbac-schema.ts`, Drizzle)

| Table | Purpose |
|-------|---------|
| `moduleRegistry` | id, name, description, **globalEnabled**, sortOrder — the catalog of modules |
| `orgModule` | id, organizationId, moduleId, **enabled**, updatedBy, updatedAt (unique on org+module) — per-org entitlement |
| `auditLog` | id, actorUserId, organizationId, action, detail (jsonb), createdAt |

### 9.3 Billing schema (`package-schema.ts`, Drizzle)

`packages`, `promotions`, `loyaltyRedemptionRules`, `subscriptions`, `durationDiscounts`, `volumeDiscounts`. Enums: `packageTierEnum` (silver/gold/platinum/custom), `subscriptionStatusEnum` (active/suspended/expired/cancelled).

### 9.4 Student & chat schema (`chatbot/models.py`, SQLAlchemy — shared backend DB)

| Table | Name | Notes |
|-------|------|-------|
| `Student` | `students` | ~60 student-attribute columns (PK `student_id` String(50), `name` indexed). Grouped into: demographics, academic history (`hsc_gpa`, `ssc_gpa`, `current_sgpa`, `past_semester_sgpa_1/2`, `next_semester_sgpa`), skills/interests (programming/business/creative/hardware/math interest, analytical/communication/problem-solving), career fields (`tech_score`, `business_score`, `preferred_career_path`, `career_orientation`), 9-box fields (`performance_score`, `potential_score`, `nine_box_position`), plus `embedding Vector(384)` and `created_at` |
| `ChatSession` | `chat_sessions` | `session_id` (UUID PK), `selected_student_id`, `last_resolved_student_id`, `pending_fields` (JSON), `last_intent`, `last_tool_called`, `last_tool_summary`, `context` (JSON) |

The async engine (`chatbot/database.py`) reads `DATABASE_URL`, sets pool size 10 / max overflow 20, and `init_db()` creates the `vector` extension and all tables.

### 9.5 Per-tenant database schema (`db/tenant-schema.ts` + `db/tenant-db-manager.ts`, Drizzle)

The frontend implements a **database-per-tenant** provisioning system, separate from the shared backend `students` table:

| Table | Columns |
|-------|---------|
| `student` | id, student_id (unique), name, email, department, semester, cgpa, metadata (jsonb), timestamps (indexes on student_id, department) |
| `grade_prediction` | id, student_id (FK→student, cascade), course_code, predicted_grade, confidence, factors (jsonb), created_at |
| `career_recommendation` | id, student_id (FK→student, cascade), career_path, match_score, skills_gap (jsonb), recommendations (jsonb), created_at |
| `chat_history` | id, student_id (FK→student, set null), user_id, messages (jsonb), timestamps |

`tenant-db-manager.ts` exposes `createTenantDatabase(slug)` (runs `CREATE DATABASE`, then `runTenantMigrations`), `getTenantDb(name)`, `deleteTenantDatabase(slug)`, and `closeAllTenantPools()`. The provisioned DB name is stored in `organization.metadata.tenantDbName`.

> **Critical architectural note:** There are effectively **two parallel data worlds**. (1) The **shared backend DB** (`students`, `chat_sessions`) that the ML engines and chatbot actually read/write — this has **no `organization_id`**, so ML/chatbot data is **not tenant-isolated**. (2) The **per-tenant Drizzle databases** (`student`/`grade_prediction`/…) created by provisioning. The backend ML/chatbot pipeline does **not** currently read from the per-tenant databases. See [Limitations](#30-project-limitations).

---

## 10. Authentication

### 10.1 Identity provider — Better Auth

`lib/auth.ts` configures Better Auth with:
- **Email/password** enabled.
- **Google OAuth** via `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- **Drizzle adapter** (`provider: "pg"`).
- **Admin plugin** with platform roles `guest`, `user`, `support`, `super_admin`, and legacy `admin` (== super_admin). `defaultRole: "user"`, `adminRoles: ["admin", "super_admin"]`.
- **Organization plugin** (`allowUserToCreateOrganization: true`).
- **Trusted origins**: localhost:3000, the production domain, and the configured `BETTER_AUTH_URL`.
- **Cookies**: `sameSite: "lax"`, secure in production.
- **After-hook**: clears `active-org-slug` and `platform-role` cookies on sign-out.

### 10.2 Cookie forwarding to FastAPI

`next.config.ts` rewrites `/api/v1/:path*` → `${BACKEND_URL}/api/v1/:path*` (default `http://localhost:8001`). `skipTrailingSlashRedirect: true` avoids 308 redirects that would drop the session cookie. The `better-auth.session_token` cookie is forwarded so FastAPI can resolve the principal.

### 10.3 Defense in depth (4 layers)

```
Layer 1: Next.js middleware            (route-level gate)
Layer 2: Tenant server layout          (membership + module + permission)
Layer 3: Next.js API routes / rewrites (cookie forwarding)
Layer 4: FastAPI principal + require() (server-side re-check on every API call)
```

The backend **always re-checks** permissions — the UI gate only prevents showing pages; it is not the security boundary.

---

## 11. API Documentation

> All backend routes are mounted in `main.py` with explicit prefixes. The frontend reaches them through the Next rewrite (`/api/v1/*` → FastAPI). Every prediction/chat/admin router is gated by `require(permission, module=...)` declared at registration in `main.py`. The **router-level paths** below combine with the **prefix** to form the full URL.

### 11.1 Grade (SGPA) predictor — prefix `/api/v1/prediction/sgpa` · gate `predict:single` + module `grade-prediction`

| Method | Full path | Purpose | Response model |
|--------|-----------|---------|----------------|
| POST | `/api/v1/prediction/sgpa/` | Single SGPA prediction | `PredictionResponse` |
| POST | `/api/v1/prediction/sgpa/batch` | CSV file batch (`UploadFile`) | `List[PredictionResponse]` |
| POST | `/api/v1/prediction/sgpa/dashboard` | Analytics | `DashboardResponse` |

**`PredictionResponse`**: `predicted_sgpa`, `risk_level`, `contributing_factors[]`.

### 11.2 9-Box / Growth-potential — prefix `/api/v1/prediction/9box` · gate `predict:single` + module `growth-potential`

| Method | Full path | Purpose | Response model |
|--------|-----------|---------|----------------|
| POST | `/api/v1/prediction/9box/` | Single 9-box prediction | `NineBoxPredictionResponse` |
| POST | `/api/v1/prediction/9box/batch` | CSV file batch | `List[NineBoxPredictionResponse]` |

Uses a **service dependency** (`get_nine_box_service`). The engine runs **two** CatBoost classifiers (performance + potential).

### 11.3 Career predictor — prefix `/api/v1/prediction/career` · gate `predict:single` + module `career-guidance`

| Method | Full path | Purpose | Response model |
|--------|-----------|---------|----------------|
| POST | `/api/v1/prediction/career/career` | Single career prediction | `CareerPredictionResponse` |
| POST | `/api/v1/prediction/career/batch` | CSV file batch | `List[CareerPredictionResponse]` |

Returns best career, confidence, alternatives, and SHAP contributing factors.

### 11.4 Subject predictor — prefix `/api/v1/prediction/subject` · gate `predict:single` + module `subject-prediction`

| Method | Full path | Purpose | Response model |
|--------|-----------|---------|----------------|
| POST | `/api/v1/prediction/subject/subject_choice` | Single subject prediction | `SubjectPredictionOutput` |
| POST | `/api/v1/prediction/subject/batch` | CSV file batch | `List[SubjectPredictionOutput]` |

### 11.5 Batch / cohort analytics — prefix `/api/v1/prediction/batch` · gate `predict:batch` + module `batch-prediction`

| Method | Full path | Purpose | Response model |
|--------|-----------|---------|----------------|
| GET | `/api/v1/prediction/batch/overview` | Cohort overview | `OverviewResponse` |
| POST | `/api/v1/prediction/batch/predict` | Cohort prediction (filtered) | `PredictResponse` |
| POST | `/api/v1/prediction/batch/prescriptions` | Prescriptive recommendations | `PrescriptionResponse` |
| POST | `/api/v1/prediction/batch/forecast` | Forecasting | `ForecastResponse` |

### 11.6 CSV mode — prefix `/api/v1/prediction/csv` · gate `predict:single`

| Method | Full path | Purpose | Response model |
|--------|-----------|---------|----------------|
| GET | `/api/v1/prediction/csv/students` | List students from the DB | `StudentListResponse` |
| GET | `/api/v1/prediction/csv/students/{student_id}` | Fetch one student | — |
| GET | `/api/v1/prediction/csv/{module}/predict/{student_id}` | Predict for a stored student | `CsvSingleResult` |
| GET | `/api/v1/prediction/csv/{module}/batch?limit=` | Batch predict (limit 1–1000, default 100) | — |

### 11.7 Chatbot — prefix `/api/v1` + router prefix `/chat` · gate `chatbot:use` + module `ai-chatbot`

| Method | Full path | Purpose |
|--------|-----------|---------|
| POST | `/api/v1/chat/` | Send a message → `ChatResponse` |
| POST | `/api/v1/chat/reset` | Reset session (clears selected student, pending fields, intent, context) → `ResetResponse` |
| GET | `/api/v1/chat/health` | Chatbot component health (LLM + dispatcher) |

**`ChatRequest`**: `session_id` (optional UUID), `message` (1–2000 chars). **`ChatResponse`**: `session_id`, `message`, `intent`, `tool_called`, `result`, `students_found`, `pending_fields`, `requires_selection`, `requires_input`.

### 11.8 Admin — prefix `/api/v1` · gate `dataset:upload`

| Method | Full path | Purpose |
|--------|-----------|---------|
| POST | `/api/v1/admin/upload-csv` | Upload CSV; chunked write (1MB); `BackgroundTasks` ingestion; returns **HTTP 202** |

### 11.9 Platform / health (no module gate)

| Method | Full path | Purpose |
|--------|-----------|---------|
| GET | `/health` | Liveness + per-engine `loaded` status + cache stats + `cold_start_ms` |
| GET | `/api/v1/auth/whoami` | Debug: resolve the calling principal from the forwarded cookie |

### 11.10 Next.js API routes (frontend, not FastAPI)

| Method | Path | Purpose |
|--------|------|---------|
| ALL | `/api/auth/[...all]` | Better Auth handler |
| GET/POST | `/api/auth/verify-membership` | Verify org membership |
| GET | `/api/check-slug` | Org slug availability check |
| POST | `/api/tenant/provision` | `createTenantDatabase(slug)` + update `organization.metadata.tenantDbName` |
| — | `/api/tenant` | Tenant operations |

---

## 12. AI Module Analysis

### 12.1 Chatbot orchestration flow (`mcp_dispatcher.py`)

```
Incoming message
   │
   ├─► Greeting Check      (GREETING_WORDS — avoid searching on "hi")
   ├─► Help Check          (help text)
   ├─► List Query          (cohort listing → list_students tool)
   ├─► @ Mention Check     (MODULE_MENTIONS: @sgpa/@career/@9box/@subject)
   ├─► Entity Resolution   (StudentResolver — runs BEFORE intent detection)
   ├─► Fast Keyword Intent (keyword → intent → tool)
   └─► LLM Fallback        (Ollama phi3:mini decides tool or replies)
   │
   ▼
ChatSession persisted (selected/last-resolved student, pending fields, last intent/tool/summary)
```

The call chain is: `router.py` (`/chat/`) → `service.py` (`ChatbotService`) → `mcp_dispatcher.py` (`get_dispatcher().process_message`). Verified handler steps inside `process_message`: pending-input check → greeting check → help check → list-students check → entity resolution → `_detect_intent_fallback` (fast keyword) → if `UNKNOWN`, LLM fallback via `get_llm_client().generate`. `@`-mention modules are handled via `MODULE_MENTIONS` and `_execute_mentioned_modules` (supports **multi-prediction** in one message).

### 12.1a Full chatbot module inventory (`backend/app/chatbot/`)

| File | Responsibility |
|------|----------------|
| `router.py` | FastAPI `/chat/`, `/chat/reset`, `/chat/health` |
| `service.py` | `ChatbotService` thin layer over the dispatcher |
| `mcp_dispatcher.py` | Core orchestration (`process_message`) |
| `entity_resolver.py` | `StudentResolver` |
| `intent_router.py` | `IntentRouter` (intent routing) |
| `tool_router.py` | `ToolRouter` (tool routing) |
| `fallback_intent.py` | `FallbackIntentDetector` / `detect_intent_fallback` |
| `conversation_state.py` | `ConversationState` |
| `tools.py` | `ToolExecutor` (7 tools) |
| `langchain_tools.py` | LangChain tool adapters (`get_langchain_tools`) |
| `langchain_orchestrator.py` | `ConversationBufferWindowMemory (k=10)`; `is_langchain_available()` |
| `llm_client.py` | `OllamaClient` (phi3:mini) |
| `prompts.py` + `prompts/system_prompt_v1.txt` | Prompt loader + `verify_prompt_at_startup`, `get_prompt_version` |
| `models.py` | `Student` + `ChatSession` |
| `database.py` | Async engine + pgvector + `init_db`/`close_db` |
| `schemas.py` | `ChatRequest`/`ChatResponse`/`ResetRequest`/`ResetResponse`, `IntentType` |
| `security.py` | `SecurityMiddleware`, `validate_tool_call` |
| `performance.py` | `AsyncTTLCache`, `get_cache_stats` |
| `logging_config.py` | `setup_logging`, `RequestLogger` |
| `startup.py` | `run_startup_checks` |
| `ingest_csv.py` | CSV ingestion + embeddings |
| `admin_router.py` | `/admin/upload-csv` |

### 12.2 Entity Resolution (`entity_resolver.py`)

`StudentResolver` resolves a student in this order:
1. **Explicit student ID** pattern `[A-Z]{2,4}[-_]?\d{3,6}`.
2. **Follow-up pronoun** detection ("him", "her", "they") → use `last_resolved_student_id`.
3. **Name search** — exact `ILIKE` → semantic vector search.

Returns `ResolvedEntity` with status: `exact`, `single`, `ambiguous`, or `not_found`. Ambiguity triggers the disambiguation cards in the UI.

### 12.3 Tools (`tools.py`)

`ToolExecutor` implements **7 tools**:

| Tool | Purpose |
|------|---------|
| `search_student` | Semantic + exact search (pgvector cosine distance) |
| `get_student` | Fetch a student record |
| `predict_sgpa` | Call grade endpoint |
| `predict_career` | Call career endpoint |
| `predict_9box` | Call 9-box endpoint |
| `predict_subject` | Call subject endpoint |
| `list_students` | Cohort listing |

Tools that call ML endpoints attach an `x-internal-token` header. Field-mapping helpers translate between human terms and model encodings (gender, department, work environment, etc.).

### 12.4 LLM client (`llm_client.py`)

`OllamaClient` calls `http://localhost:11434/api/generate`, model `phi3:mini`, `temperature=0.0`, `num_predict=512`, `num_ctx=4096`. It parses a tool call by extracting the first `{...}` JSON object from the raw response; otherwise returns plain message content. Returns `LLMResponse`.

### 12.5 LangChain memory (`langchain_orchestrator.py`)

`LangChainOrchestrator` uses `ChatOllama` + `ConversationBufferWindowMemory (k=10)`. It is **additive** — it provides conversation memory context but does **not** replace the MCP dispatcher.

### 12.6 System prompt (`system_prompt_v1.txt`)

> "You are an AI orchestrator for AI Mentor. You call tools to get data. **NEVER predict values yourself**." Lists 6 tools and the JSON output format.

### 12.7 Embeddings & ingestion (`ingest_csv.py`)

- Model: `sentence-transformers/all-MiniLM-L6-v2` (384-dim).
- `generate_embedding_text()` concatenates name + district + preferred_department + preferred_career_path.
- Batch insert **100 records at a time**.
- `COLUMN_MAPPING` maps **63 CSV columns**.
- `keep_default_na=False` + `na_values=[""]` preserves literal `"None"` strings (so they aren't coerced to NaN).

---

## 13. User Journey

```
1. User visits /{slug}/...                → middleware + layout authenticate
2. Not logged in?                         → redirect /login
3. Logs in (email/password or Google)     → Better Auth sets session cookie
4. Belongs to org?                         → membership check; else redirected to own org/home
5. Lands on /{slug}/home                   → sidebar shows only enabled modules
6. Opens Grade Prediction                  → enters 13 metrics (manual) OR uploads CSV
7. Clicks "Predict SGPA"                   → POST /api/v1/.../  (cookie forwarded → FastAPI)
8. FastAPI checks predict:single           → runs CatBoost + SHAP
9. UI shows predicted SGPA + risk + factors + analytics dashboard
10. Opens AI Chatbot                        → "predict career for AB-1234"
11. Backend resolves entity → detects intent → calls predict_career tool
12. UI renders structured result with contributing factors
```

### Role-dependent capability

| Org role | Can do |
|----------|--------|
| owner | everything in org incl. members/settings/billing, batch, upload |
| admin | members/settings, batch, upload, predictions, chatbot, dashboards |
| analyst | upload + single + batch + chatbot + dashboards (no member mgmt) |
| mentor / member (legacy) | single prediction + chatbot + dashboards |
| viewer | dashboards only |
| guest | nothing |

---

## 14. Admin Journey

### 14.1 Super Admin (platform)

A `super_admin` (or legacy `admin`) bypasses all role/module gates. Their console (per RBAC.md) lets them:
- Manage **packages & pricing** (`platform:packages`).
- Create/suspend **organizations** (`platform:orgs`).
- Manage **users / ban** (`platform:users`).
- **Impersonate** users (`platform:impersonate`) — surfaced via `ImpersonationBanner`.
- **Toggle modules per org** (`modules:toggle`) — `toggleOrgModule()` upserts `org_module` and writes `audit_log`.
- Set module **global enable** (`setModuleGlobal()` → `module_registry.globalEnabled`).
- View the **audit log** (`audit:read`).

### 14.2 Support role

`support` gets a limited platform set: `platform:impersonate`, `audit:read`, `dashboard:view`, `predict:single`, `chatbot:use`.

### 14.3 Module toggle flow

```
Super Admin → getModuleMatrix() → grid of (org × module)
            → toggleOrgModule(org, module, enabled)
                 ├─ upsert org_module
                 └─ insert audit_log (actor, org, action, detail)
```

A module is usable by an org only if `org_module.enabled && module_registry.globalEnabled`.

---

## 15. Role Management

### 15.1 Two role planes

| Plane | Source column | Roles |
|-------|---------------|-------|
| Platform | `user.role` | super_admin, support, user, guest (legacy admin == super_admin) |
| Organization | `member.role` | owner, admin, analyst, mentor, viewer, guest (legacy member == mentor) |

### 15.2 Permission matrix (verified — `rbac.ts` / `matrix.py`)

**Platform permissions:**

| Role | Permissions |
|------|-------------|
| super_admin / admin | ALL (`*`) |
| support | platform:impersonate, audit:read, dashboard:view, predict:single, chatbot:use |
| user | (none) |
| guest | (none) |

**Organization permissions:**

| Role | Permissions |
|------|-------------|
| owner | org:manageMembers, org:settings, org:billing, dataset:upload, predict:single, predict:batch, chatbot:use, dashboard:view |
| admin | org:manageMembers, org:settings, dataset:upload, predict:single, predict:batch, chatbot:use, dashboard:view |
| analyst | dataset:upload, predict:single, predict:batch, chatbot:use, dashboard:view |
| mentor / member | predict:single, chatbot:use, dashboard:view |
| viewer | dashboard:view |
| guest | (none) |

### 15.3 Full permission list (14)

`platform:packages`, `platform:orgs`, `platform:users`, `platform:impersonate`, `modules:toggle`, `audit:read`, `org:manageMembers`, `org:settings`, `org:billing`, `dataset:upload`, `predict:single`, `predict:batch`, `chatbot:use`, `dashboard:view`.

### 15.4 Grant rule

```python
def has_permission(platform_role, org_role, perm):
    if is_super_admin(platform_role): return True
    if perm in PLATFORM_PERMS[platform_role]: return True
    return perm in ORG_PERMS[org_role]
```

The frontend `can()` mirrors this exactly. **They must be kept in sync** (noted in both files).

---

## 16. Feature Breakdown

| Feature | Description | Key files |
|---------|-------------|-----------|
| SGPA prediction | Regression + risk level + SHAP factors | grade_predictor/*, sgpa_ml_engine.py |
| Career prediction | Best career + alternatives + SHAP | career_predictor/*, career_ml_engine.py |
| 9-Box talent grid | Performance/potential placement | nine_box_predictor/* |
| Subject prediction | Department/subject recommendation | subject_predictor/* |
| Cohort analytics | Overview, forecast, prescriptions | batch_predictor/* |
| AI Chatbot | NL → entity resolution → intent → tool | chatbot/* |
| Semantic search | pgvector cosine on 384-dim embeddings | tools.py, ingest_csv.py |
| CSV ingestion | Background batch ingest w/ embeddings | ingest_csv.py, admin_router.py |
| Multi-tenancy | Path-based `/{slug}/` | (tenant-app)/[slug]/layout.tsx |
| Two-tier RBAC | Platform × org roles | rbac.ts, matrix.py |
| Module entitlements | Per-org module toggles | org_module, module-actions.ts |
| Audit logging | Track admin actions | auditLog, module-actions.ts |
| Impersonation | Support/admin impersonate users | Better Auth admin plugin |
| Billing/packages | Tiered subscriptions + discounts | package-schema.ts |
| Tenant provisioning | Create tenant database | api/tenant/provision/route.ts |

---

## 17. Module Breakdown

The 6 product modules (`MODULES` in `rbac.ts`) and their route/permission mapping (`MODULE_ROUTES` in layout.tsx):

| Module id | Route segment | Required permission |
|-----------|---------------|---------------------|
| grade-prediction | /modules/grade-prediction | predict:single |
| batch-prediction | /modules/batch-prediction | predict:batch |
| career-guidance | /modules/career-guidance | predict:single |
| ai-chatbot | /modules/ai-chatbot | chatbot:use |
| growth-potential | /modules/growth-potential | predict:single |
| subject-prediction | /subject-prediction | predict:single |

`modulePermission(moduleId)` returns `predict:batch` for `batch-prediction`, else `predict:single`.

---

## 18. Important Functions

| Function | File | Role |
|----------|------|------|
| `can(principal, perm)` | rbac.ts | Frontend permission check |
| `effectivePermissions(platformRole, orgRole)` | rbac.ts | Union of both planes (UI display) |
| `has_permission(...)` | matrix.py | Backend permission check |
| `require(permission, module)` | deps.py | FastAPI dependency gate |
| `Principal` resolution | principal.py | Identity from cookie/token, 30s cache |
| `predict_career()` | career_ml_engine.py | Career inference + SHAP top-5 |
| `StudentResolver.resolve()` | entity_resolver.py | Entity resolution pipeline |
| `ToolExecutor` (7 tools) | tools.py | Chatbot tool execution |
| `generate_embedding_text()` | ingest_csv.py | Build embedding source text |
| `toggleOrgModule()` | module-actions.ts | Module entitlement + audit |
| `getSession()` + guard | layout.tsx | Server-side tenant authorization |

---

## 19. Configuration

### 19.1 Backend environment variables

| Var | Purpose |
|-----|---------|
| `DATABASE_URL` | Async PostgreSQL DSN (asyncpg) |
| `CORS_ALLOW_ORIGINS` | Allowed CORS origins |
| Ollama URL | `http://localhost:11434` (phi3:mini) |
| `x-internal-token` | Internal auth header for tool→endpoint calls |

### 19.2 Frontend environment variables

| Var | Purpose |
|-----|---------|
| `BETTER_AUTH_URL` | Auth base URL / trusted origin |
| `BACKEND_URL` | FastAPI base (default `http://localhost:8001`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `NODE_ENV` | Toggles secure cookies |

### 19.3 next.config.ts highlights

- Rewrites `/api/v1/:path*/` and `/api/v1/:path*` → backend.
- `skipTrailingSlashRedirect: true`.
- `reactCompiler: true`.

---

## 20. Dependencies

### 20.1 Backend (`requirements.txt`, key)

`fastapi`, `uvicorn`, `sqlalchemy[asyncio]`, `asyncpg`, `pgvector`, `catboost`, `pandas`, `numpy`, `scikit-learn`, `shap`, `sentence-transformers`, `httpx`, `pydantic`, `langchain`, `langchain-community`, `cachetools`, `torch==2.12.0+cpu`.

### 20.2 Frontend (`package.json`, key)

`next@16.1.1`, `react@19.2.0`, `better-auth@1.4.10`, `drizzle-orm@0.45.1`, `chart.js@4.4.1`, `recharts@2.15.4`, `@tanstack/react-table@8.21.3`, `@tanstack/react-form@1.27.7`, `@dnd-kit/*`, Radix UI, `lucide-react`, `gsap`, `motion`, `tailwindcss@4`, `zod@4.3.5`, `sonner`, `vaul`.

---

## 21. Security

| Control | Implementation |
|---------|----------------|
| Defense in depth | 4 layers: middleware → server layout → Next API → FastAPI |
| Server-side re-check | FastAPI `require()` validates every API call regardless of UI |
| Principal caching | 30s TTL cache keyed by token (principal.py) |
| Rate limiting | 30 req/60s per IP for chat endpoints (security.py) |
| Request size limit | 10KB for chat endpoints |
| Security headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-Rate-Limit-Remaining` |
| Tool allowlist | `ALLOWED_TOOLS` set restricts callable tools |
| Internal token | `x-internal-token` header for internal endpoint calls |
| Cookie hardening | `sameSite: lax`, secure cookies in production |
| Trailing-slash safety | `skipTrailingSlashRedirect` prevents cookie loss on 308 |
| Non-root container | Dockerfile runs as `appuser` |
| Audit logging | `audit_log` records admin actions |
| LLM guardrail | System prompt forbids the LLM predicting values itself |

---

## 22. Performance

| Optimization | Detail |
|--------------|--------|
| ML preload | All 4 CatBoost engines loaded at FastAPI startup (lifespan) |
| Student cache | `AsyncTTLCache` 500 entries, 5min TTL (performance.py) |
| Embedding cache | 200 entries, 10min TTL |
| Principal cache | 30s TTL keyed by token |
| Batch embeddings | 100 records/batch on ingestion |
| Async DB | SQLAlchemy async + asyncpg, pool 10 / overflow 20 |
| Background ingestion | CSV upload returns 202; ingestion runs in background task |
| Perf monitoring | `PerformanceMonitor` logs ops >1s |
| `async_timeout` decorator | Bounds slow operations |
| React Compiler | Enabled for frontend optimization |
| Fast keyword intent | Short-circuits before LLM call where possible |

---

## 23. Error Handling

- **FastAPI global exception handler** in `main.py` catches unhandled errors.
- **Entity resolution** returns explicit statuses (`exact`/`single`/`ambiguous`/`not_found`) rather than throwing, so the UI can render disambiguation or "not found" gracefully.
- **LLM JSON parsing** is defensive — it extracts the first `{...}` and falls back to plain text if no tool call is found.
- **Tenant layout** handles every failure with a redirect (no org → `/`, not a member → own org or `/`, unauthenticated → `/login`) and renders `ModuleAccessDenied` rather than 500-ing on authorization failure.
- **Metadata parsing** (`organization.metadata`) is wrapped in try/catch with a `"gold"` default.
- **CSV ingestion** preserves literal `"None"` strings via `keep_default_na=False`.

---

## 24. Deployment

### 24.1 Backend — `backend/docker-compose.yml` (verified)

App: **FastAPI `AI Mentor SaaS Unified API` v2.1.0**. Compose defines **four services** on a bridge network `ai_mentor_network`:

| Service | Image / build | Ports | Key config |
|---------|---------------|-------|-----------|
| `postgres` | `pgvector/pgvector:pg15` | **5433→5432** | user/pw `postgres`, DB `ai_mentor`, mounts `./init.sql`, healthcheck `pg_isready` |
| `ollama` | `ollama/ollama:latest` | 11434 | `OLLAMA_HOST=0.0.0.0`, `OLLAMA_NUM_PARALLEL=1`, `OLLAMA_MAX_LOADED_MODELS=1`, **4G memory reservation**, healthcheck `/api/tags` |
| `api` | build `./Dockerfile` | **8001→8000** | `DATABASE_URL=postgresql+asyncpg://postgres:postgres@postgres:5432/ai_mentor`, `OLLAMA_BASE_URL=http://ollama:11434`, `OLLAMA_MODEL=phi3:mini`, depends on healthy postgres, runs `uvicorn ... --reload` |
| `ollama-pull` | `curlimages/curl:latest` | — | One-time job: `POST /api/pull {"name":"phi3:mini"}` |

Named volumes: `postgres_data`, `ollama_data`, `model_cache`. The `api` healthcheck hits `/health`.

### 24.2 Backend image — `backend/Dockerfile`

`python:3.11-slim`, non-root `appuser`, container port 8000, `curl`-based health check.

### 24.3 Frontend

Next.js 16; per ROADMAP deployed via **Coolify**. Production domain `intellector.daffodilglobal.ai`.

### 24.4 Port map (effective)

| Service | Host port | Container port |
|---------|-----------|----------------|
| Frontend (Next.js) | 3000 | 3000 |
| Backend (FastAPI) | 8001 | 8000 |
| Ollama | 11434 | 11434 |
| PostgreSQL | 5433 | 5432 |

> Per ROADMAP, the Ollama healthcheck can appear cosmetically "unhealthy" even when functioning.

---

## 25. Project Execution Flow

### 25.1 Backend startup

```
uvicorn → FastAPI app
  └─ lifespan() start
       ├─ load sgpa_predictor.cbm + feature_columns.json
       ├─ load career model
       ├─ load 9-box model
       ├─ load subject model
       ├─ init_db(): CREATE EXTENSION vector; create tables
       └─ register routers + SecurityMiddleware + CORS
  └─ ready to serve
```

### 25.2 Frontend startup

```
next start → App Router
  └─ middleware registered
  └─ Better Auth initialized (Drizzle adapter)
  └─ rewrites /api/v1/* → BACKEND_URL
```

### 25.3 Runtime request (prediction)

```
Browser → /api/v1/grade/  (with session cookie)
  → Next rewrite → FastAPI :8001
  → require("predict:single", "grade-prediction")
      → resolve Principal (cookie → session/user/member/org_module)
      → has_permission(platform_role, org_role, "predict:single")
  → SGPAMLEngine.predict() + SHAP factors
  → JSON response → UI dashboard
```

---

## 26. Complete Data Flow

### 26.1 Chatbot data flow

```
User message
  → POST /api/v1/chat/  {session_id, message}
  → SecurityMiddleware (rate limit, size, headers)
  → require("chatbot:use", "ai-chatbot")
  → load/create ChatSession
  → MCP dispatcher:
       greeting? help? list? @mention?
       → StudentResolver (id → pronoun → name exact ILIKE → semantic vector)
       → intent (fast keyword OR Ollama phi3:mini)
       → ToolExecutor.run(tool)
            ├─ search/get → pgvector + SQL
            └─ predict_* → internal call to ML endpoint (x-internal-token)
       → LangChain memory updated (k=10)
  → persist ChatSession (selected/last student, pending fields, last tool summary)
  → ChatResponse (message, intent, tool_called, result, students_found,
                  requires_selection / requires_input)
  → UI renders text / disambiguation cards / structured metrics
```

### 26.2 Ingestion data flow

```
POST /admin/upload-csv (require dataset:upload)
  → chunked file write (1MB chunks)
  → return HTTP 202
  → background task: ingest_csv
       → read CSV (keep_default_na=False, na_values=[""])
       → map 63 columns (COLUMN_MAPPING)
       → for each batch of 100:
            generate_embedding_text() → all-MiniLM-L6-v2 → Vector(384)
            insert into students
```

---

## 27. External Services

| Service | Role | Endpoint / config |
|---------|------|-------------------|
| Ollama (phi3:mini) | LLM orchestration + fallback | `OLLAMA_BASE_URL` (compose: `http://ollama:11434`), `OLLAMA_MODEL=phi3:mini` |
| Google OAuth | Social login | via Better Auth `socialProviders` (`GOOGLE_CLIENT_ID`/`SECRET`) |
| PostgreSQL + pgvector | Primary datastore + vector search | `DATABASE_URL` (compose DB `ai_mentor`, host port 5433) |
| sentence-transformers (local) | Embeddings (all-MiniLM-L6-v2, 384-dim) | in-process |

> No third-party paid LLM API is used — reasoning is fully local via Ollama (phi3:mini).

---

## 28. File-by-File Analysis

> Condensed; each row states the file's single responsibility.

| File | Responsibility |
|------|----------------|
| backend/app/main.py | FastAPI entry; lifespan loads 4 ML engines; routers; CORS; SecurityMiddleware; /health; global exception handler |
| backend/app/auth/principal.py | Resolve `Principal` from cookie/token; 30s TTL cache; query session/user/member/org_module |
| backend/app/auth/matrix.py | PLATFORM_PERMS/ORG_PERMS; `has_permission`; mirrors rbac.ts |
| backend/app/auth/deps.py | `require(permission, module)` dependency; super-admin/service bypass |
| backend/app/core/sgpa_ml_engine.py | Singleton SGPA CatBoostRegressor loader (`get_model`) |
| backend/app/core/nine_box_ml_engine.py | Singleton; **two** CatBoostClassifiers (`performance_classifier.cbm` + `potential_classifier.cbm`); confidence = avg of both models' top-class proba |
| backend/app/core/career_ml_engine.py | Career classifier; `predict_career()` (`load_model`); SHAP top-5 |
| backend/app/core/subject_ml_engine.py | Singleton subject classifier |
| backend/app/modules/grade_predictor/router.py | prefix `/prediction/sgpa`: POST `/`, `/batch`, `/dashboard` |
| backend/app/modules/career_predictor/router.py | prefix `/prediction/career`: POST `/career`, `/batch` |
| backend/app/modules/nine_box_predictor/router.py | prefix `/prediction/9box`: POST `/`, `/batch` (service dep) |
| backend/app/modules/subject_predictor/router.py | prefix `/prediction/subject`: POST `/subject_choice`, `/batch` |
| backend/app/modules/batch_predictor/router.py | prefix `/prediction/batch`: GET `/overview`; POST `/predict`, `/prescriptions`, `/forecast` |
| backend/app/modules/csv_mode/router.py | prefix `/prediction/csv`: GET `/students`, `/students/{id}`, `/{module}/predict/{id}`, `/{module}/batch` |
| backend/app/chatbot/router.py | `/chat/`, `/chat/reset`, `/chat/health` |
| backend/app/chatbot/service.py | `ChatbotService` → dispatcher |
| backend/app/chatbot/mcp_dispatcher.py | Orchestration flow; ChatSession persistence; MODULE_MENTIONS; GREETING_WORDS; multi-prediction |
| backend/app/chatbot/intent_router.py / tool_router.py / conversation_state.py / fallback_intent.py | Intent routing, tool routing, conversation state, fallback intent detection |
| backend/app/chatbot/tools.py | ToolExecutor: 7 tools; pgvector search; field mapping |
| backend/app/chatbot/langchain_tools.py | LangChain tool adapters |
| backend/app/chatbot/entity_resolver.py | StudentResolver: id → pronoun → name → semantic |
| backend/app/chatbot/llm_client.py | OllamaClient phi3:mini; JSON tool-call extraction |
| backend/app/chatbot/langchain_orchestrator.py | ConversationBufferWindowMemory (k=10); additive |
| backend/app/chatbot/models.py | Student (`students`, ~60 cols, Vector 384) + ChatSession (`chat_sessions`) |
| backend/app/chatbot/database.py | Async engine; pool 10/20; init_db creates vector ext + tables |
| backend/app/chatbot/prompts.py | Prompt loader; verify_prompt_at_startup; get_prompt_version |
| backend/app/chatbot/schemas.py | IntentType enum; ChatRequest/ChatResponse/Reset* |
| backend/app/chatbot/security.py | SecurityMiddleware: rate limit, size, headers, tool allowlist |
| backend/app/chatbot/performance.py | AsyncTTLCache; get_cache_stats; PerformanceMonitor |
| backend/app/chatbot/startup.py / logging_config.py | Startup checks; structured logging |
| backend/app/chatbot/ingest_csv.py | CSV ingest; column map; batch-100 embeddings |
| backend/app/chatbot/admin_router.py | POST /admin/upload-csv; chunked write; BackgroundTasks; 202 |
| frontend/db/tenant-db-manager.ts | createTenantDatabase/getTenantDb/deleteTenantDatabase/runTenantMigrations |
| frontend/db/tenant-schema.ts | Per-tenant tables: student/grade_prediction/career_recommendation/chat_history |
| backend/app/chatbot/prompts/system_prompt_v1.txt | LLM orchestrator system prompt |
| frontend/app/(tenant-app)/[slug]/layout.tsx | Server auth + membership + module entitlement + per-route guard |
| frontend/app/(tenant-app)/[slug]/modules/grade-prediction/page.tsx | Manual/CSV modes; live prediction + analytics |
| frontend/app/(tenant-app)/[slug]/modules/ai-chatbot/page.tsx | Chat UI; disambiguation; structured results; export |
| frontend/lib/auth.ts | Better Auth config (email/pw + Google; admin + org plugins) |
| frontend/lib/rbac.ts | Central RBAC matrix; can(); effectivePermissions(); ENDPOINT_PERMISSIONS |
| frontend/lib/api/predictions.ts | Typed predict* functions |
| frontend/db/schema/auth-schema.ts | user/session/account/verification/org/member/invitation |
| frontend/db/schema/rbac-schema.ts | moduleRegistry/orgModule/auditLog |
| frontend/db/schema/package-schema.ts | packages/promotions/subscriptions/discounts |
| frontend/actionts/admin/module-actions.ts | getModuleMatrix/toggleOrgModule/setModuleGlobal (super-admin) |
| frontend/app/api/tenant/provision/route.ts | createTenantDatabase + metadata update |
| frontend/next.config.ts | Rewrites to backend; skipTrailingSlashRedirect; reactCompiler |

---

## 29. Code Patterns

| Pattern | Where | Why |
|---------|-------|-----|
| Singleton ML engine | core/*_ml_engine.py | Load model once, reuse across requests |
| Lifespan preloading | main.py | Avoid cold-start latency |
| Dependency-injected authz | deps.py `require()` | Declarative per-route permission |
| Mirror matrices | rbac.ts ↔ matrix.py | Same authz in both runtimes |
| MCP dispatcher | mcp_dispatcher.py | Pluggable tool orchestration |
| Entity resolution before intent | entity_resolver.py | Ground the conversation in a real student first |
| Additive LLM memory | langchain_orchestrator.py | Memory without replacing deterministic flow |
| SHAP explanations | career_ml_engine.py | Interpretable predictions |
| TTL caching | performance.py, principal.py | Cheap, bounded freshness |
| Background tasks | admin_router.py | Non-blocking long ingestion |
| Cookie-forwarding rewrite | next.config.ts | Single-origin browser, two runtimes |
| Server-component authz gate | layout.tsx | Authorize before render |
| Server actions for admin ops | module-actions.ts | Type-safe mutations + audit |

---

## 30. Project Limitations

> Verified from code/ROADMAP.

1. **Disconnected tenant-data isolation** — there are two parallel data worlds. A **database-per-tenant** system exists in the frontend (`tenant-db-manager.ts` provisions a DB; `tenant-schema.ts` defines `student`/`grade_prediction`/`career_recommendation`/`chat_history`). But the **backend ML/chatbot pipeline reads a single shared `students` table** (in `chatbot/models.py`) that has **no `organization_id`** and is **not** wired to the per-tenant databases. So in practice, ML predictions and chatbot queries are **not tenant-isolated**, even though provisioning machinery exists. This is the single biggest architectural gap.
2. **Google OAuth is configured but not fully real** (per ROADMAP — credentials wired, real flow pending).
3. **Ollama healthcheck cosmetically "unhealthy"** even when working.
4. **In-memory rate limiter** — not shared across instances; resets on restart and won't scale horizontally.
5. **Principal cache is in-process** (30s) — fine for one instance, but stale across a fleet.
6. **RBAC matrices are duplicated** (rbac.ts + matrix.py) and must be **manually kept in sync** — drift risk.
7. **No CI/CD** described (per ROADMAP).
8. **Light mode** for neon dashboards still pending (per ROADMAP).
9. **Single LLM model** (phi3:mini) — limited reasoning compared to hosted frontier models.
10. **Package id retained in metadata** but no longer drives module entitlements — potential confusion.

---

## 31. Future Improvements

1. **Unify the two data worlds.** Either (a) wire the backend ML/chatbot to read each org's provisioned per-tenant database (`tenantDbName` from `organization.metadata`), or (b) add `organization_id` to the shared `students`/`chat_sessions` tables and filter every query + tool by tenant. Highest priority — today predictions are not tenant-isolated.
2. **Centralize the RBAC matrix** (single source generated for both runtimes) to eliminate drift.
3. **Distributed rate limiting & principal cache** (e.g., Redis) for horizontal scaling.
4. **Real Google OAuth** end-to-end.
5. **CI/CD pipeline** (lint, type-check, tests, build, deploy).
6. **Light mode** theming for dashboards.
7. **Model upgrades / per-tenant model selection**; optionally hosted Claude models for richer orchestration.
8. **Streaming chat responses** from the backend (currently UI animates client-side).
9. **Observability** (structured logs, tracing, metrics) beyond `PerformanceMonitor`.
10. **Automated tests** for RBAC, entity resolution, and prediction endpoints.

---

## 32. Development Setup

### 32.1 Prerequisites

- Node.js (for Next.js 16 / React 19), Python 3.11, PostgreSQL with pgvector, Ollama with `phi3:mini` pulled.

### 32.2 Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
export DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/aimentor
export CORS_ALLOW_ORIGINS=http://localhost:3000
uvicorn app.main:app --reload --port 8001
# Models load at startup; /health should return OK
```

### 32.3 Ollama

```bash
ollama pull phi3:mini
ollama serve   # http://localhost:11434
```

### 32.4 Frontend

```bash
cd frontend
npm install
# .env.local:
#   BETTER_AUTH_URL=http://localhost:3000
#   BACKEND_URL=http://localhost:8001
#   GOOGLE_CLIENT_ID=... / GOOGLE_CLIENT_SECRET=...
#   DATABASE_URL=postgres://...
npx drizzle-kit push      # apply auth/rbac/billing schema
npm run dev               # http://localhost:3000
```

### 32.5 Data ingestion

```bash
# As a user with dataset:upload, POST a CSV to /api/v1/admin/upload-csv
# Ingestion runs in the background; embeddings are generated in batches of 100
```

---

## 33. Complete Feature List

- [x] Email/password authentication (Better Auth)
- [x] Google OAuth (configured)
- [x] Path-based multi-tenancy `/{slug}/`
- [x] Two-tier RBAC (platform × org)
- [x] Per-org module entitlements + global toggle
- [x] Super Admin module matrix console + audit log
- [x] Impersonation (support/admin)
- [x] SGPA (grade) prediction + risk + SHAP
- [x] Career prediction + alternatives + SHAP
- [x] 9-box / growth-potential prediction
- [x] Subject/department prediction
- [x] Cohort analytics (overview/predict/prescriptions/forecast)
- [x] AI chatbot (entity resolution → intent → tools)
- [x] @-mention command shortcuts (@grade/@career/@subject/@9box)
- [x] Semantic search (pgvector, 384-dim)
- [x] Conversation memory (LangChain, k=10)
- [x] CSV ingestion with background batch embeddings
- [x] Chat disambiguation cards
- [x] Export chat as JSON
- [x] Live prediction dashboards (recharts/chart.js)
- [x] Rate limiting + security headers
- [x] Tiered billing schema (packages/discounts/subscriptions)
- [x] Tenant database provisioning endpoint
- [ ] Tenant-isolated student data (NOT yet)
- [ ] CI/CD (NOT yet)
- [ ] Light mode dashboards (NOT yet)

---

## 34. Text Flowchart

```
                              ┌─────────────┐
                              │   Browser   │
                              └──────┬──────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │   Next.js middleware + layout    │
                    │   auth? member? module? perm?    │
                    └───────┬──────────────────┬───────┘
                  renders   │                  │  /api/v1/* (cookie)
                  page UI   │                  ▼
                            │          ┌────────────────┐
                            │          │    FastAPI      │
                            │          │  require(perm)  │
                            │          └───┬─────────┬───┘
                            │              │         │
                            │       predict│         │chat
                            │              ▼         ▼
                            │       ┌──────────┐  ┌────────────────┐
                            │       │ CatBoost │  │ MCP dispatcher │
                            │       │  + SHAP  │  │ resolve→intent │
                            │       └────┬─────┘  │ →tool / LLM    │
                            │            │        └───┬────────┬───┘
                            │            │            │        │
                            ▼            ▼            ▼        ▼
                     ┌──────────────────────────────────┐ ┌────────┐
                     │  PostgreSQL + pgvector            │ │ Ollama │
                     │  auth/rbac/billing/students/chat  │ │ phi3   │
                     └──────────────────────────────────┘ └────────┘
```

---

## 35. Component Relationships

```
TenantLayout (server)
 ├─ auth.api.getSession ──────────► Better Auth (lib/auth.ts)
 ├─ db (Drizzle) ─────────────────► organization, member, org_module, module_registry
 ├─ can()/MODULE_ROUTES ──────────► lib/rbac.ts
 ├─ TenantProvider ───────────────► hooks/use-tenant (TenantInfo)
 ├─ TenantSidebar (enabled modules)
 ├─ ModuleAccessDenied (on deny)
 ├─ ImpersonationBanner
 ├─ ThemeSlider
 └─ FloatingChatbot
      └─ POST /api/v1/chat/ ──────► FastAPI chat router
                                     ├─ require() ──► deps.py ──► principal.py ──► matrix.py
                                     └─ MCP dispatcher
                                          ├─ StudentResolver ─► pgvector/SQL
                                          ├─ ToolExecutor ────► predict_* endpoints (ML engines)
                                          ├─ OllamaClient ────► phi3:mini
                                          └─ LangChainOrchestrator (memory)

Module pages (grade/career/subject/9box/batch)
 └─ lib/api/predictions.ts ──► apiPost ──► /api/v1/... ──► module routers ──► ML engines
```

---

## 36. Glossary

| Term | Meaning |
|------|---------|
| **SGPA** | Semester Grade Point Average — the regression target of the grade model |
| **9-Box** | Talent grid placing a person on performance × potential (3×3) |
| **SHAP** | SHapley Additive exPlanations — per-feature contribution to a prediction |
| **CatBoost** | Gradient-boosting library used for all 4 models |
| **MCP** | Model Context Protocol — here, the custom tool-dispatcher pattern |
| **pgvector** | PostgreSQL extension for vector similarity search |
| **Embedding** | 384-dim vector from `all-MiniLM-L6-v2` representing text meaning |
| **Better Auth** | The authentication library (sessions, OAuth, admin/org plugins) |
| **Drizzle** | TypeScript ORM managing the auth/rbac/billing schema |
| **Principal** | Resolved caller identity + roles + modules (backend dataclass) |
| **Platform role** | `user.role` plane (super_admin/support/user/guest) |
| **Org role** | `member.role` plane (owner/admin/analyst/mentor/viewer/guest) |
| **Module entitlement** | Per-org on/off switch for a product module (`org_module`) |
| **Tenant** | An organization, addressed by `/{slug}/` |
| **Entity resolution** | Mapping a chat message to a specific student record |
| **Ollama / phi3:mini** | Local LLM server + model used for orchestration/fallback |

---

## 37. AI KNOWLEDGE BASE

> This section is written for **another AI agent** that will continue developing this project. It encodes the non-obvious rules, invariants, and gotchas needed to make safe changes.

### 37.1 Mental model

- Three runtimes cooperate: **Next.js (3000)**, **FastAPI (8001 ← 8000)**, **Ollama (11434)**, over **PostgreSQL+pgvector**.
- The browser only ever talks to Next.js. `/api/v1/*` is **rewritten** to FastAPI with the `better-auth.session_token` cookie forwarded.
- Authorization is enforced **twice**: in the Next server layout (UI gate) and in FastAPI `require()` (true security boundary). **Never** rely on the UI gate for security.

### 37.2 Hard invariants (do not break)

1. **`rbac.ts` and `matrix.py` must stay in sync.** Any permission/role change must be applied to both. The grant rule is OR across platform+org planes; super_admin/admin = all.
2. **The LLM must never produce predictions.** Predictions come only from CatBoost engines via tools. Keep this guardrail in `system_prompt_v1.txt`.
3. **Entity resolution runs BEFORE intent detection** in the dispatcher. Preserve that order — predictions need a grounded student first.
4. **CSV ingestion uses `keep_default_na=False, na_values=[""]`** to keep literal `"None"` strings. Don't "fix" this — it's intentional.
5. **Module usability = `org_module.enabled AND module_registry.globalEnabled`.** Both flags required.
6. **`skipTrailingSlashRedirect: true`** must remain — 308 redirects drop the session cookie and break auth to the backend.
7. **ML engines load at startup via lifespan.** Don't move loading into request handlers.

### 37.3 The #1 thing to fix next

**Connect the ML/chatbot pipeline to tenant data.** A database-per-tenant system exists (`tenant-db-manager.ts` + `tenant-schema.ts`), but the backend's `students`/`chat_sessions` tables are shared and have **no `organization_id`**. To make predictions truly multi-tenant, either:
- **Option A (use per-tenant DBs):** Resolve `organization.metadata.tenantDbName` from the principal's org and have the backend connect to that DB for student reads/writes.
- **Option B (add a tenant column):** Add `organization_id` to `students` and `chat_sessions`, backfill, then thread `principal.org_id` into **every** student query and **every** chatbot tool (`search_student`, `get_student`, `list_students`, all `predict_*`, and the entity resolver's vector/ILIKE searches), and stamp it in `ingest_csv.py`. Re-verify pgvector queries include the org filter.

### 37.4 Where to make common changes

| Change | Touch these files |
|--------|-------------------|
| New permission/role | rbac.ts + matrix.py (+ ORG_PERMS/PLATFORM_PERMS) |
| New product module | MODULES (rbac.ts), MODULE_ROUTES (layout.tsx), module_registry seed, new router + engine, new page |
| New chatbot tool | tools.py (ToolExecutor), ALLOWED_TOOLS (security.py), system prompt, dispatcher routing |
| New prediction model | core/<x>_ml_engine.py (singleton + SHAP), modules/<x>/router.py + schemas.py, register in main.py lifespan, predictions.ts typed fn |
| Auth/login change | lib/auth.ts, lib/permissions.ts |
| Rate limits / headers | chatbot/security.py |
| Caching behavior | chatbot/performance.py, auth/principal.py |

### 37.5 Gotchas

- **Two ORMs, one database.** Drizzle owns auth/rbac/billing; SQLAlchemy owns students/chat. The `session/user/member/org_module` tables are **read by both**. Schema changes there ripple across runtimes.
- **Principal cache is 30s.** Permission/role changes take up to 30s to reflect on the backend.
- **Rate limiter and caches are in-process.** Multi-instance deploys will behave inconsistently until externalized.
- **`actionts/` is a real directory name** (note the spelling) for server actions — not a typo to "fix" blindly; verify imports before renaming.
- **Legacy aliases:** platform `admin` == `super_admin`; org `member` == `mentor`. Keep handling both.
- **Internal tool→endpoint calls** use `x-internal-token`; if you add internal calls, include that header or they'll be rejected.

### 37.6 Verification checklist before shipping a change

1. Did you mirror any RBAC change in **both** matrices?
2. Did you add the new endpoint's permission to `ENDPOINT_PERMISSIONS` and `MODULE_ROUTES` if it's a module page?
3. Does the FastAPI route declare `require(permission, module)`?
4. For student data: does every new query filter by `organization_id` (once isolation lands)?
5. Did you keep the LLM from predicting values directly?
6. Does `/health` still pass and do all 4 engines load at startup?

---

*End of PROJECT_OVERVIEW.md — generated from verified source code.*
