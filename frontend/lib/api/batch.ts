/**
 * Typed client for the Batch Prediction endpoints (/api/v1/prediction/batch).
 * Mirrors backend/app/modules/batch_predictor/schemas.py.
 *
 * Everything is computed live from the students table, so the cohort dashboard
 * reflects the most recently ingested dataset (CSV upload + chatbot share it).
 */
import { apiPost } from "./client";

export interface BatchFilters {
    department: string;
    category: string;       // All | High | Mid | Low
    gender: string;         // All | Male | Female | Other
    min_study_hours: number;
    min_attendance: number;
}

export const DEFAULT_FILTERS: BatchFilters = {
    department: "All",
    category: "All",
    gender: "All",
    min_study_hours: 0,
    min_attendance: 0,
};

/* ──────────────── Overview ──────────────── */
export interface DepartmentAvg {
    department: string;
    avg_sgpa: number;
    count: number;
}
export interface GenderSplit {
    male: number;
    female: number;
    other: number;
    total: number;
}
export interface OverviewResponse {
    total_students: number;
    high: number;
    mid: number;
    low: number;
    avg_sgpa: number;
    avg_study_hours: number;
    avg_attendance: number;
    high_pct: number;
    mid_pct: number;
    low_pct: number;
    department_avgs: DepartmentAvg[];
    gender: GenderSplit;
}

export function fetchOverview() {
    // GET endpoint — reuse apiPost-style fetch via a tiny GET helper.
    return fetch("/api/v1/prediction/batch/overview").then(async (r) => {
        if (!r.ok) throw new Error(`Overview failed (${r.status})`);
        return (await r.json()) as OverviewResponse;
    });
}

/* ──────────────── Prediction ──────────────── */
export interface StudentRow {
    id: string;
    name: string;
    dept: string;
    category: string;
    prev_sgpa: number;
    study_hrs: number;
    attendance: number;
    predicted: number;
    status: string;
}
export interface ScatterPoint {
    prev_sgpa: number;
    predicted: number;
    status: string;
}
export interface PredictKpis {
    filtered: number;
    on_track: number;
    at_risk: number;
    avg_predicted: number;
    pass_rate: number;
}
export interface PredictResponse {
    kpis: PredictKpis;
    distribution_bins: string[];
    distribution_counts: number[];
    scatter: ScatterPoint[];
    students: StudentRow[];
    showing: number;
    total: number;
}

export function runBatchPrediction(filters: BatchFilters) {
    return apiPost<PredictResponse>("/api/v1/prediction/batch/predict", filters);
}

/* ──────────────── Prescriptions ──────────────── */
export interface PrescriptionCard {
    id: string;
    name: string;
    dept: string;
    predicted: number;
    status: string;
    recommendations: string[];
}
export interface PrescriptionResponse {
    target: string;
    count: number;
    cards: PrescriptionCard[];
}

export function fetchPrescriptions(filters: BatchFilters, target: string, search: string) {
    return apiPost<PrescriptionResponse>("/api/v1/prediction/batch/prescriptions", {
        filters,
        target,
        search,
    });
}

/* ──────────────── Forecast ──────────────── */
export interface TrendPoint {
    term: string;
    value: number;
    type: string;          // historical | forecast
}
export interface DeptForecast {
    department: string;
    current_avg: number;
    predicted_avg: number;
}
export interface ForecastResponse {
    trend: TrendPoint[];
    forecast_t1: number;
    forecast_t2: number;
    forecast_t3: number;
    target: number;
    below_target: boolean;
    department_breakdown: DeptForecast[];
}

export function fetchForecast(filters: BatchFilters) {
    return apiPost<ForecastResponse>("/api/v1/prediction/batch/forecast", filters);
}
