# RUN.md — one-shot local boot (all features, no errors)

> **Agent instructions:** run the blocks below **in order**, top to bottom. Every step is
> **idempotent** — skip a step only if its check already passes. Use **Git Bash** and keep
> `MSYS_NO_PATHCONV=1` where shown. When done, the whole app is live with predictions,
> chatbot, RBAC, the role-login portal, and pricing.
>
> **Live targets:** frontend `:3000` · backend `:8001` (`/docs`) · Postgres `:5433` · Ollama `:11434`.
> **Owner login:** `oxford@gmail.com` / `@oxford123#` · **Role accounts:** `*@system.com` / `Demo@123`.
>
> **Prereqs (one-time):** Docker Desktop running · Node ≥20 · `master_dataset.csv` present in the
> repo root (≈2.8 MB, 63 cols — gitignored, copy it in if missing).

## 0. Preflight — run this, then do only the flagged steps
```bash
cd /c/AIMENTOR/AI-updates-mentor
docker ps --format '{{.Names}}' | grep -q ai_mentor_api && echo "CONTAINERS-UP" || echo "NO-CONTAINERS"
curl -s -o /dev/null -w "api %{http_code}\n" http://localhost:8001/health
curl -s -o /dev/null -w "web %{http_code}\n" http://localhost:3000
docker exec ai_mentor_db psql -U postgres -d ai_mentor -tAc \
 "SELECT (SELECT count(*) FROM students)||' students / '||(SELECT count(*) FROM \"user\")||' users / '||(SELECT count(*) FROM packages WHERE is_visible)||' packages'" 2>/dev/null || echo "DB-NOT-READY"
```
- `api 200` + `web 200` + `10000 students / ≥10 users / 3 packages` → **already live, stop. Open http://localhost:3000.**
- `CONTAINERS-UP` but `api`≠200 → `cd backend && docker compose up -d` then continue at step 2's wait-loop.
- Otherwise run every step below. (Steps 1–6 are backend/data; 7–9 are frontend; 10 starts the UI.)

## 1. Backend stack (first run builds images + pulls phi3:mini — a few min)
```bash
cd /c/AIMENTOR/AI-updates-mentor/backend && docker compose up -d --build
until curl -sf http://localhost:8001/health >/dev/null; do sleep 3; done; echo "API up"
```

## 2. Load the 10k-student dataset (powers chatbot + predictions + CSV mode)
```bash
cd /c/AIMENTOR/AI-updates-mentor
[ -f master_dataset.csv ] || { echo "!! master_dataset.csv missing in repo root — add it first"; exit 1; }
MSYS_NO_PATHCONV=1 docker cp ./master_dataset.csv ai_mentor_api:/tmp/master_dataset.csv
MSYS_NO_PATHCONV=1 docker exec ai_mentor_api python -m app.chatbot.ingest_csv /tmp/master_dataset.csv
```
> If ingest errors with `column "ssc_gpa" ... does not exist`, the Postgres volume predates the
> 63-col schema. Reset it (no data yet): `cd backend && docker compose down && docker volume rm backend_postgres_data && docker compose up -d`, then redo steps 1–2.

## 3. Frontend env (create only if missing)
```bash
cd /c/AIMENTOR/AI-updates-mentor/frontend
[ -f .env.local ] || cat > .env.local <<'EOF'
BACKEND_URL=http://localhost:8001
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_mentor
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=test_client_id
GOOGLE_CLIENT_SECRET=test_client_secret
ROOT_DOMAIN=localhost
BETTER_AUTH_SECRET=a4b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5
EOF
```

## 4. Auth / RBAC / billing tables (drizzle — `push` needs a TTY, so generate+migrate)
```bash
cd /c/AIMENTOR/AI-updates-mentor/frontend && npm install
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ai_mentor" npm run db:generate
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ai_mentor" npm run db:migrate
```

## 5. Seed Owner + org + module entitlements
```bash
cd /c/AIMENTOR/AI-updates-mentor && npm install && node create-oxford-user.mjs
```

## 6. Seed the 9 role-portal accounts (real users, `Demo@123`)
```bash
cd /c/AIMENTOR/AI-updates-mentor && node seed-role-accounts.mjs
```

