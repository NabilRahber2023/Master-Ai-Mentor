# MCP Orchestra: Frontend Product Specification (Blueprint)

## 1. System Foundation & Architecture
- **Route Structure:** `frontend/app/(tenant-app)/home/page.tsx`
- **Navigation:** Tenant-aware sidebar with module access control.
- **Canonical Naming (9-Box):**
    - UI Label: **9-Box Evaluation**
    - Tenant Slug: `growth-potential`
    - API Tool: `predict_9box`
    - API Endpoint: `/api/v1/prediction/9box/`

## 2. Global Design Requirements
### Layout Shell
1. **Left Rail:** Module status and tenant-aware visibility.
2. **Top Bar:** Global search and action input.
3. **Main Canvas:** Module-specific analytic content.
4. **Right Intelligence Panel:** Context, active sources, and recent actions.

### Shared UI States & Patterns
- **States:** Empty, Loading (Skeletons), Success, Validation Error, Service Unavailable (503), Generic Failure (500), Ambiguous Selection (Chatbot).
- **Interactions:** Primary CTA per module, secondary action set (export/simulate), inline validation, progressive disclosure.
- **Data Confidence:** Every prediction card must show confidence percentages (Model vs. Business).

## 3. Module Specifications

### Module 1: Chatbot (Real-time Analysis)
- **API:** `POST /api/v1/chat/`, `POST /api/v1/chat/reset`, `GET /api/v1/chat/health`
- **Features:** 
    - Conversation thread with @mentions for tools.
    - Command suggestions: `@sgpa`, `@career`, `@9box`, `@subject`, `@all`.
    - Disambiguation cards for student selection.
    - Dynamic data collection UI for missing fields (`requires_input`).
    - Inquiry timeline markers and source chips.

### Module 2: Grade Prediction
- **API:** `POST /api/v1/prediction/sgpa/`
- **Inputs:** SSC/HSC GPA, Previous SGPA, Study Hours, Attendance, etc.
- **Outputs:** Predicted SGPA, Risk Level (High/Med/Low), Top 5 Contributing Factors.
- **Visuals:** Forecast card, Risk bands, What-if simulator sliders.

### Module 3: Career Prediction
- **API:** `POST /api/v1/prediction/career`
- **Inputs:** Personality (MBTI), Work Environment, CGPA, Skill Scores (0-10), Experience.
- **Outputs:** Predicted Career, Confidence Score, Alternative Paths.
- **Visuals:** Trajectory timeline (+2y, +5y, +10y), Competency Delta (Have vs. Need).

### Module 4: Subject Prediction
- **API:** `POST /api/v1/prediction/subject_choice`
- **Inputs:** Demographic data, Study style, Interest scores, Career goals.
- **Outputs:** Recommended Department, Confidence, Alternatives.
- **Visuals:** Hero recommendation, Skill topology radar, Semester projection tile.

### Module 5: 9-Box Evaluation
- **API:** `POST /api/v1/prediction/9box/`
- **Inputs:** Academic, Competency, Experience, and Behavioral metrics.
- **Outputs:** Performance/Potential scores, 9-box position, Recommendation.
- **Visuals:** 3x3 interactive matrix, Delta indicators for grid movement, Action plan CTA.

## 4. Implementation Priorities
1. Shared Shell & Router.
2. Chatbot (Full API Integration).
3. Grade Predictor (Result Framework).
4. Career & Subject Modules.
5. 9-Box Matrix & Simulations.
6. Context Panel & Export Flows.