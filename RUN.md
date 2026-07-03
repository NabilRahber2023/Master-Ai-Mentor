# RUN.md — run AI Mentor locally

> Verified working procedure. Use **Git Bash** on Windows. Keep `MSYS_NO_PATHCONV=1` where shown.
>
> **Live targets:** frontend `:3000` · backend `:8001` (Swagger at `/docs`) · Postgres `:5433` · Ollama `:11434`.
> **Package manager:** the frontend uses **pnpm** (not npm).
> **Working directory:** `c:\AIMENTOR\Master-Ai-Mentor`.

---

## Login credentials (Role Access Portal at `/login`)

| Card | Email | Password | Notes |
|------|-------|----------|-------|
| **Org Owner** | `owner@daffodil.com` | `Owner@12345` | organization owner (start here) |
| Owner | `oxford@gmail.com` | `Admin@12345` | platform super-admin (admin console) |
| Super Admin | `superadmin@system.com` | `Demo@123` | platform super-admin |
| Support | `support@system.com` | `Demo@123` | |
| User | `user@system.com` | `Demo@123` | |
| Guest | `guest@system.com` | `Demo@123` | no access (pending) |
| Org Admin | `orgadmin@system.com` | `Demo@123` | |
| Analyst | `analyst@system.com` | `Demo@123` | |
| Mentor | `mentor@system.com` | `Demo@123` | |
| Viewer | `viewer@system.com` | `Demo@123` | read-only |

All demo accounts are members of the **`daffodil`** organization (slug `daffodil`), which has all six modules enabled. On `/login`, click a role card → it auto-fills that account → sign in.

---

## 0. Preflight — is it already running?
```bash
cd /c/AIMENTOR/Master-Ai-Mentor
docker ps --format '{{.Names}}' | grep -q ai_mentor_api && echo "API-CONTAINER-UP" || echo "NO-API"
curl -s -o /dev/null -w "api %{http_code}\n" http://localhost:8001/health
curl -s -o /dev/null -w "web %{http_code}\n" http://localhost:3000
```
- `api 200` + `web 200` → **already live. Open http://localhost:3000.**
- Containers up but `web`≠200 → just start the frontend (step B4).
- Otherwise follow **A** (fresh) or **B** (restart) below.

---

## A. Fresh setup (first time on this machine)

### A1. Start Postgres (pgvector) on :5433
```bash
cd /c/AIMENTOR/Master-Ai-Mentor/backend
docker compose up -d postgres
until [ "$(docker inspect -f '{{.State.Health.Status}}' ai_mentor_db 2>/dev/null)" = healthy ]; do sleep 2; done
echo "DB healthy"
```
The `init.sql` auto-creates pgvector + the `students`/`chat_sessions` tables on first boot.

### A2. Ollama for the chatbot
The chatbot uses a local Ollama (`phi3:mini`). Two options:

- **If you already run Ollama on the host (port 11434)** — keep the provided
  `backend/docker-compose.override.yml` (gitignored) so the API talks to your host Ollama:
  ```yaml
  services:
    api:
      environment:
        OLLAMA_BASE_URL: http://host.docker.internal:11434
      extra_hosts:
        - "host.docker.internal:host-gateway"
  ```
  Then pull the model on the host: `ollama pull phi3:mini`.

- **If you do NOT run Ollama on the host** — delete that override file and start the bundled
  container instead: `docker compose up -d ollama ollama-pull` (it pulls `phi3:mini` once).

> Predictions (Grade/Career/9-Box/Subject/Batch) do **not** need Ollama — only the chatbot does.

### A3. Build + start the backend API on :8001
```bash
cd /c/AIMENTOR/Master-Ai-Mentor/backend
docker compose up -d --build api    # first build downloads torch/catboost — a few minutes
until curl -sf http://localhost:8001/health >/dev/null; do sleep 3; done; echo "API up"
```

