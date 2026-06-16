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

---

## 2. Completed Implementations
1. **Renamed Navigation**:
   * Modified `frontend/components/dashboard/tenant-sidebar.tsx` to rename **Members** to **Subject Prediction**.
   * Changed the route from `/${slug}/members` to `/${slug}/subject-prediction`.
   * Updated the icon to `Brain` (imported from `lucide-react`).
2. **Subject Prediction Page**:
   * Created a fully responsive Next.js client component at `frontend/app/(tenant-app)/[slug]/subject-prediction/page.tsx`.
   * Integrated the styling and bento grids from the `stitch_mcp_talent_orchestrator` assets.
   * Coded interactive telemetry tuning sliders (`Cognitive Aptitude Weight`, `Workload Tolerance`, `Market Trend Impact`) that dynamically update course recommendations (e.g., *Advanced Computational Physics*, *AI Ethics & Policy*, *Quantum Cryptography*), recalculate projected GPAs, adjust alignment metrics, and scale the Skill Topology radar chart SVG coordinates.
   * Implemented locking/adding selections into local state.

---

## 3. Running Services
All services are running on their local ports. Do not restart them unless needed:
* **Backend Stack (Docker Compose)**:
  * Database: PostgreSQL (with pgvector) on port `5433` (container: `ai_mentor_db`).
  * LLM Engine: Ollama on port `11434` (container: `ai_mentor_ollama`).
  * API Server: FastAPI on port `8001` (container: `ai_mentor_api`).
* **Frontend Dev Server**:
  * Port: Next.js dev server is running on port `3000` (URL: `http://localhost:3000`).
  * Running in the background as task: `e419b8fc-cbb5-40ef-b488-0259960a660d/task-125`.
