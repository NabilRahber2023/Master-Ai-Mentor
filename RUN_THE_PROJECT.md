# Run The Project

Goal: whole app live on localhost — backend `:8001` (+Swagger `/docs`), Postgres `:5433`, Ollama `:11434`, frontend `:3000`. Login `oxford@gmail.com` / `@oxford123#`.
Rule: **check first; start what's stopped; install/build only what's missing.** All steps are idempotent — skip any whose check already passes. Windows Git Bash: keep `MSYS_NO_PATHCONV=1` where shown. Need: Docker Desktop (running), Node ≥20, pnpm (`npm i -g pnpm`).

## 1. Preflight — run this, then do only the flagged steps
```bash
docker ps --format "{{.Names}} {{.Status}}" | grep ai_mentor || echo "NO-CONTAINERS"
curl -s -o /dev/null -w "api %{http_code}\n" http://localhost:8001/health
curl -s http://localhost:8001/api/v1/chat/health; echo
docker exec ai_mentor_db psql -U postgres -d ai_mentor -tAc "SELECT count(*) FROM students" 2>/dev/null || echo "NO-DATA"
docker exec ai_mentor_db psql -U postgres -d ai_mentor -tAc "SELECT count(*) FROM \"user\"" 2>/dev/null || echo "NO-AUTH"
curl -s -o /dev/null -w "web %{http_code}\n" http://localhost:3000
```
- `api 200` + `web 200` + students `10000` + user ≥1 → **already live, stop here** (open http://localhost:3000).
- Containers exist but `api` ≠ 200 → `cd backend && docker compose up -d` (no build).
- `NO-CONTAINERS` → step 2. `NO-DATA`/students 0 → step 3. `NO-AUTH` → step 5. user 0 → step 6. `web` ≠ 200 → steps 4+7.
- chat unhealthy → `docker exec ai_mentor_ollama ollama pull phi3:mini` (Ollama "unhealthy" status alone is cosmetic, ignore).

## 2. Backend (first time builds images + pulls phi3:mini; minutes)
```bash
cd backend && docker compose up -d --build
until curl -sf http://localhost:8001/health >/dev/null; do sleep 3; done; echo "API up"
```

## 3. Load dataset (10k students; powers chatbot + predictions)
```bash
cd backend && docker cp master_dataset.csv ai_mentor_api:/tmp/master_dataset.csv
MSYS_NO_PATHCONV=1 docker exec ai_mentor_api python -m app.chatbot.ingest_csv /tmp/master_dataset.csv
```

## 4. Frontend env (create only if `frontend/.env.local` missing)
```bash
cat > frontend/.env.local <<'EOF'
BACKEND_URL=http://localhost:8001
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_mentor
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=test_client_id
GOOGLE_CLIENT_SECRET=test_client_secret
ROOT_DOMAIN=localhost
BETTER_AUTH_SECRET=a4b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5
EOF
```

## 5. Auth tables
```bash
cd frontend && pnpm install && pnpm db:push
```

## 6. Seed login user + Daffodil org
```bash
cd .. && npm install && node create-oxford-user.mjs
```

## 7. Frontend dev server
```bash
cd frontend && pnpm dev    # http://localhost:3000
```

## Done — confirm
Open http://localhost:3000, log in, open `/daffodil/modules/...` (each starts blank → click predict/evaluate to populate Grade/Career/Subject/9-Box), try the chatbot ("find student named Allison" → pick → "predict career"), and Swagger at http://localhost:8001/docs.

## If it breaks
- `api` returns `000` briefly → API runs `--reload`, it restarted; retry.
- ingest "CSV not found: C:/Users/..." → missing `MSYS_NO_PATHCONV=1` (step 3).
- login 404 / fails → steps 5 then 6 not done.
- 308 on `…/sgpa/` or `…/9box/` → normal trailing-slash redirect, browsers follow it.
- restart later (already set up): `cd backend && docker compose up -d` then `cd frontend && pnpm dev` (data persists in the `postgres_data` volume).