### A4. Frontend env (create only if missing)
```bash
cd /c/AIMENTOR/Master-Ai-Mentor/frontend
[ -f .env.local ] || cat > .env.local <<'EOF'
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_mentor
BACKEND_URL=http://localhost:8001
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=local-dev-secret-please-change-abcdefghijklmnop1234567890
NODE_ENV=development
EOF
```

### A5. Install deps + create the auth/RBAC/billing tables
```bash
cd /c/AIMENTOR/Master-Ai-Mentor/frontend
pnpm install
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ai_mentor" pnpm db:generate
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ai_mentor" pnpm db:migrate
```

### A6. Seed the org, owner, module entitlements + demo role accounts
```bash
cd /c/AIMENTOR/Master-Ai-Mentor
# creates the daffodil org, packages, module entitlements and the super-admin
node create-oxford-user.mjs
# creates the 9 Role-Access-Portal accounts (Demo@123) in the daffodil org
node seed-role-accounts.mjs
```
> These scripts import `pg`/`better-auth` from `frontend/node_modules`, so run them **after** `pnpm install`.

### A7. (Optional) Load the 10k-student dataset — powers chatbot + Batch + CSV mode
```bash
cd /c/AIMENTOR/Master-Ai-Mentor
# master_dataset.csv is gitignored — obtain it separately and place it in the repo root
[ -f master_dataset.csv ] || { echo "!! master_dataset.csv missing — add it to run chatbot/batch/CSV"; }
MSYS_NO_PATHCONV=1 docker cp ./master_dataset.csv ai_mentor_api:/tmp/master_dataset.csv
MSYS_NO_PATHCONV=1 docker exec ai_mentor_api python -m app.chatbot.ingest_csv /tmp/master_dataset.csv
```

### A8. Start the frontend
```bash
cd /c/AIMENTOR/Master-Ai-Mentor/frontend && pnpm dev    # http://localhost:3000
```

---

## B. Restart (already set up — DB persists in the postgres volume)
```bash
# B1-B3: bring the backend stack back up
cd /c/AIMENTOR/Master-Ai-Mentor/backend && docker compose up -d postgres api
until curl -sf http://localhost:8001/health >/dev/null; do sleep 3; done; echo "API up"
# B4: start the frontend
cd /c/AIMENTOR/Master-Ai-Mentor/frontend && pnpm dev
```
Open **http://localhost:3000** → **Org Owner** card → sign in.

---

## Verify
```bash
curl -s -o /dev/null -w "api %{http_code}\n" http://localhost:8001/health
curl -s -o /dev/null -w "web %{http_code}\n" http://localhost:3000
# a demo login should return HTTP 200:
curl -s -o /dev/null -w "login %{http_code}\n" -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" -d '{"email":"owner@daffodil.com","password":"Owner@12345"}'
```

## What you get
- **`/login`** — Role Access Portal: 10 role cards → modal auto-fills → real auth (no bypass).
- **`/daffodil/home`** — tenant workspace with 6 module cards: Grade, Batch, Career, Subject, AI Chatbot, Growth (9-Box). Each prediction page is fully dynamic off the live model output (Manual + CSV mode).
- **`/dashboard/admin`** (super-admin) — module grid, packages, pricing, roles.
- **`/pricing`** — 3 tiers (Silver/Gold/Platinum), DB-driven.
- **Swagger** — http://localhost:8001/docs.

## Troubleshooting
- `api 000` briefly after start → the API runs with `--reload`; retry the curl.
- Login loops / 404 → the auth/RBAC tables (A5) or seed (A6) weren't run.
- Role login fails → `node seed-role-accounts.mjs` (A6) wasn't run, or it targeted the wrong org (it must be `daffodil`).
- Chatbot fails but predictions work → Ollama isn't reachable; pull the model (`ollama pull phi3:mini` on host, or start the `ollama` container). Chatbot degrades gracefully; predictions are unaffected.
- `ingest "CSV not found: C:/Users/..."` → missing `MSYS_NO_PATHCONV=1` on the `docker exec` (A7).
- Frontend build fails with "BACKEND_URL is required" → that guard only fires on a **production** build; `pnpm dev` is unaffected. For a prod build pass `BACKEND_URL=...`.