## 7. Seed the pricing catalog (Silver / Gold / Platinum, full features) — idempotent
```bash
docker exec -i ai_mentor_db psql -U postgres -d ai_mentor -v ON_ERROR_STOP=1 <<'SQL'
UPDATE packages SET name='Platinum', display_name='Platinum Plan',
  description='Full access to every AI Mentor module.', base_price=999, currency='BDT',
  usage_limit='Unlimited users', is_visible=true, is_popular=false, badge='Enterprise', sort_order=3,
  modules='["grade-prediction","career-guidance","ai-chatbot","growth-potential"]'::json,
  features='["All Gold features","AI Chatbot Mentor (24/7)","Instant question answering","Complex concept explanations","Growth Potential Analysis (9-Box)","Performance matrix insights","24/7 Priority support","Dedicated account manager","Custom integrations"]'::json,
  updated_at=NOW() WHERE tier='platinum';
INSERT INTO packages (id,name,display_name,description,modules,features,tier,base_price,currency,usage_limit,is_visible,is_popular,badge,sort_order,created_at,updated_at)
SELECT gen_random_uuid()::text,'Silver','Silver Plan','Starter plan for grade analytics.',
  '["grade-prediction"]'::json,
  '["Grade Prediction & Analytics","Historical data analysis","Performance forecasting","Study pattern recognition","Email support","Monthly performance reports"]'::json,
  'silver',299,'BDT','Up to 100 users per month',true,false,'Starter',1,NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE tier='silver');
INSERT INTO packages (id,name,display_name,description,modules,features,tier,base_price,currency,usage_limit,is_visible,is_popular,badge,sort_order,created_at,updated_at)
SELECT gen_random_uuid()::text,'Gold','Gold Plan','Grade + career guidance.',
  '["grade-prediction","career-guidance"]'::json,
  '["All Silver features","Career Guidance & Roadmap","Strength & interest analysis","Subject recommendations","Career path planning","Priority email support","Weekly analytics reports"]'::json,
  'gold',599,'BDT','Up to 250 users per month',true,true,'Most Popular',2,NOW(),NOW()
WHERE NOT EXISTS (SELECT 1 FROM packages WHERE tier='gold');
SQL
```

## 8. Start the frontend
```bash
cd /c/AIMENTOR/AI-updates-mentor/frontend && npm run dev   # http://localhost:3000
```

## 9. Verify (all should pass)
```bash
curl -s -o /dev/null -w "api  %{http_code}\n" http://localhost:8001/health
curl -s -o /dev/null -w "web  %{http_code}\n" http://localhost:3000
docker exec ai_mentor_db psql -U postgres -d ai_mentor -tAc \
 "SELECT (SELECT count(*) FROM students)||' students / '||(SELECT count(*) FROM \"user\")||' users / '||(SELECT count(*) FROM packages WHERE is_visible)||' packages'"
# expect: api 200 · web 200 · 10000 students / >=10 users / 3 packages
```

## Done — what you get
- **Login portal** `/login`: role cards → modal → real auth. Owner `oxford@gmail.com`/`@oxford123#`; roles `superadmin|support|user|guest|orgowner|orgadmin|analyst|mentor|viewer @system.com` / `Demo@123`.
- **Modules** under `/oxford/...`: Grade, Career, Subject, Growth (9-Box), Batch Prediction (Prescribe: at-risk/mid/on-track), AI Chatbot — each Manual + CSV mode, results fully dynamic.
- **Admin** `/dashboard/admin` (super_admin): module grid, packages, pricing, roles.
- **Public** `/pricing` (3 tiers w/ full features), landing page.
- **Swagger** http://localhost:8001/docs.

## Restart later (already set up — data persists in the postgres volume)
```bash
cd /c/AIMENTOR/AI-updates-mentor/backend && docker compose up -d
cd /c/AIMENTOR/AI-updates-mentor/frontend && npm run dev
```

## If it breaks
- `api 000` briefly → API runs `--reload`; retry.
- ingest "CSV not found: C:/Users/..." → missing `MSYS_NO_PATHCONV=1` (step 2).
- login loops / 404 → steps 4 → 5 not completed.
- `/pricing` shows one empty card → step 7 not run.
- role login fails → step 6 not run.
- Ollama "unhealthy" alone is cosmetic; if chat fails: `docker exec ai_mentor_ollama ollama pull phi3:mini`.
