# Environment Variables — Complete Reference

> Every environment variable this project reads, where it's used, whether it's required, and how to set it safely for production.
>
> **⚠️ No real secret values appear in this document.** All examples are illustrative placeholders. Real secrets live only in the (gitignored) `.env` file. See [`.env.prod.example`](../.env.prod.example) for the template.
>
> **Companion docs:** [docker-explained.md](docker-explained.md) · [deployment-audit.md](deployment-audit.md) · [architecture.md](architecture.md)

---

## How configuration flows

```
.env  ──►  docker-compose.prod.yml  ──►  container environment  ──►  app reads it
                                                                     (os.getenv / process.env)
```

- The root **`.env`** file feeds `docker-compose.prod.yml`. Variables marked `${VAR:?...}` are **required** — the stack refuses to start if they're missing.
- Some variables are **build-time** (baked into the image when it's built) vs **runtime** (read when the container starts). This matters a lot for `BACKEND_URL`.
- Legend: 🔴 **Required** · 🟢 **Optional (has default)** · 🔵 **Optional feature**

---

## 1. Summary table (all variables)

| Variable | Req? | Service(s) | Type | Secret? |
|----------|------|-----------|------|---------|
| `DATABASE_URL` | 🔴 | Backend, Frontend | Runtime | ✅ (contains password) |
| `POSTGRES_USER` | 🔴 | Postgres container | Runtime | ⚠️ |
| `POSTGRES_PASSWORD` | 🔴 | Postgres container | Runtime | ✅ |
| `POSTGRES_DB` | 🟢 | Postgres container | Runtime | ❌ |
| `INTERNAL_API_TOKEN` | 🔴* | Backend | Runtime | ✅ |
| `CORS_ALLOW_ORIGINS` | 🔴* | Backend | Runtime | ❌ |
| `OLLAMA_BASE_URL` | 🟢 | Backend | Runtime | ❌ |
| `OLLAMA_MODEL` | 🟢 | Backend, ollama-pull | Runtime | ❌ |
| `ENABLE_DEBUG_ENDPOINTS` | 🟢 | Backend | Runtime | ❌ |
| `DB_CONTROL_POOL_SIZE` | 🟢 | Backend | Runtime | ❌ |
| `DB_CONTROL_MAX_OVERFLOW` | 🟢 | Backend | Runtime | ❌ |
| `DB_TENANT_POOL_SIZE` | 🟢 | Backend | Runtime | ❌ |
| `DB_TENANT_MAX_OVERFLOW` | 🟢 | Backend | Runtime | ❌ |
| `BACKEND_URL` | 🔴 | Frontend | **Build-time** | ❌ |
| `BETTER_AUTH_URL` | 🔴 | Frontend | Runtime | ❌ |
| `BETTER_AUTH_SECRET` | 🔴 | Frontend | Runtime | ✅ |
| `NODE_ENV` | 🟢 | Frontend | Runtime | ❌ |
| `GOOGLE_CLIENT_ID` | 🔵 | Frontend | Runtime | ⚠️ |
| `GOOGLE_CLIENT_SECRET` | 🔵 | Frontend | Runtime | ✅ |
| `ROOT_DOMAIN` | 🟢 | Frontend (proxy) | Runtime | ❌ |
| `TENANT_DB_POOL_MAX` | 🟢 | Frontend | Runtime | ❌ |
| `APP_DOMAIN` | 🔴 | Caddy | Runtime | ❌ |
| `TLS_EMAIL` | 🔴 | Caddy | Runtime | ❌ |

*🔴\* = optional in code (has a safe fallback) but **must be set for production** — see details.*

---

## 2. Database

### `DATABASE_URL`
- **Required:** 🔴 Yes
- **Used by:** Backend (`app/chatbot/database.py`, `startup.py`, `auth/principal.py`) and Frontend (`db/config`, `db/tenant-db-manager.ts`, `drizzle.config.ts`, seed scripts)
- **Purpose:** The PostgreSQL connection string for the **shared/control** database (accounts, sessions, RBAC). Tenant databases reuse this host/credentials, swapping only the database name.
- **Important:** the two services use **different URL schemes for the same database**:
  - Backend (SQLAlchemy + asyncpg): `postgresql+asyncpg://...`
  - Frontend (node-postgres): `postgresql://...`
- **Example (placeholder):**
  - Backend: `postgresql+asyncpg://ai_mentor:REDACTED@postgres:5432/ai_mentor`
  - Frontend: `postgresql://ai_mentor:REDACTED@postgres:5432/ai_mentor`
- **Production recommendation:** In the prod compose this is **assembled automatically** from `POSTGRES_USER/PASSWORD/DB`, so you typically only set those three. Never commit it. Use a strong password (see below). Point at `postgres:5432` on the internal Docker network — never a public host.

### `POSTGRES_USER`
- **Required:** 🔴 Yes (prod) — dev defaults to `postgres`
- **Used by:** the `postgres` container; interpolated into `DATABASE_URL` for backend + frontend
- **Purpose:** Database superuser/owner name. This user also needs `CREATEDB` because the app creates one database per organization.
- **Example:** `ai_mentor`
- **Production recommendation:** Use a dedicated non-default name (not `postgres`). Consider a separate least-privilege role for app queries vs a provisioning role that holds `CREATEDB`.

### `POSTGRES_PASSWORD`
- **Required:** 🔴 Yes (prod) — **secret**
- **Used by:** the `postgres` container; interpolated into `DATABASE_URL`
- **Purpose:** Password for `POSTGRES_USER`.
- **Example:** `REDACTED` (40+ char random)
- **Production recommendation:** Generate with `python -c "import secrets,string; a=string.ascii_letters+string.digits; print(''.join(secrets.choice(a) for _ in range(40)))"`. **Keep it alphanumeric** — it is embedded inside `DATABASE_URL`, so URL-special characters (`@ : / ? #`) would break parsing. Rotate if ever exposed.

### `POSTGRES_DB`
- **Required:** 🟢 No (default `ai_mentor`)
- **Used by:** the `postgres` container
- **Purpose:** Name of the shared/control database created on first boot.
- **Example:** `ai_mentor`
- **Production recommendation:** The default is fine. Keep it consistent — `init.sql` and the app assume this DB exists.

---

## 3. Backend (FastAPI)

### `INTERNAL_API_TOKEN`
- **Required:** 🔴 For production (code has a safe fallback, so technically optional to boot)
- **Used by:** Backend — `app/auth/internal_token.py` (resolver), `auth/principal.py` (verifier), `chatbot/tools.py` (sender)
- **Purpose:** Shared secret for **trusted internal service calls** — when the chatbot calls the ML endpoints on a user's behalf, it sends this in the `x-internal-token` header and is treated as a super-admin service principal.
- **Behavior when unset:** the app mints an **unguessable per-process token** (single-process still works) and logs a warning. It will **not** fall back to the old public default.
- **Example:** `REDACTED` (48-byte base64 / url-safe)
- **Production recommendation:** **Always set it** to a strong random value (`openssl rand -base64 48`). It becomes **mandatory** if you run more than one worker/host (e.g. `uvicorn --workers 2`), otherwise workers mint different tokens and internal calls fail. Never commit it.

### `CORS_ALLOW_ORIGINS`
- **Required:** 🔴 For production (default is localhost, unsuitable for prod)
- **Used by:** Backend — `app/main.py`
- **Purpose:** Comma-separated allow-list of browser origins permitted to call the API with credentials. Because credentials are allowed, `*` is intentionally **not** supported.
- **Default:** `http://localhost:3000,http://127.0.0.1:3000`
- **Example:** `https://intellector.example.com`
- **Production recommendation:** Set to exactly your public HTTPS origin(s), comma-separated, no trailing slash. Do not leave the localhost default in production.

### `OLLAMA_BASE_URL`
- **Required:** 🟢 No (default `http://localhost:11434`)
- **Used by:** Backend — `chatbot/llm_client.py`, `chatbot/langchain_orchestrator.py`, `startup.py`
- **Purpose:** URL of the Ollama LLM server that powers the chatbot.
- **Example:** `http://ollama:11434`
- **Production recommendation:** Set to the internal Docker service name (`http://ollama:11434`). If Ollama is unreachable the chatbot degrades gracefully (warns, uses fallback), so this is not fatal — but set it correctly.

### `OLLAMA_MODEL`
- **Required:** 🟢 No (default `phi3:mini`)
- **Used by:** Backend — `chatbot/llm_client.py`, `langchain_orchestrator.py`; also the `ollama-pull` service pulls this model
- **Purpose:** Which local LLM model the chatbot uses.
- **Example:** `phi3:mini`
- **Production recommendation:** Keep `phi3:mini` for low memory. If you choose a larger model, raise `OLLAMA_MEM_LIMIT` and the instance RAM accordingly, and ensure `ollama-pull` downloads the same name.

### `ENABLE_DEBUG_ENDPOINTS`
- **Required:** 🟢 No (default: off)
- **Used by:** Backend — `app/main.py`
- **Purpose:** When truthy (`1/true/yes/on`), registers debug routes such as `/api/v1/auth/whoami` (which echoes the resolved principal). Off by default → those routes return 404.
- **Example:** `false`
- **Production recommendation:** **Leave off** (`false`, or unset). The prod compose forces `"false"`. Only enable temporarily for troubleshooting.

### Connection-pool tunables (backend)
All 🟢 optional; defaults preserve original behavior. Used by `app/chatbot/database.py`.

| Variable | Default | Purpose |
|----------|---------|---------|
| `DB_CONTROL_POOL_SIZE` | `10` | Base connections for the shared/control DB pool |
| `DB_CONTROL_MAX_OVERFLOW` | `20` | Extra burst connections for the control pool |
| `DB_TENANT_POOL_SIZE` | `5` | Base connections **per tenant** database pool |
| `DB_TENANT_MAX_OVERFLOW` | `10` | Extra burst connections per tenant pool |

- **Example:** `DB_TENANT_POOL_SIZE=3`
- **Production recommendation:** Each active organization opens its own pool, so total connections ≈ (orgs × tenant pool). With many tenants you can exhaust Postgres `max_connections`. **Lower these** (e.g. tenant pool `3/5`) or route `DATABASE_URL` through **PgBouncer**, and set Postgres `max_connections` deliberately.

---

## 4. Frontend (Next.js / Better Auth)

### `BACKEND_URL`
- **Required:** 🔴 Yes — and it is **BUILD-TIME**
- **Used by:** Frontend — `next.config.ts` (rewrites `/api/v1/*` → this URL); enforced in `frontend/Dockerfile`
- **Purpose:** Tells the Next.js proxy where the FastAPI backend lives. Baked into the image at build time.
- **Behavior:** A production **build fails** if this is unset (both `next.config.ts` and the Dockerfile guard against it) — so an image never silently proxies to `localhost:8001`.
- **Example:** `http://api:8000`
- **Production recommendation:** Pass it as a Docker **build arg** (the prod compose sets `BACKEND_URL: http://api:8000`). Because it's baked in, you must **rebuild the frontend image** to change it. Use the internal service name, not a public URL.

### `BETTER_AUTH_URL`
- **Required:** 🔴 Yes
- **Used by:** Frontend — `lib/auth.ts` (`baseURL` and `trustedOrigins`)
- **Purpose:** The public base URL of the app; Better Auth uses it for callbacks, cookies, and trusted-origin checks.
- **Example:** `https://intellector.example.com`
- **Production recommendation:** Set to your exact public **HTTPS** URL (must match `APP_DOMAIN`). A wrong value breaks login/callbacks.

### `BETTER_AUTH_SECRET`
- **Required:** 🔴 Yes — **secret**
- **Used by:** Frontend — Better Auth (read from the environment) for signing/encrypting sessions
- **Purpose:** Cryptographic key that secures session tokens. If it changes, all existing sessions are invalidated.
- **Example:** `REDACTED` (48-byte base64)
- **Production recommendation:** Generate with `openssl rand -base64 48`. Keep stable (rotating logs everyone out). Never commit.

### `NODE_ENV`
- **Required:** 🟢 No (tooling sets it; prod compose sets `production`)
- **Used by:** Frontend — `lib/auth.ts` (secure cookies), `proxy.ts`, `components/auth/email-login-form.tsx` (dev-only autofill), and Next.js itself
- **Purpose:** Switches production behavior on: **`useSecureCookies`**, `SameSite`, hides dev-only login autofill, enables optimizations.
- **Example:** `production`
- **Production recommendation:** Must be `production`. The frontend image already sets this; ensure it isn't overridden. Secure cookies require it (and HTTPS via Caddy).

### `GOOGLE_CLIENT_ID`
- **Required:** 🔵 Optional (Google login feature)
- **Used by:** Frontend — `lib/auth.ts` social providers
- **Purpose:** OAuth client ID for "Sign in with Google."
- **Example:** `1234567890-abcdef.apps.googleusercontent.com`
- **Production recommendation:** Set only if you enable Google login. Register the prod redirect URI in Google Cloud. Leave blank to disable social login (email/password still works).

### `GOOGLE_CLIENT_SECRET`
- **Required:** 🔵 Optional (Google login feature) — **secret**
- **Used by:** Frontend — `lib/auth.ts`
- **Purpose:** OAuth client secret paired with the client ID.
- **Example:** `REDACTED`
- **Production recommendation:** Required only if Google login is enabled. Never commit. Rotate via Google Cloud if exposed.

### `ROOT_DOMAIN`
- **Required:** 🟢 No (default `intellector.daffodilglobal.ai`)
- **Used by:** Frontend — `proxy.ts`
- **Purpose:** Base domain used by path/subdomain routing logic in the proxy helper.
- **Example:** `intellector.example.com`
- **Production recommendation:** Set to your real domain so the hardcoded default isn't used. Keep consistent with `APP_DOMAIN` / `BETTER_AUTH_URL`.

### `TENANT_DB_POOL_MAX`
- **Required:** 🟢 No (default `10`)
- **Used by:** Frontend — `db/tenant-db-manager.ts`
- **Purpose:** Max connections in each **frontend** per-tenant Postgres pool.
- **Example:** `5`
- **Production recommendation:** Mirror your backend tenant-pool strategy. Lower it when onboarding many tenants to bound total connections. (See backend pool tunables + PgBouncer note.)

---

## 5. Reverse proxy (Caddy)

### `APP_DOMAIN`
- **Required:** 🔴 Yes (prod)
- **Used by:** Caddy — `deploy/Caddyfile` (site address)
- **Purpose:** The public domain Caddy serves and obtains a TLS certificate for.
- **Example:** `intellector.example.com`
- **Production recommendation:** Must be a real domain whose DNS `A` record points at the server **before** starting Caddy, or certificate issuance fails. Must match `BETTER_AUTH_URL` host.

### `TLS_EMAIL`
- **Required:** 🔴 Yes (prod)
- **Used by:** Caddy — `deploy/Caddyfile` (ACME account)
- **Purpose:** Email registered with Let's Encrypt for the TLS certificate (expiry/renewal notices).
- **Example:** `admin@example.com`
- **Production recommendation:** Use a monitored mailbox. No secret, but keep accurate.

---

## 6. Optional container resource limits (compose-level)

These are consumed by `docker-compose.prod.yml`, not the app code.

| Variable | Default | Purpose | Recommendation |
|----------|---------|---------|----------------|
| `OLLAMA_MEM_LIMIT` | `5g` | Memory ceiling for the Ollama container | Raise for larger models; keep below host RAM |
| `API_MEM_LIMIT` | `4g` | Memory ceiling for the FastAPI container | Size for CatBoost + torch + embeddings |

---

## 7. Notes on the dev stack & helper scripts

- **`backend/docker-compose.yml` (dev)** hardcodes `DATABASE_URL`, `OLLAMA_BASE_URL`, and `OLLAMA_MODEL` with dev defaults (`postgres/postgres`, `phi3:mini`). It does **not** require a `.env`. Do not use it in production.
- **Frontend local config — `frontend/.env.local`** (gitignored) is what `pnpm dev` reads. For a local run against the Dockerised Postgres on port **5433**:
  ```bash
  DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ai_mentor
  BACKEND_URL=http://localhost:8001
  BETTER_AUTH_URL=http://localhost:3000
  BETTER_AUTH_SECRET=local-dev-secret-please-change-...
  NODE_ENV=development
  ```
  (Note the **`postgresql://`** scheme for the frontend vs **`postgresql+asyncpg://`** for the backend — same DB, different driver.)
- **`backend/docker-compose.override.yml`** (gitignored) is auto-loaded by `docker compose` locally. Use it to point the API at a **host-installed Ollama** instead of the bundled container (avoids a port-11434 clash) by setting `OLLAMA_BASE_URL: http://host.docker.internal:11434`. Delete it to use the bundled `ollama` container. See [RUN.md](../RUN.md).
- **Root/`frontend` helper scripts** (`create-*.mjs`, `seed-*.mjs`, `frontend/scripts/*`) read `DATABASE_URL` and fall back to a **local dev** connection string (`postgresql://postgres:postgres@localhost:5433/ai_mentor`). They import `pg`/`better-auth` from `frontend/node_modules`, so run them after `pnpm install`.

---

## 8. Production quick-checklist

- [ ] `POSTGRES_USER`, `POSTGRES_PASSWORD` (strong, alphanumeric), `POSTGRES_DB` set.
- [ ] `INTERNAL_API_TOKEN` set to a strong random value (mandatory if scaling workers).
- [ ] `CORS_ALLOW_ORIGINS` = your public HTTPS origin only.
- [ ] `BACKEND_URL` passed as build arg (`http://api:8000`) — rebuild image to change.
- [ ] `BETTER_AUTH_URL` = public HTTPS URL; `BETTER_AUTH_SECRET` set & stable.
- [ ] `NODE_ENV=production` (secure cookies) with TLS via Caddy.
- [ ] `APP_DOMAIN` + `TLS_EMAIL` set; DNS `A` record points at the server.
- [ ] `ENABLE_DEBUG_ENDPOINTS` off.
- [ ] Google vars set only if using Google login.
- [ ] Pool sizes / PgBouncer considered if many tenants expected.
- [ ] `.env` is gitignored and never committed (verify with `git check-ignore .env`).

---

*This reference reflects every environment variable referenced in the codebase and compose files as they currently exist. No real secret values are included — see the gitignored `.env` for actual values.*
