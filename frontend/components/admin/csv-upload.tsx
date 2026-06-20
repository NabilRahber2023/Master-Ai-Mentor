"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { apiUploadFile, ApiError } from "@/lib/api/client";

interface UploadAcceptedResponse {
    status: string;
    file: string;
    message: string;
}

export function CsvUpload() {
    const inputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<UploadAcceptedResponse | null>(null);

    async function handleUpload() {
        if (!file) return;
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await apiUploadFile<UploadAcceptedResponse>(
                "/api/v1/admin/upload-csv",
                file,
            );
            setResult(res);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Upload failed");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-xl rounded-2xl border border-white/10 bg-[#161b1e] p-6">
            <div className="mb-1 flex items-center gap-2">
                <Upload className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Student Dataset Upload</h3>
            </div>
            <p className="mb-5 text-sm text-slate-400">
                Upload a CSV of student data. Ingestion (with embeddings) runs in the
                background on the server and powers the chatbot&apos;s student lookup.
            </p>

            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/5 px-4 py-6 text-left transition-colors hover:border-cyan-400/50 hover:bg-white/10"
            >
                <FileText className="h-6 w-6 text-cyan-400" />
                <span className="text-sm text-slate-300">
                    {file ? file.name : "Click to choose a .csv file"}
                </span>
            </button>
            <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                    setFile(e.target.files?.[0] ?? null);
                    setResult(null);
                    setError(null);
                }}
            />

            <button
                type="button"
                disabled={!file || loading}
                onClick={handleUpload}
                className="mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Upload & Ingest
            </button>

            {error && (
                <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}
            {result && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        {result.message} (<span className="font-mono">{result.file}</span>)
                    </span>
                </div>
            )}
        </div>
    );
}
