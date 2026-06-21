# Dataset / CSV Specification

How the student dataset CSV must be shaped so the **whole platform** works after an
upload from **Dashboard → Upload Student Dataset (CSV)**.

## TL;DR
Your existing **`backend/master_dataset.csv` already works as-is — no changes needed.**
It now has **63 columns**: the original 48 (chatbot + Batch Prediction) plus **15
extra feature columns** that let the single-student predictors (Grade, Career,
Growth/9-Box) run in **CSV mode** directly off the uploaded dataset. Any replacement
CSV just needs the **same header row** (same column names) and one row per student.

> The original 48-column file (`backend/master_dataset.original.csv`) still works —
> the 15 extra columns are nullable. But with them absent, the Grade/Career/Growth
> **CSV mode** falls back to derived/neutral values for the missing features.

---

## What happens when you upload

1. Dashboard posts the file to `POST /api/v1/admin/upload-csv`.
2. The backend streams it to disk and runs ingestion in the background:
   `students` table is **TRUNCATEd**, the CSV is parsed, a 384-dim semantic
   **embedding** is generated per row (name + district + department + career path),
   and rows are bulk-inserted.
3. The dashboard polls the dataset size and shows the new student count when ready.

Ingesting ~10k rows takes roughly 30–90s (embedding generation on CPU).

## Which parts of the platform consume the CSV

| Feature | Uses the uploaded CSV? | How |
|---|---|---|
| **AI Chatbot** | ✅ Yes, directly | Searches/answers from the `students` table live |
| **Batch Prediction** (new) | ✅ Yes, directly | Overview, filters, predictions, prescriptions, forecast are all SQL over `students` |
| **Grade / Career / Subject / Growth (9-Box)** single predictors | ⚙️ Indirectly | These run **pre-trained ML models** on the *form inputs you type*, not on the dataset. They keep working regardless, but a new CSV does **not** retrain them. Retraining is a separate offline step (`backend/app/modules/*/training.py`). |

So a single CSV upload powers the chatbot + the entire Batch Prediction cohort
dashboard immediately. The four single-student predictors are model-driven and are
unaffected by (and don't need) the upload.

---

## Column contract (48 columns)

- **Header row is required.** Column names are normalised to `snake_case`
  (lowercased, spaces/hyphens → underscores), so `Student ID` and `student_id`
  both map correctly. Unknown columns are ignored; missing columns become `NULL`.
- Only `student_id` and `name` are effectively required (primary key + display).
  Everything else is nullable — but the columns marked **★** below should be present
  and numeric for the dashboards and chatbot to be meaningful.

```
student_id ★            name ★                  age
gender ★ (M/F/Other)    district                family_income
budget_per_semester     study_style             attendance_rate ★ (0–100)
hsc_gpa                 english_proficiency     math_skill
memory_strength         stress_management       study_hours_weekly ★
assignment_completion_rate  class_participation project_skill_score
research_interest_score extracurricular_involvement  current_sgpa ★ (0–4)
past_semester_sgpa_1 ★  past_semester_sgpa_2 ★  next_semester_sgpa ★ (0–4, the prediction target)
leadership_indicator    productivity_score      initiative_score
programming_interest    business_interest       creative_interest
hardware_interest       math_interest           communication_skill
analytical_skill        problem_solving_score   preferred_department ★
personality_type        tech_score              business_score
creative_score          research_score          work_style
soft_skill_score        career_orientation      preferred_career_path
performance_score       potential_score         nine_box_position
```

### Extra columns for CSV-mode single-student prediction (15)
These feed the trained Grade / Career / Growth(9-Box) models when a module runs in
CSV mode. They are synthesised in `master_dataset.csv` (see
`backend/scripts/augment_dataset.py`) — deterministic, seeded per `student_id`, and
correlated with the row's existing signals so model output is sensible.

```
# Grade Prediction
ssc_gpa (0–5)           father_education        mother_education
part_time_hours         parental_support (Yes/No)  active_participation (Yes/No)
# Career Guidance
public_speaking (0–10)  internship_experience_months  projects_completed
preferred_work_environment (Remote/Hybrid/Office)   interest_area
# Growth / 9-Box
teamwork_score (0–10)   learning_agility (0–10) adaptability (0–10)
career_motivation (0–10)   # (also reuses internship_experience_months)
```

`father_education`/`mother_education` use: `None | Primary | Secondary | HigherSec |
Graduate | Postgraduate`. To regenerate after replacing the base data:
`python backend/scripts/augment_dataset.py`.

### How key columns drive the dashboards
- **`current_sgpa`** → category buckets (High ≥3.5 / Mid 2.5–3.49 / Low <2.5), overview KPIs.
- **`next_semester_sgpa`** → the **predicted SGPA** shown in Batch Prediction (falls back to `current_sgpa` if blank). On-track ≥2.5, At-risk <2.5.
- **`preferred_department`** → department filter + "Avg SGPA by Department" + forecast breakdown.
- **`gender`** (`M`/`F`/anything else = Other) → overview donut + Gender filter.
- **`study_hours_weekly`** → shown per-day (÷7) in the table; backs the Min Study Hrs filter.
- **`attendance_rate`** (percent) → Min Attendance filter + prescription recommendations.
- **`past_semester_sgpa_1/2` + `current_sgpa` + `next_semester_sgpa`** → the forecast trend line.

## Practical rules
- Encoding UTF-8, comma-separated, one header row, one student per line.
- `gender` values: use `M`, `F` (anything else is grouped as *Other*).
- SGPA columns on a **0–4** scale; `attendance_rate` as a **percent** (0–100).
- Keep `student_id` unique (it's the primary key; duplicates collapse).
- Max upload size 10 MB (raise `CHUNK_SIZE`/limits in `admin_router.py` for larger).

## Verdict on the current master dataset
`backend/master_dataset.csv` — **48/48 columns match, 10,000 rows, valid ranges.**
It is the canonical example; new datasets should mirror its header exactly.
