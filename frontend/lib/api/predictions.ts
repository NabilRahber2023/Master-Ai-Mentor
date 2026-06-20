/**
 * Typed request/response models + call functions for the ML prediction endpoints.
 * Mirrors the backend Pydantic schemas under backend/app/modules.
 */
import { apiPost } from "./client";

/* ──────────────────────────── Shared enums ──────────────────────────── */
export const GENDERS = ["Male", "Female"] as const;
export const YES_NO = ["Yes", "No"] as const;
export const EDUCATION_LEVELS = [
    "Primary",
    "Secondary",
    "HigherSec",
    "Graduate",
    "Postgraduate",
    "None",
] as const;
export const DEPARTMENTS = [
    "CSE",
    "Arts",
    "Law",
    "Business",
    "Pharmacy",
    "Engineering",
    "English",
    "Journalism",
] as const;
export const SKILL_LEVELS = ["Low", "Medium", "High"] as const;

/* ─────────────────────────── Grade (SGPA) ──────────────────────────── */
export interface SGPAPredictionInput {
    SSC_GPA: number;
    HSC_GPA: number;
    Previous_SGPA: number;
    Study_Hours_Per_Day: number;
    Attendance_Rate: number;
    Family_Income_BDT: number;
    Part_Time_Hours: number;
    Father_Education: (typeof EDUCATION_LEVELS)[number];
    Mother_Education: (typeof EDUCATION_LEVELS)[number];
    Parental_Support: (typeof YES_NO)[number];
    Active_Participation: (typeof YES_NO)[number];
    Gender: (typeof GENDERS)[number];
    Department: (typeof DEPARTMENTS)[number];
}

export interface ContributingFactor {
    feature: string;
    value: number | string;
    impact_score: number;
}

export interface SGPAPredictionResponse {
    predicted_sgpa: number;
    risk_level: string;
    contributing_factors: ContributingFactor[];
}

export function predictSGPA(input: SGPAPredictionInput) {
    return apiPost<SGPAPredictionResponse>("/api/v1/prediction/sgpa/", input);
}

/* ────────────────────────── Subject choice ─────────────────────────── */
export const STUDY_STYLES = ["Practical-heavy", "Mixed", "Theory-heavy"] as const;
export const LOCATIONS = ["Dhaka", "Outside Dhaka", "International"] as const;
export const CAREER_GOALS = [
    "Developer",
    "Manager",
    "Designer",
    "Researcher",
    "Entrepreneur",
] as const;

export interface SubjectPredictionInput {
    gender: (typeof GENDERS)[number];
    age: number;
    hsc_gpa: number;
    study_style: (typeof STUDY_STYLES)[number];
    math_skill_level: (typeof SKILL_LEVELS)[number];
    programming_interest: (typeof SKILL_LEVELS)[number];
    tech_interest_score: number;
    budget_per_semester: number;
    business_interest: (typeof SKILL_LEVELS)[number];
    creative_interest: (typeof SKILL_LEVELS)[number];
    location: (typeof LOCATIONS)[number];
    career_goal: (typeof CAREER_GOALS)[number];
}

export interface AlternativeOption {
    department: string;
    probability: number;
}

export interface SubjectPredictionResponse {
    recommended_department: string;
    confidence_score: number;
    alternative_options: AlternativeOption[];
    contributing_factors: ContributingFactor[];
}

export function predictSubject(input: SubjectPredictionInput) {
    return apiPost<SubjectPredictionResponse>(
        "/api/v1/prediction/subject/subject_choice",
        input,
    );
}

/* ───────────────────────────── Career ──────────────────────────────── */
export const PERSONALITY_TYPES = [
    "ISTJ", "ISFJ", "INFJ", "INTJ", "ISTP", "ISFP", "INFP", "INTP",
    "ESTP", "ESFP", "ENFP", "ENTP", "ESTJ", "ESFJ", "ENFJ", "ENTJ",
] as const;
export const WORK_ENVIRONMENTS = ["Remote", "Hybrid", "Office"] as const;
export const SOCIOECONOMIC_SCORES = ["Low", "Mid", "High"] as const;

export interface CareerPredictionRequest {
    Department: string;
    Personality_Type: (typeof PERSONALITY_TYPES)[number];
    Preferred_Work_Environment: (typeof WORK_ENVIRONMENTS)[number];
    Interest_Area: string;
    Socioeconomic_Score: (typeof SOCIOECONOMIC_SCORES)[number];
    CGPA: number;
    Programming_Skill: number;
    Math_Skill: number;
    Communication_Skill: number;
    Creativity_Score: number;
    Problem_Solving: number;
    Leadership_Score: number;
    Research_Interest: number;
    Public_Speaking: number;
    Internship_Experience_Months: number;
    Projects_Completed: number;
    Extracurriculars: number;
}

export interface CareerPath {
    career: string;
    probability: number;
}

export interface CareerPredictionResponse {
    predicted_career: string;
    confidence_score: number;
    alternative_paths: CareerPath[];
    contributing_factors: ContributingFactor[];
}

export function predictCareer(input: CareerPredictionRequest) {
    return apiPost<CareerPredictionResponse>(
        "/api/v1/prediction/career/career",
        input,
    );
}

/* ─────────────────────────── 9-Box / Growth ────────────────────────── */
export interface NineBoxPredictionRequest {
    CGPA: number;
    Attendance_Rate: number;
    Assignment_Completion_Rate: number;
    Project_Quality_Score: number;
    Communication_Skill: number;
    Teamwork_Score: number;
    Problem_Solving_Score: number;
    Leadership_Score: number;
    Time_Management: number;
    Initiative_Taking: number;
    Stress_Handling: number;
    Internship_Experience_Months: number;
    Extracurricular_Activities: number;
    Learning_Agility: number;
    Adaptability: number;
    Career_Motivation: number;
}

export interface NineBoxPredictionResponse {
    performance_level_score: number;
    potential_level_score: number;
    confidence_score: number;
    nine_box_position_label: string;
    position_in_grid: string;
    descriptive_recommendation: string;
}

export function predictNineBox(input: NineBoxPredictionRequest) {
    return apiPost<NineBoxPredictionResponse>("/api/v1/prediction/9box/", input);
}
