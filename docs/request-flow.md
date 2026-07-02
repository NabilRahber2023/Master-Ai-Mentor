# Request Lifecycle — From Browser to Response and Back

> A step-by-step teaching walkthrough of what happens between the moment a user opens the site and the moment they see a result. Written for a junior backend engineer: we explain *why* each step exists, not just *what* it does.
>
> **Companion docs:** [architecture.md](architecture.md) · [docker-explained.md](docker-explained.md) · [environment.md](environment.md) · [deployment-audit.md](deployment-audit.md)

---

## The mental model first

Before the details, hold this picture in your head:

```
Browser ──HTTPS──► Caddy ──► Next.js (frontend) ──┬──► FastAPI (backend) ──► ML models / Ollama
                                                    └──► PostgreSQL (auth + tenant data)
```

Two rules explain almost everything:
1. **The browser only ever talks to the frontend.** It never calls the backend directly. The frontend *proxies* API calls to FastAPI behind the scenes.
2. **There are two kinds of database:** one **shared** DB for accounts/permissions, and **one private DB per organization** for that org's student data.

Keep those two rules in mind and the rest follows naturally.

---

## 1. DNS — turning a name into a server

When the user types `https://intellector.example.com`, the browser doesn't know where that is yet. It needs an **IP address**.

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant R as DNS Resolver
    participant A as Authoritative DNS

    B->>R: Where is intellector.example.com?
    R->>A: (if not cached) resolve A record
    A-->>R: 203.0.113.10  (the EC2 server's IP)
    R-->>B: 203.0.113.10
    Note over B: Browser now knows which server to connect to
```

- **What's happening:** DNS is the phone book of the internet. The domain's **A record** points at your EC2 server's public IP.
- **Why it matters here:** In our deployment, that DNS record *must* exist and point at the server **before** you start the stack — because **Caddy** contacts Let's Encrypt to get an HTTPS certificate, and Let's Encrypt verifies you control the domain by connecting back to it. No DNS → no certificate → no HTTPS.
- **Junior tip:** DNS results are cached (by the OS, the browser, and resolvers) using a "TTL". That's why a DNS change can take minutes to propagate.

---

## 2. Browser — TLS handshake and the first request

Now the browser opens a connection to that IP on **port 443** (HTTPS).

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant C as Caddy (:443)

    B->>C: TCP connect (port 443)
    B->>C: TLS ClientHello
    C-->>B: TLS certificate (issued by Let's Encrypt)
    Note over B,C: Keys exchanged → encrypted channel established
    B->>C: GET / HTTP/2 (Host: intellector.example.com)
```

- **TLS handshake:** the browser and Caddy agree on encryption keys so nobody in the middle can read the traffic. Caddy presents the certificate it obtained for `APP_DOMAIN`.
- **Why HTTPS is non-negotiable here:** our login cookie is marked **`Secure`** in production, which means the browser will only send it over HTTPS. No HTTPS → the session cookie never travels → the user looks perpetually logged out. (This is exactly the "No TLS" risk called out in the audit.)
- **The browser also carries cookies:** if the user logged in before, the request automatically includes `Cookie: better-auth.session_token=...`. The browser attaches it for us — we don't have to do anything.

---

## 3. Caddy — the reverse proxy (the front door)

Caddy is the only service exposed to the internet. Its job is small but important.

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant C as Caddy
    participant F as Frontend (Next.js :3000)

    B->>C: HTTPS request
    Note over C: Terminate TLS (decrypt)<br/>Add security headers (HSTS, X-Frame-Options…)
    C->>F: Plain HTTP to frontend:3000 (internal network)
    F-->>C: HTTP response
    Note over C: Re-encrypt
    C-->>B: HTTPS response
```

- **"Terminate TLS"** means Caddy decrypts the request here, at the edge. Everything *inside* the Docker network is plain HTTP — but that's fine because it's a private network no one outside can reach.
- **Reverse proxy** = a server that forwards requests to another server on the client's behalf. The browser thinks it's talking to one server; really Caddy is relaying to the frontend.
- Caddy also adds hardening headers (HSTS, `X-Content-Type-Options`, etc.) from our `Caddyfile`.

---

## 4. Frontend (Next.js) — two very different responsibilities

The frontend does **two jobs**, and it's crucial to understand they're separate:

### Job A — serve the UI (pages)
For a normal page load (`GET /`, `GET /login`, `GET /[slug]/home`), Next.js renders React and sends HTML/JS back. The browser then runs the React app.

### Job B — proxy API calls to the backend
When the React app needs data or a prediction, it calls a path like `POST /api/v1/prediction/sgpa/`. Next.js is configured (in `next.config.ts`) to **rewrite** anything starting with `/api/v1/` and forward it to the backend.

```mermaid
sequenceDiagram
    autonumber
    participant React as Browser (React app)
    participant N as Next.js server
    participant BE as FastAPI backend

    React->>N: POST /api/v1/prediction/sgpa/ (cookie attached)
    Note over N: next.config.ts rewrite:<br/>/api/v1/:path*  →  BACKEND_URL/api/v1/:path*
    N->>BE: Forward request + cookie (server-to-server)
    BE-->>N: JSON result
    N-->>React: JSON result
```

**Why proxy instead of calling the backend directly from the browser?** Three reasons a junior should internalize:
1. **Security:** the backend is never exposed publicly — only the frontend can reach it (they're on the same private Docker network, `http://api:8000`).
2. **Same-origin cookies:** because the browser thinks everything is on `intellector.example.com`, the `SameSite=Lax` session cookie is included automatically. If the browser called the backend on a different origin, the cookie would be dropped and auth would fail.
3. **No CORS headaches** for the browser (the server-to-server hop isn't subject to browser CORS).

> **Detail that fixed a real bug:** `skipTrailingSlashRedirect` in `next.config.ts`. FastAPI expects a trailing slash on some routes. Without this setting, Next.js would issue a redirect that could *drop the session cookie*, causing random "Authentication required" errors. The rewrite deliberately preserves the trailing slash.

> **Build-time gotcha:** `BACKEND_URL` is baked into the frontend when the image is **built**, not when it runs. That's why our Dockerfile requires it and the build fails loudly if it's missing.

The frontend *also* talks to the database directly for some things (login via Better Auth, RBAC lookups, tenant provisioning) using Drizzle ORM — but for ML/chatbot work, it's purely a proxy.

---

## 5. Backend (FastAPI) — the middleware pipeline

The request now arrives at FastAPI. Before your endpoint code runs, the request passes through a **pipeline** of middleware and dependencies. Order matters.

```mermaid
graph TD
    In["Incoming request from Next.js"] --> Sec["SecurityMiddleware<br/>(rate limit + size limit — /chat only)"]
    Sec --> CORS["CORS middleware<br/>(checks Origin against allow-list)"]
    CORS --> Route["Router match<br/>e.g. /api/v1/prediction/sgpa/"]
    Route --> Dep["Dependency: require('predict:single', module='grade-prediction')"]
    Dep --> Auth["resolve_principal() → who + what allowed?"]
    Auth --> Handler["Endpoint handler runs"]
    Handler --> Resp["JSON response"]
```

Step by step:
1. **SecurityMiddleware** — for **chatbot** requests only (`/chat`), enforces a rate limit (30 requests/minute per client) and a max body size (10 KB). Other endpoints skip it. *(In-memory today; the code notes Redis for multi-instance production.)*
2. **CORS middleware** — checks the browser `Origin` against `CORS_ALLOW_ORIGINS`. Because we allow credentials (cookies), `*` is not permitted — we use an explicit allow-list.
3. **Routing** — FastAPI matches the URL to a router (e.g. the SGPA predictor).
4. **Authorization dependency** — every protected router is wrapped in `Depends(require(permission, module))`. This runs **before** your handler. If it raises 401/403, the handler never executes.
5. **Handler** — your actual endpoint logic (fetch student, run model, etc.).

**Why a dependency for auth instead of code inside every handler?** So authorization is declared **once per route** and can't be forgotten. It's centralized, consistent, and testable. This is the FastAPI idiom — lean on it.

---

## 6. Authentication & Authorization — "who are you, and are you allowed?"

This is the heart of the backend. FastAPI doesn't run its own login system — it **trusts the same session table the frontend writes to**. One source of truth.

```mermaid
sequenceDiagram
    autonumber
    participant BE as FastAPI (require dependency)
    participant P as resolve_principal()
    participant DB as Shared/Control DB

    BE->>P: Who is this request?
    alt Internal service call
        Note over P: Header x-internal-token matches INTERNAL_API_TOKEN?
        P-->>BE: Service principal (super_admin) — skip DB
    else User request
        Note over P: Extract token from<br/>better-auth.session_token cookie
        P->>DB: SELECT session JOIN user (role)
        DB-->>P: user_id, platform_role, expires_at
        P->>DB: SELECT member (org + org_role)
        P->>DB: SELECT org_module (enabled modules)
        P->>DB: organization.metadata → tenantDbName
        DB-->>P: org_role, modules, tenant DB name
        Note over P: Cache result 30s (avoid re-querying every call)
        P-->>BE: Principal(user, role, org, modules, tenantDb)
    end
    BE->>BE: has_permission(platform_role, org_role, perm)?
    BE->>BE: module enabled for this org?
    alt allowed
        BE->>BE: continue to handler
    else denied
        BE-->>BE: 403 Forbidden
    end
```

Let's unpack the important ideas:

### The "Principal"
A `Principal` is just an object answering "who is this caller?" — user id, platform role, org, org role, entitled modules, and which tenant database they belong to. Building it is the first thing every protected request does.

### Two ways to authenticate
- **Session cookie** (normal users): the cookie value is `<token>.<signature>`; we take the token part and look it up in the `session` table. We also check it hasn't **expired**.
- **Internal token** (service-to-service): when the *chatbot* calls the ML endpoints, it can't present a user cookie, so it sends a secret header `x-internal-token`. If it matches `INTERNAL_API_TOKEN`, the caller is treated as a trusted super-admin service. (This is why that token must be a strong secret — see [environment.md](environment.md).)

### Two planes of permission
Authorization asks two questions:
1. **Do you have the permission?** Granted if **either** your *platform role* (`super_admin`, `support`, …) **or** your *org role* (`owner`, `admin`, `analyst`, `mentor`, `viewer`, …) grants it. Rules live in `matrix.py` (backend) mirrored by `rbac.ts` (frontend), kept in sync by a test.
2. **Is the module enabled for your organization?** Even if you *can* run predictions, your org must be **entitled** to that module (`org_module.enabled`). This is the SaaS "which features has this customer paid for" switch.

### Caching
Resolving a principal hits the DB several times, so results are cached in-memory for **30 seconds** per token. This keeps a burst of requests from hammering the auth tables. Trade-off: a permission change can take up to 30s to take effect.

---

## 7. Database — routing to the correct tenant

Once we know *who* the user is, we know *which database* holds their data. This is the multi-tenant magic.

```mermaid
sequenceDiagram
    autonumber
    participant BE as Backend
    participant Ctl as Shared/Control DB
    participant T as Tenant DB (e.g. tenant_orgA)

    Note over BE: During auth we already read<br/>organization.metadata.tenantDbName
    BE->>BE: current_tenant_db.set("tenant_orgA")
    Note over BE: contextvars = isolated per async request<br/>(concurrent users never collide)
    BE->>T: ensure_tenant_ready() — first time only:<br/>CREATE EXTENSION vector + create tables
    BE->>T: SELECT * FROM students WHERE ...
    T-->>BE: student row(s)
    Note over BE,Ctl: Auth/session reads ALWAYS go to the shared DB<br/>Student data ALWAYS goes to the tenant DB
```

Key concepts for a junior:
- **`contextvars`** — think of it as a variable that's *private to the current request*, even though many requests run concurrently on the same event loop. We stash the tenant DB name there so that any code deeper in the call stack automatically uses the right database. No need to pass the tenant name through every function.
- **Connection pools** — opening a DB connection is expensive, so we keep a reusable pool. There's one pool for the shared DB and **one pool per tenant**. (This is why pool sizes are tunable — too many tenants × too-big pools can exhaust Postgres connections.)
- **Lazy schema creation** — the first time we touch a tenant DB in this process, we create the `pgvector` extension and tables (`ensure_tenant_ready`). After that it's a no-op.
- **The golden rule:** accounts/permissions → **shared** DB; student data + chat memory → **tenant** DB. Never mix them up.

---

## 8. AI Components — predictions and the chatbot

There are two flavors of "AI" and they behave very differently.

### 8a. Fast ML predictions (no LLM)
For an SGPA/career/9-box/subject prediction, the backend loads a pre-trained **CatBoost** model (a `.cbm` file) into memory at startup and runs it. This is pure math — milliseconds, no network, no external API.

```mermaid
sequenceDiagram
    autonumber
    participant H as Endpoint handler
    participant T as Tenant DB
    participant M as CatBoost model (in memory)

    H->>T: fetch student features
    T-->>H: features
    H->>M: model.predict(features)
    M-->>H: prediction + contributing factors (SHAP)
    H-->>H: build JSON response
```

### 8b. The chatbot (uses the local LLM)
The chatbot is more involved. The user sends a message; a **LangChain orchestrator** decides what to do, possibly calling the **Ollama** LLM to interpret intent, then invoking **tools** (which are really just calls back into our own ML endpoints).

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant CH as Chatbot service
    participant O as Ollama (phi3:mini)
    participant TL as Tools
    participant ML as ML endpoints (same backend)
    participant T as Tenant DB

    U->>CH: "How will Ayesha do next semester?"
    CH->>T: load conversation memory (chat_sessions)
    CH->>O: interpret message + choose tool
    O-->>CH: intent = predict_sgpa, student = "Ayesha"
    CH->>TL: run search_student / predict_sgpa
    TL->>ML: POST /api/v1/prediction/sgpa/ (x-internal-token)
    ML->>T: fetch student
    ML-->>TL: prediction
    TL-->>CH: tool result
    CH->>O: (optional) phrase a natural reply
    CH->>T: save updated conversation memory
    CH-->>U: friendly answer
```

Things to notice:
- **The chatbot calls our own API using the internal token** — that's the service-principal path from §6. It's the app talking to itself as a trusted client.
- **Conversation memory** lives in the tenant's `chat_sessions` table (selected student, last intent, pending fields), so the bot remembers context across messages.
- **Graceful degradation:** if Ollama is down, the code logs a warning and uses a fallback rather than crashing. AI being unavailable should never take down the whole request.
- **Semantic search:** finding "Ayesha" uses pgvector embeddings + fuzzy text matching, so the bot can match approximate names.

---

## 9. External services — what's actually "external"?

A useful clarification for a junior: in this system, most "services" are **internal containers**, not third-party APIs.

| Service | Internal or external? | Notes |
|---------|----------------------|-------|
| PostgreSQL | Internal container | Same Docker network |
| Ollama (LLM) | Internal container | Runs locally — **no** paid AI API, no data leaves the box |
| Google OAuth | **External** (optional) | Only during "Sign in with Google" |
| Let's Encrypt | **External** (setup only) | Contacted by Caddy to issue/renew TLS certs |

So on a normal prediction/chat request, **nothing leaves your server**. The only genuinely external calls are Google login (optional) and certificate issuance (handled by Caddy in the background). That's great for privacy and latency.

---

## 10. Response flow — the journey back

The response retraces its steps in reverse. Every hop that added something on the way in, unwinds on the way out.

```mermaid
sequenceDiagram
    autonumber
    participant M as ML model / DB
    participant BE as FastAPI
    participant N as Next.js
    participant C as Caddy
    participant B as Browser

    M-->>BE: raw result
    Note over BE: Serialize to JSON (Pydantic schema)<br/>Global exception handler wraps any error as clean 500
    BE-->>N: HTTP 200 + JSON
    Note over N: Pass through the proxy rewrite
    N-->>C: HTTP response
    Note over C: Re-encrypt (TLS) + add security headers
    C-->>B: HTTPS 200 + JSON
    Note over B: React updates state → UI re-renders with the result
```

- **Serialization:** FastAPI converts Python objects to JSON using **Pydantic** response models, which also guarantees the shape of what we send.
- **Error safety:** a global exception handler turns any unhandled crash into a clean `{"error": "internal_error"}` 500 — we never leak stack traces to users.
- **Back through the proxy:** Next.js relays the JSON unchanged; Caddy re-encrypts it.
- **The browser finishes the job:** React receives the JSON, updates component state, and the UI re-renders — the user sees their prediction or chat reply.

---

## 11. The whole trip, end to end

Here's everything in one diagram — a protected prediction request from a logged-in user.

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant C as Caddy
    participant N as Next.js
    participant F as FastAPI
    participant S as Shared DB
    participant T as Tenant DB
    participant M as CatBoost model

    B->>C: HTTPS POST /api/v1/prediction/sgpa/ (cookie)
    C->>N: forward (TLS terminated)
    N->>F: rewrite → http://api:8000 (+cookie)
    F->>F: SecurityMiddleware (skip: not /chat) + CORS check
    F->>S: resolve_principal (session, role, org, modules, tenantDb)
    S-->>F: Principal
    F->>F: require('predict:single', 'grade-prediction') ✔
    F->>T: fetch student features (tenant DB)
    T-->>F: features
    F->>M: predict
    M-->>F: SGPA + factors
    F-->>N: 200 JSON
    N-->>C: 200 JSON
    C-->>B: 200 JSON (HTTPS)
    B->>B: React renders the result
```

---

## 12. Recap — the ten things to remember

1. **DNS** points the domain at the EC2 server (needed for TLS too).
2. **TLS/HTTPS** is required or the secure session cookie won't be sent.
3. **Caddy** is the only public door; it terminates TLS and forwards internally.
4. **The browser only talks to the frontend**; Next.js proxies `/api/v1/*` to the backend.
5. **`BACKEND_URL` is build-time**; `skipTrailingSlashRedirect` protects the cookie.
6. **FastAPI trusts the frontend's session table** — one identity source.
7. **Two planes of permission** (platform role OR org role) **plus** module entitlement.
8. **`contextvars` routes each request to the right tenant database**; auth always uses the shared DB.
9. **Predictions are local CatBoost math; the chatbot uses local Ollama** — nothing leaves the server on a normal request.
10. **The response retraces every hop in reverse**, ending with React re-rendering in the browser.

---

*This document describes the request lifecycle as implemented in the repository today. For the static architecture see [architecture.md](architecture.md); for configuration see [environment.md](environment.md).*
