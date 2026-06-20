/**
 * Shared API client for the FastAPI backend.
 *
 * All backend calls go through Next.js's rewrite: `/api/v1/*` -> `${BACKEND_URL}/api/v1/*`
 * (see next.config.ts). Endpoints expect a trailing slash; we always include it to avoid
 * the 308 redirect round-trip.
 */

export class ApiError extends Error {
    status: number;
    detail: unknown;

    constructor(message: string, status: number, detail: unknown) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.detail = detail;
    }
}

/**
 * Turn a FastAPI error body into a readable message.
 * FastAPI validation errors come back as { detail: [{ loc, msg, ... }] }.
 */
function formatErrorDetail(detail: unknown, fallback: string): string {
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
        return detail
            .map((d) => {
                if (d && typeof d === "object" && "msg" in d) {
                    const loc = "loc" in d && Array.isArray((d as { loc: unknown[] }).loc)
                        ? (d as { loc: unknown[] }).loc.slice(1).join(".")
                        : "";
                    const msg = (d as { msg: string }).msg;
                    return loc ? `${loc}: ${msg}` : msg;
                }
                return JSON.stringify(d);
            })
            .join("; ");
    }
    if (detail && typeof detail === "object" && "message" in detail) {
        return String((detail as { message: unknown }).message);
    }
    return fallback;
}

export async function apiPost<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    init?: RequestInit,
): Promise<TResponse> {
    let res: Response;
    try {
        res = await fetch(path, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
            body: JSON.stringify(body),
            ...init,
        });
    } catch (err) {
        throw new ApiError(
            "Unable to reach the server. Is the backend running on port 8001?",
            0,
            err,
        );
    }

    let data: unknown = null;
    const text = await res.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!res.ok) {
        const detail =
            data && typeof data === "object" && "detail" in data
                ? (data as { detail: unknown }).detail
                : data;
        throw new ApiError(
            formatErrorDetail(detail, `Request failed (${res.status})`),
            res.status,
            detail,
        );
    }

    return data as TResponse;
}

/** Upload a single file as multipart/form-data (e.g. the admin CSV ingest endpoint). */
export async function apiUploadFile<TResponse>(
    path: string,
    file: File,
    fieldName = "file",
): Promise<TResponse> {
    const formData = new FormData();
    formData.append(fieldName, file);

    let res: Response;
    try {
        res = await fetch(path, { method: "POST", body: formData });
    } catch (err) {
        throw new ApiError(
            "Unable to reach the server. Is the backend running on port 8001?",
            0,
            err,
        );
    }

    let data: unknown = null;
    const text = await res.text();
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = text;
        }
    }

    if (!res.ok) {
        const detail =
            data && typeof data === "object" && "detail" in data
                ? (data as { detail: unknown }).detail
                : data;
        throw new ApiError(
            formatErrorDetail(detail, `Upload failed (${res.status})`),
            res.status,
            detail,
        );
    }

    return data as TResponse;
}
