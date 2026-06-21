# AI Mentor - Project Status Summary

This document summaries the exact state of the project, modifications made, and how to verify and run the workspace. Read this file at the start of the next session to resume immediately.

---

## 1. Credentials & Database State
* **User Login Credentials**:
  * **Email**: `oxford@gmail.com`
  * **Password**: `@oxford123#`
* **Account Type**: Created successfully using the native Better Auth sign-up API (ensuring the correct cryptographic password hashing scheme is used).
* **Organization & Memberships**:
  * The user `oxford@gmail.com` has been linked in the database to **Daffodil University** (`org-platinum-1` organization) with the role of `admin`.
  * Logging in with `oxford@gmail.com` will bypass the default `/dashboard` 404 page and redirect directly to the tenant's dynamic homepage: `http://localhost:3000/daffodil/home`.
* **Database Updates**:
  * Fixed database session query issues by adding the missing `impersonated_by` text column to the `session` table.

---

## 2. Completed Implementations
1. **Renamed Navigation**:
   * Modified `frontend/components/dashboard/tenant-sidebar.tsx` to rename **Members** to **Subject Prediction**.
   * Changed the route from `/${slug}/members` to `/${slug}/subject-prediction`.
   * Updated the icon to `Brain` (imported from `lucide-react`).
2. **Subject Prediction Page**:
   * Created a fully responsive Next.js client component at `frontend/app/(tenant-app)/[slug]/subject-prediction/page.tsx`.
   * Integrated telemetry tuning sliders and skill topology radar chart SVGs.
3. **Growth Potential Page**:
   * Implemented a fully functional, responsive, dark futuristic 9-Box talent matrix page at `frontend/app/(tenant-app)/[slug]/modules/growth-potential/page.tsx`.
   * Includes interactive grid selections, department and cohort filtering, cohort breakdown cards, talent movement trajectory metrics, live AI Insights generation, and CSV/JSON/TXT report exporters.

---

## 3. Running Services
All services are running on their local ports. Do not restart them unless needed:
* **Backend Stack (Docker Compose)**:
  * Database: PostgreSQL (with pgvector) on port `5433` (container: `ai_mentor_db`).
  * LLM Engine: Ollama on port `11434` (container: `ai_mentor_ollama`).
  * API Server: FastAPI on port `8001` (container: `ai_mentor_api`).
* **Frontend Dev Server**:
  * Port: Next.js dev server is running on port `3000` (URL: `http://localhost:3000`).

---

## 4. Full Stack Brought Online & Verified

* **Backend Docker stack** rebuilt and started (`docker compose up -d`). All containers healthy: `ai_mentor_db` (5433), `ai_mentor_ollama` (11434, model `phi3:mini`), `ai_mentor_api` (8001).
* **Swagger UI** live at `http://localhost:8001/docs`; OpenAPI at `/openapi.json`; health at `/health`.
* **Student dataset ingested**: `backend/master_dataset.csv` → **10,000 students** loaded into the `students` table (with embeddings). Now **63 columns** (original 48 + 15 for CSV mode, see §10). Run inside the container if it ever needs re-seeding:
  `docker cp master_dataset.csv ai_mentor_api:/tmp/master_dataset.csv && MSYS_NO_PATHCONV=1 docker exec ai_mentor_api python -m app.chatbot.ingest_csv /tmp/master_dataset.csv`

---

## 5. ML Modules Wired to Live APIs (was mock-only)

Previously the 4 prediction module pages were polished mock UIs with **no** backend calls. They are now fully connected.

* **Shared typed API client**: `frontend/lib/api/client.ts` (POST + multipart helpers, FastAPI error formatting) and `frontend/lib/api/predictions.ts` (typed request/response + enums mirroring the backend Pydantic schemas).
* **Live prediction panels** added under `frontend/components/modules/live-prediction/` and mounted in each module:
  * Grade → `/api/v1/prediction/sgpa/`
  * Subject → `/api/v1/prediction/subject/subject_choice`
  * Career → `/api/v1/prediction/career/career`
  * Growth Potential / 9-Box → `/api/v1/prediction/9box/`
* **Admin CSV upload UI** at `/dashboard/admin` wired to `/api/v1/admin/upload-csv` (`frontend/components/admin/csv-upload.tsx`).
* **Demo-credentials button** added to the login form, env-gated to non-production (`frontend/components/auth/email-login-form.tsx`).

---

## 6. "Start Fresh + Result-Driven" Dashboards

Every prediction page now starts **blank** and only populates from its evaluate button; editing any input resets to fresh.

* **Growth Potential (9-Box)**: dashboard hidden until **Evaluate**; grid, "9-Box:" label, cohort breakdown, AI insight, confidence, retention, and recommendation all driven by the result. Demo employee data removed from display.
* **Grade Prediction**: `StudentAnalyticsDashboard` takes the live prediction as a prop — Model Confidence, Current/Predicted GPA, Impact Factors, Primary Impact Factors, What-If baselines all bound to the real SGPA result + contributing factors.
* **Career Guidance**: hero title, Career Readiness, Recommended Careers list, and **Impact Factors** bound to the prediction.
* **Subject Prediction**: recommended department, confidence ring, subject cards, and **Impact Factors** bound to the prediction.

---

## 7. Backend Fixes & Enhancements

