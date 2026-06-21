/**
 * Typed client for CSV-mode prediction endpoints (/api/v1/prediction/csv).
 * Mirrors backend/app/modules/csv_mode/schemas.py.
 *
 * CSV mode runs each module's trained model directly off the uploaded `students`
 * table — either for one picked student (single) or the whole cohort (batch).
 */
import type {
    SGPAPredictionResponse,
    CareerPredictionResponse,
    SubjectPredictionResponse,
    NineBoxPredictionResponse,
} from "./predictions";

export type CsvModule = "grade" | "career" | "subject" | "growth";

async function apiGet<T>(path: string): Promise<T> {
    const res = await fetch(path);
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
        const detail =
            data && typeof data === "object" && "detail" in data ? data.detail : data;
        throw new Error(typeof detail === "string" ? detail : `Request failed (${res.status})`);
    }
    return data as T;
}

/* ──────────────── Student picker ──────────────── */
export interface StudentBrief {
    student_id: string;
    name: string;
    department: string | null;
    gender: string | null;
    current_sgpa: number | null;
}
export interface StudentListResponse {
    students: StudentBrief[];
    total: number;
    showing: number;
}

export function listStudents(search = "", limit = 50): Promise<StudentListResponse> {
    const q = new URLSearchParams({ search, limit: String(limit) });
    return apiGet<StudentListResponse>(`/api/v1/prediction/csv/students?${q}`);
}

/* ──────────────── Single prediction ──────────────── */
type PredictionByModule = {
    grade: SGPAPredictionResponse;
    career: CareerPredictionResponse;
    subject: SubjectPredictionResponse;
    growth: NineBoxPredictionResponse;
};

export interface CsvSingleResult<M extends CsvModule = CsvModule> {
    student: StudentBrief;
    inputs: Record<string, unknown>;
    prediction: PredictionByModule[M];
}

export function predictSingle<M extends CsvModule>(
    module: M,
    studentId: string,
): Promise<CsvSingleResult<M>> {
    return apiGet<CsvSingleResult<M>>(
        `/api/v1/prediction/csv/${module}/predict/${encodeURIComponent(studentId)}`,
    );
}

/* ──────────────── Batch (whole cohort) ──────────────── */
export interface Bucket {
    label: string;
    count: number;
}

export interface GradeBatchResponse {
    total: number;
    avg_predicted: number;
    on_track: number;
    at_risk: number;
    pass_rate: number;
    distribution: Bucket[];
    students: {
        student_id: string;
        name: string;
        department: string | null;
        previous_sgpa: number;
        predicted_sgpa: number;
        risk_level: string;
    }[];
    showing: number;
}

export interface CareerBatchResponse {
    total: number;
    avg_confidence: number;
    career_distribution: Bucket[];
    students: {
        student_id: string;
        name: string;
        department: string | null;
        predicted_career: string;
        confidence: number;
    }[];
    showing: number;
}

export interface SubjectBatchResponse {
    total: number;
    avg_confidence: number;
    recommendation_distribution: Bucket[];
    match_rate: number;
    students: {
        student_id: string;
        name: string;
        current_department: string | null;
        recommended_department: string;
        confidence: number;
    }[];
    showing: number;
}

export interface GrowthBatchResponse {
    total: number;
    stars: number;
    risks: number;
    grid: { position: string; label: string; count: number }[];
    students: {
        student_id: string;
        name: string;
        department: string | null;
        performance_level: number;
        potential_level: number;
        position: string;
        label: string;
    }[];
    showing: number;
}

export type BatchResponseByModule = {
    grade: GradeBatchResponse;
    career: CareerBatchResponse;
    subject: SubjectBatchResponse;
    growth: GrowthBatchResponse;
};

export function predictBatch<M extends CsvModule>(
    module: M,
    limit = 100,
): Promise<BatchResponseByModule[M]> {
    return apiGet<BatchResponseByModule[M]>(
        `/api/v1/prediction/csv/${module}/batch?limit=${limit}`,
    );
}
