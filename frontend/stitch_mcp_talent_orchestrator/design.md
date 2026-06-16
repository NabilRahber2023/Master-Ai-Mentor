# MCP Orchestra Frontend Design

## 1. Vision
This workspace is the frontend design system and product blueprint for the MCP Orchestra talent intelligence suite. It combines a cinematic, enterprise-grade UI with predictive analytics modules for student performance, career guidance, subject selection, and talent evaluation.

The design goal is to treat insights as a curated intelligence experience: deep, atmospheric, and human-centered rather than a cluttered dashboard.

## 2. Experience Principles
- **Cinematic Intelligence:** Use depth, tone, and space to make data feel like a living observatory.
- **Modular Clarity:** Each module must be clearly differentiated while sharing a unified shell.
- **Confidence-first UI:** Every prediction or recommendation surface must display confidence, rationale, and data source context.
- **Progressive completion:** Show clear states for empty, loading, validation, unavailable, and ambiguous outcomes.
- **Tenant-aware navigation:** The UI adapts by tenant and user role while preserving a single coherent experience.

## 3. Core Layout
### Shell structure
- **Left Rail:** Tenant-aware module navigation and status.
- **Top Bar:** Global search, action input, and quick context switches.
- **Main Canvas:** Module content, analytics, and interactive recommendations.
- **Right Panel:** Intelligence panel for sources, active context, and recent actions.

### Shell behavior
- Use background surface shifts instead of hard borders.
- Maintain generous spacing and breathing room between sections.
- Apply subtle glassmorphism to floated panels and active cards.

## 4. Design System
### 4.1 Surface and color philosophy
- **Base surface:** Deep onyx tone that is warmer than true black.
- **Nesting surfaces:** layered containers with slightly different brightness.
- **Accent palette:** cyan-based primary and secondary highlights for intelligence, gold/amber for warnings.
- **No-line rule:** section division is created with tone and spacing, not visible borders.

### 4.2 Typography
- **Display / headlines:** geometric, high-tech type for page hero and metric titles.
- **Body / supporting text:** clean, highly legible type for dense data.
- **Wide-label aesthetic:** uppercase labels with expanded tracking for status and section labels.

### 4.3 Elevation and depth
- Achieve hierarchy through tonal layering rather than heavy shadows.
- Use tinted ambient glow shadows when needed, never raw black.
- Apply a ghost border only when contrast is insufficient.

### 4.4 Components
- **Primary buttons:** gradient from primary to secondary.
- **Secondary buttons:** transparent with light boundary accent.
- **Cards:** borderless, layered surface containers with subtle top-edge glow.
- **Sidebar navigation:** clean text-based nav with active indicator light bar.
- **Form fields:** filled surfaces, ghost outline on focus, floating labels.
- **Charts and visuals:** avoid default red/green/yellow, prefer the bespoke palette.

## 5. Shared UI States
- Empty state
- Loading / skeleton state
- Success
- Validation error
- Service unavailable / 503
- Generic failure / 500
- Ambiguous selection / chatbot prompt

## 6. Module Architecture
### 6.1 Chatbot
- **Purpose:** Real-time analysis, guided conversation, tool invocation, and student disambiguation.
- **APIs:** `POST /api/v1/chat/`, `POST /api/v1/chat/reset`, `GET /api/v1/chat/health`
- **Features:** conversation history, @mention tool commands, missing-data prompts, inquiry timeline, source chips.

### 6.2 Grade Prediction
- **Purpose:** Predict future SGPA and academic risk.
- **API:** `POST /api/v1/prediction/sgpa/`
- **Inputs:** SSC/HSC GPA, previous SGPA, study hours, attendance, other academic indicators.
- **Outputs:** predicted SGPA, risk level, top contributing factors, what-if simulation.

### 6.3 Career Prediction
- **Purpose:** Recommend career trajectories and competencies.
- **API:** `POST /api/v1/prediction/career`
- **Inputs:** personality, work environment, CGPA, skill scores, experience.
- **Outputs:** predicted career, confidence, alternative pathways, trajectory timeline.

### 6.4 Subject Prediction
- **Purpose:** Recommend academic subject choices aligned with goals.
- **API:** `POST /api/v1/prediction/subject_choice`
- **Inputs:** demographic data, study style, interests, career goals.
- **Outputs:** recommended department, confidence, alternatives, skill topology.

### 6.5 9-Box Evaluation
- **Purpose:** Evaluate talent using performance and potential.
- **API:** `POST /api/v1/prediction/9box/`
- **Inputs:** academic, competency, experience, behavioral metrics.
- **Outputs:** 9-box position, performance/potential scoring, recommendation, action plan CTA.

## 7. Product Routes and Naming
- **Tenant route example:** `frontend/app/(tenant-app)/home/page.tsx`
- **Module slug:** `growth-potential` for 9-Box, with corresponding module mapping.
- **API endpoints:** consistent `/api/v1/prediction/<module>/` patterns.

## 8. Implementation priorities
1. Shared shell, routing, and tenant-aware layout.
2. Chatbot workflow with full API integration.
3. Grade prediction result framework.
4. Career and subject prediction modules.
5. 9-Box matrix and recommendation simulations.
6. Context panel, export flows, and source transparency.

## 9. Notes
- Respect the cinematic intelligence visual language across all module pages.
- Keep analytics and recommendations accessible and confidence-labeled.
- Use the right panel for persistent context, source tracking, and action history.