* **9-Box 500 bug fixed**: CatBoost output flattened to a scalar in `backend/app/core/nine_box_ml_engine.py` (NumPy `int()` on a 1-element array).
* **Confidence scores added**: `confidence_score` returned by the **9-Box** model (avg of the two classifiers' top-class probabilities).
* **SHAP contributing factors added** to the **Career** (`career_ml_engine.py`) and **Subject** (`subject_ml_engine.py`) models, surfaced via `contributing_factors` in their responses and rendered as Impact Factors on the pages.
* **CORS tightened**: `allow_origins=["*"]` replaced with an env-driven allow-list (`CORS_ALLOW_ORIGINS`, defaults to localhost) in `backend/app/main.py`.
* **Next.js proxy**: `/api/v1/*` rewrite to the backend confirmed working; trailing-slash endpoints resolve via same-origin redirect (browser follows automatically).

---

## 8. AI Chatbot — Audited & Fixed (fully working)

* **Wrong tool URLs fixed** in `backend/app/chatbot/tools.py` (career and subject predictions were hitting non-existent paths → returned `null`). Now `/career/career` and `/subject/subject_choice`.
* **Frontend result rendering fixed** in `frontend/app/(tenant-app)/[slug]/modules/ai-chatbot/page.tsx`: results are nested at `data.result.result`. Rewrote the handler to render real structured cards for **all four** prediction types (was showing hardcoded fallbacks; subject/9-Box had no card). Removed the old mock fallback.
* **"Unknown tool: clarification" fixed** in `backend/app/chatbot/mcp_dispatcher.py`: LLM-hallucinated tools now fall back to a helpful capabilities message instead of a raw error.
* **Verified live**: chat health OK; student search + disambiguation; select by ID; SGPA / career / subject / 9-Box all return real results; greeting/help/unknown handled gracefully; session reset OK.

---

## 9. How to Verify Quickly

* Frontend typecheck: `cd frontend && npx tsc --noEmit` → **0 errors**.
* Backend health: `curl http://localhost:8001/health` and `curl http://localhost:8001/api/v1/chat/health`.
* Login: `oxford@gmail.com` / `@oxford123#` → open each module under `/daffodil/modules/...`; click the evaluate/predict button to populate the dashboard.
* See `ROADMAP.md` for the full phased roadmap and remaining work (real Google OAuth, auth on ML endpoints, CI/deploy).

---

## 10. CSV Mode — Predict directly off the uploaded dataset (NEW)

Every single-student module now has a **Manual | CSV** toggle (top-right of the page). In
CSV mode the module runs its trained model directly on the uploaded `students` table — no
manual form entry. Two sub-tabs:
* **Single student** — searchable picker; the picked record feeds the module's *existing*
  rich dashboard (same `livePrediction` path as manual, incl. SHAP impact factors).
* **Whole batch** — the model runs across all 10,000 students; shows KPIs, a distribution
  chart, and a results table.

Batch Prediction and AI Chatbot were already CSV-driven and are unchanged.

### Data layer (15 columns added)
The trained models needed features the original 48-column dataset lacked. Added **15
columns**, generated deterministically (seeded per `student_id`, correlated to existing
signals) so model output is sensible and reproducible:
* Grade: `ssc_gpa`, `father_education`, `mother_education`, `part_time_hours`, `parental_support`, `active_participation`
* Career: `public_speaking`, `internship_experience_months`, `projects_completed`, `preferred_work_environment`, `interest_area`
* Growth/9-Box: `teamwork_score`, `learning_agility`, `adaptability`, `career_motivation` (+ shares `internship_experience_months`)
* Subject needed **no** new columns — all derivable from existing fields.

Generator: `backend/scripts/augment_dataset.py` (backs up to `master_dataset.original.csv`).
Schema updated in `backend/init.sql`, `backend/app/chatbot/models.py`,
`backend/app/chatbot/ingest_csv.py` (column mapping); live DB migrated via `ALTER TABLE`.
Full contract in `DATASET_SPEC.md`.

### Backend (`backend/app/modules/csv_mode/`)
* `mappers.py` — turns a `students` row into each model's exact feature set (enum coercion,
  Low/Med/High bucketing, dept/study-style/location/career-goal derivations).
* `services.py` — single (reuses the per-module services) + vectorised CatBoost **batch**
  over the whole cohort; `schemas.py`, `router.py`.
* Registered at `/api/v1/prediction/csv`:
  `GET /students` (list/search), `GET /{module}/predict/{id}` (single),
  `GET /{module}/batch` (cohort), module ∈ `{grade, career, subject, growth}`.

### Frontend
* `frontend/lib/api/csv-mode.ts` — typed client.
* `frontend/components/modules/csv-mode/` — `mode-switch`, `student-picker`, `csv-mode-panel`,
  `batch-view`. Wired into grade-prediction, career-guidance, growth-potential, subject-prediction pages.

### Ingestion bug fixed (would break any CSV with blanks)
pandas 3.0 read the literal `"None"` education value as `NaN` (crashed the string insert),
and `df.where(notnull, None)` re-coerced `None`→`NaN` on numeric columns. Fixed in
`ingest_csv.py`: `read_csv(keep_default_na=False, na_values=[""])` + `astype(object)` before
the NaN→None pass.

### Verified live
All 4 single + 4 batch endpoints run over 10k students (via `:3000` proxy → backend).
Grade 95.2% pass rate; Career 68.2% avg confidence; Growth 1,348 stars. Frontend `tsc` 0 errors.
**Known limitation:** Subject batch confidence is low (~16%) — that model splits across 20
fine-grained departments and several inputs are *derived* (bucketed) from coarser fields; it
operates correctly but spreads probability thin. Sharper results would need the subject
model's native columns added to the CSV the same way as the other 15.
