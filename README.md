# AI Mentor — Multi-Tenant Student Intelligence Platform

AI Mentor ("Intellector") is a multi-tenant SaaS that helps mentors understand and guide students using machine learning. It combines four CatBoost prediction models (grade/SGPA, career path, 9-box growth potential, and subject/department fit) with a conversational AI assistant, wrapped in a role-based, per-organization workspace.

- **Frontend:** Next.js 16 (App Router, React 19), Better Auth, Drizzle ORM, Tailwind 4 — `frontend/`
- **Backend:** FastAPI (Python 3.11), SQLAlchemy async, CatBoost + SHAP, LangChain — `backend/`
- **Data:** PostgreSQL 15 + pgvector, one database per organization
- **Chatbot LLM:** Ollama (`phi3:mini`), running locally — no third-party AI API

The browser only talks to the frontend, which proxies `/api/v1/*` to the backend. Auth is validated against a shared Better Auth session table; every request is gated by a two-plane RBAC (platform role + org role) plus per-organization module entitlements.

---

## Quick start (local)

See **[RUN.md](RUN.md)** for the full, verified boot procedure. In short:

```bash
# 1. Backend stack (Postgres :5433 + FastAPI :8001)
cd backend && docker compose up -d --build postgres api

# 2. Frontend
cd ../frontend && pnpm install && pnpm dev   # http://localhost:3000
```

Then open **http://localhost:3000/login** and click a role card to sign in.

**Primary login:** Org Owner — `owner@daffodil.com` / `Owner@12345`.
Full login table (all roles) is in [RUN.md](RUN.md).

---

## Documentation

| Doc | What it covers |
|-----|----------------|
| [RUN.md](RUN.md) | Run locally — step-by-step, credentials, troubleshooting |
| [RUN_THE_PROJECT.md](RUN_THE_PROJECT.md) | Detailed run guide incl. dataset ingestion + CSV mode |
| [docs/architecture.md](docs/architecture.md) | System architecture with Mermaid diagrams |
| [docs/request-flow.md](docs/request-flow.md) | End-to-end request lifecycle (browser → response) |
| [docs/docker-explained.md](docs/docker-explained.md) | Every Dockerfile & compose file, build/startup order |
| [docs/environment.md](docs/environment.md) | Every environment variable, required/optional |
| [docs/deployment-audit.md](docs/deployment-audit.md) | Production deployment, risks & remediations |
| [RBAC.md](RBAC.md) | Role & permission model |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Full project overview |
| [DATASET_SPEC.md](DATASET_SPEC.md) | Student dataset schema (63 columns) |

---

## Production deployment

Use **[docs/deployment-audit.md](docs/deployment-audit.md)** and the production compose stack:

```bash
cp .env.prod.example .env      # fill in real secrets + your domain
docker compose -f docker-compose.prod.yml up -d --build
```

This runs Postgres (pgvector), Ollama, the FastAPI backend, the Next.js frontend, and Caddy (automatic HTTPS) — with only Caddy exposed to the internet. Notes:

- `BACKEND_URL` is baked into the frontend at **build time** for the `/api/v1/*` rewrites — pass it as a build arg. A production build fails loudly if it is unset.
- Set a strong `INTERNAL_API_TOKEN`; secure `DATABASE_URL` credentials; terminate TLS at the reverse proxy.
