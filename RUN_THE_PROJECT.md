# Run The Project

Goal: whole app live on localhost — backend `:8001` (+Swagger `/docs`), Postgres `:5433`, Ollama `:11434`, frontend `:3000`. Login `oxford@gmail.com` / `@oxford123#`.
Rule: **check first; start what's stopped; install/build only what's missing.** All steps are idempotent — skip any whose check already passes. Windows Git Bash: keep `MSYS_NO_PATHCONV=1` where shown. Need: Docker Desktop (running), Node ≥20, npm (ships with Node), and **`backend/master_dataset.csv`** placed manually — it's gitignored (`*.csv`), so a fresh clone does not include it (see step 3).

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

## 3. Load dataset (10k students; powers chatbot + predictions + CSV mode)
> ⚠️ **`backend/master_dataset.csv` is NOT in the repo** — `.gitignore` excludes `*.csv`, so a
> fresh clone won't have it. **Obtain `master_dataset.csv` separately and place it in `backend/`**
> before running this step (copy it from the original machine / shared drive). Confirm it's there:
> `ls -la backend/master_dataset.csv` (should be ~2.8 MB, **63 columns**). Without it, this step
> fails ("CSV not found") and the chatbot, Batch Prediction, and CSV mode all come up empty.

`master_dataset.csv` is the **63-column** dataset: the original 48 (chatbot + Batch
Prediction) plus 15 extra feature columns that let Grade/Career/Subject/Growth run in
**CSV mode** (see `DATASET_SPEC.md`). The 15 columns are regenerated from a 48-column base via
`python backend/scripts/augment_dataset.py` (backs up to `master_dataset.original.csv`) — this
*augments* an existing file, it does not create the 10k base rows, so you still need the source CSV.
```bash
cd backend && docker cp master_dataset.csv ai_mentor_api:/tmp/master_dataset.csv
MSYS_NO_PATHCONV=1 docker exec ai_mentor_api python -m app.chatbot.ingest_csv /tmp/master_dataset.csv
```
> Re-uploading the CSV from **Dashboard → Upload Student Dataset** does the same ingest in
> the background (truncates + re-inserts with embeddings). If the live DB predates the 15
> columns, add them once: `docker exec ai_mentor_db psql -U postgres -d ai_mentor -f -` with
> the `ALTER TABLE students ADD COLUMN …` set (the columns are also in `init.sql` for fresh DBs).

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
cd frontend && npm install && npm run db:push
```

## 6. Seed login user + Daffodil org
```bash
cd .. && npm install && node create-oxford-user.mjs
```

## 7. Frontend dev server
```bash
cd frontend && npm run dev    # http://localhost:3000
```

## Done — confirm
Open http://localhost:3000, log in, open `/daffodil/modules/...` (each starts blank → click predict/evaluate to populate Grade/Career/Subject/9-Box), try the chatbot ("find student named Allison" → pick → "predict career"), and Swagger at http://localhost:8001/docs.

**CSV mode:** on each prediction module, flip the **Manual | CSV** toggle (top-right). CSV mode → **Single student** (search/pick from the dataset; the dashboard populates from that record) or **Whole batch** (model runs across all 10k students with KPIs + table). Backed by `/api/v1/prediction/csv/{students,grade,career,subject,growth}` — quick check:
`curl "http://localhost:8001/api/v1/prediction/csv/grade/batch?limit=3"`.

## If it breaks
- `api` returns `000` briefly → API runs `--reload`, it restarted; retry.
- ingest "CSV not found: C:/Users/..." → missing `MSYS_NO_PATHCONV=1` (step 3).
- login 404 / fails → steps 5 then 6 not done.
- 308 on `…/sgpa/` or `…/9box/` → normal trailing-slash redirect, browsers follow it.
- restart later (already set up): `cd backend && docker compose up -d` then `cd frontend && npm run dev` (data persists in the `postgres_data` volume).
