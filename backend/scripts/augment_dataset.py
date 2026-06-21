"""
Augment master_dataset.csv with the extra columns the single-student ML models
need (Grade / Career / Growth-9box) so every module can run in CSV mode.

The source dataset only carries the chatbot/batch columns; the trained models
expect a handful of features that aren't present. Real values don't exist for a
fixed historical set, so we synthesise them **deterministically** (seeded per
student_id) and **correlated** with the row's existing signals, so model output
stays sensible and reproducible across re-runs.

Adds 15 columns:
  ssc_gpa, father_education, mother_education, part_time_hours,
  parental_support, active_participation, public_speaking,
  internship_experience_months, projects_completed,
  preferred_work_environment, interest_area, teamwork_score,
  learning_agility, adaptability, career_motivation

Usage:
  python scripts/augment_dataset.py [input.csv] [output.csv]
Defaults to augmenting master_dataset.csv in place (after a one-time backup to
master_dataset.original.csv).
"""
import csv
import hashlib
import os
import random
import shutil
import sys

EDU_LEVELS = ["None", "Primary", "Secondary", "HigherSec", "Graduate", "Postgraduate"]

# Columns appended, in order.
NEW_COLUMNS = [
    "ssc_gpa",
    "father_education",
    "mother_education",
    "part_time_hours",
    "parental_support",
    "active_participation",
    "public_speaking",
    "internship_experience_months",
    "projects_completed",
    "preferred_work_environment",
    "interest_area",
    "teamwork_score",
    "learning_agility",
    "adaptability",
    "career_motivation",
]


def _f(row, key, default=0.0):
    try:
        v = row.get(key, "")
        if v is None or v == "":
            return default
        return float(v)
    except (TypeError, ValueError):
        return default


def _i(row, key, default=0):
    return int(round(_f(row, key, default)))


def _clampi(v, lo, hi):
    return max(lo, min(hi, int(round(v))))


def _clampf(v, lo, hi, nd=2):
    return round(max(lo, min(hi, v)), nd)


def _rng(student_id):
    seed = int(hashlib.md5(str(student_id).encode("utf-8")).hexdigest(), 16) % (2**32)
    return random.Random(seed)


def augment_row(row):
    rng = _rng(row.get("student_id", row.get("name", "x")))

    income = _f(row, "family_income", 40000)
    hsc = _f(row, "hsc_gpa", 4.0)
    sgpa = _f(row, "current_sgpa", 2.8)
    age = _i(row, "age", 21)
    comm = _i(row, "communication_skill", 5)
    analytical = _i(row, "analytical_skill", 5)
    stress = _i(row, "stress_management", 5)
    initiative = _i(row, "initiative_score", 5)
    soft = _f(row, "soft_skill_score", 5)
    project = _i(row, "project_skill_score", 5)
    participation = _i(row, "class_participation", 5)
    work_style = (row.get("work_style") or "").strip()
    orientation = (row.get("career_orientation") or "").strip()

    # Income tier drives socio-economic flavoured fields.
    if income >= 70000:
        tier = 2
    elif income >= 35000:
        tier = 1
    else:
        tier = 0

    # SSC GPA: tracks HSC with mild noise, on the 0-5 board scale.
    ssc = _clampf(hsc + rng.uniform(-0.4, 0.3), 2.0, 5.0)

    # Parental education: higher income -> higher attainment, weighted choice.
    def edu_for_tier(t):
        weights = {
            0: [3, 5, 6, 4, 2, 1],
            1: [1, 3, 5, 6, 4, 2],
            2: [1, 1, 3, 5, 6, 4],
        }[t]
        return rng.choices(EDU_LEVELS, weights=weights, k=1)[0]

    father_edu = edu_for_tier(tier)
    mother_edu = edu_for_tier(max(0, tier - (1 if rng.random() < 0.3 else 0)))

    # Part-time hours: lower income -> works more.
    base_pt = {0: 14, 1: 7, 2: 3}[tier]
    part_time = _clampf(max(0, base_pt + rng.uniform(-4, 6)), 0, 30, 1)

    # Parental support: more likely with income + decent results.
    support_p = 0.35 + 0.18 * tier + (0.15 if sgpa >= 3.0 else 0)
    parental_support = "Yes" if rng.random() < support_p else "No"

    # Active participation: anchored on class participation signal.
    active = "Yes" if (participation >= 5 and rng.random() < 0.8) or rng.random() < 0.25 else "No"

    # Public speaking: near communication skill.
    public_speaking = _clampi(comm + rng.randint(-2, 2), 0, 10)

    # Internship months: older students accrue more; capped.
    intern_base = max(0, (age - 19)) * 2
    internship = _clampi(intern_base + rng.randint(-2, 6), 0, 24)

    # Projects completed: tracks project skill.
    projects = _clampi(project * 1.2 + rng.randint(-2, 4), 0, 18)

    # Work environment: from collaboration style.
    work_env = {
        "Solo": "Remote",
        "Team": "Office",
        "Hybrid": "Hybrid",
    }.get(work_style)
    if work_env is None or rng.random() < 0.15:
        work_env = rng.choice(["Remote", "Hybrid", "Office"])

    # Interest area: from career orientation.
    interest_area = {
        "Tech": "Technology",
        "Business": "Business",
        "Research": "Research",
        "Creative": "Arts",
        "Public Sector": "Public Service",
    }.get(orientation, "General")

    teamwork = _clampi(round(soft) + rng.randint(-2, 3), 0, 10)
    learning_agility = _clampi(analytical + rng.randint(-2, 2), 0, 10)
    adaptability = _clampi(stress + rng.randint(-2, 2), 0, 10)
    career_motivation = _clampi(initiative + rng.randint(-1, 3), 0, 10)

    row["ssc_gpa"] = ssc
    row["father_education"] = father_edu
    row["mother_education"] = mother_edu
    row["part_time_hours"] = part_time
    row["parental_support"] = parental_support
    row["active_participation"] = active
    row["public_speaking"] = public_speaking
    row["internship_experience_months"] = internship
    row["projects_completed"] = projects
    row["preferred_work_environment"] = work_env
    row["interest_area"] = interest_area
    row["teamwork_score"] = teamwork
    row["learning_agility"] = learning_agility
    row["adaptability"] = adaptability
    row["career_motivation"] = career_motivation
    return row


def main():
    default_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "master_dataset.csv")
    in_path = sys.argv[1] if len(sys.argv) > 1 else default_path
    out_path = sys.argv[2] if len(sys.argv) > 2 else in_path

    with open(in_path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        fieldnames = list(reader.fieldnames)
        rows = list(reader)

    already = [c for c in NEW_COLUMNS if c in fieldnames]
    if already:
        print(f"Columns already present, will overwrite values: {already}")
    else:
        fieldnames = fieldnames + NEW_COLUMNS

    augmented = [augment_row(r) for r in rows]

    # One-time backup when writing in place.
    if out_path == in_path:
        backup = in_path.replace(".csv", ".original.csv")
        if not os.path.exists(backup):
            shutil.copy2(in_path, backup)
            print(f"Backed up original to {backup}")

    with open(out_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(augmented)

    print(f"Wrote {len(augmented)} rows with {len(NEW_COLUMNS)} added columns -> {out_path}")
    # Quick sanity summary.
    sample = augmented[0]
    print("Sample new values:", {c: sample[c] for c in NEW_COLUMNS})


if __name__ == "__main__":
    main()
