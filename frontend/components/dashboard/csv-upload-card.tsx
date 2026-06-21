"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UploadCloud, CheckCircle2, AlertTriangle, Loader2, Database, FileSpreadsheet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiUploadFile } from "@/lib/api/client";
import { fetchOverview } from "@/lib/api/batch";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
type Phase = "idle" | "uploading" | "ingesting" | "done" | "error";

interface UploadResponse {
    status: string;
    file: string;
    message: string;
}

/**
 * Dashboard CSV upload card.
 *
 * Posts the dataset to POST /api/v1/admin/upload-csv, which re-populates the
 * shared `students` table (with embeddings) in a background task. The chatbot
 * and Batch Prediction read that table live, so the whole platform picks up the
 * new data. We poll the dataset size so the user sees ingestion progress.
 */
export function CsvUploadCard() {
    const [phase, setPhase] = useState<Phase>("idle");
    const [message, setMessage] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [dragging, setDragging] = useState(false);
    const [count, setCount] = useState<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    // Initial dataset size.
    useEffect(() => {
        fetchOverview()
            .then((o) => setCount(o.total_students))
            .catch(() => setCount(null));
        return stopPolling;
    }, []);

    const startIngestPolling = useCallback(() => {
        stopPolling();
        let ticks = 0;
        let stableTicks = 0;
        let last = -1;
        pollRef.current = setInterval(async () => {
            ticks += 1;
            try {
                const o = await fetchOverview();
                setCount(o.total_students);
                // Consider ingestion settled once the count is non-zero and
                // unchanged across two consecutive polls (re-insert finished).
                if (o.total_students > 0 && o.total_students === last) {
                    stableTicks += 1;
                    if (stableTicks >= 2) {
                        setPhase("done");
                        setMessage(`Dataset ready — ${o.total_students.toLocaleString()} students live across all modules.`);
                        stopPolling();
                    }
                } else {
                    stableTicks = 0;
                }
                last = o.total_students;
            } catch {
                /* transient during re-insert; keep polling */
            }
            // Safety stop after ~3 minutes.
            if (ticks > 45) {
                setPhase("done");
                setMessage("Ingestion still running in the background. Data will appear shortly.");
                stopPolling();
            }
        }, 4000);
    }, []);

    const handleFile = useCallback(
        async (file: File) => {
            if (!file.name.toLowerCase().endsWith(".csv")) {
                setPhase("error");
                setMessage("Only .csv files are allowed.");
                return;
            }
            if (file.size > MAX_BYTES) {
                setPhase("error");
                setMessage("File exceeds the 10MB limit.");
                return;
            }
            setFileName(file.name);
            setPhase("uploading");
            setMessage("Uploading dataset…");
            try {
                const res = await apiUploadFile<UploadResponse>("/api/v1/admin/upload-csv", file);
                setPhase("ingesting");
                setMessage(res.message || "Upload accepted — ingesting with embeddings in the background…");
                startIngestPolling();
            } catch (err) {
                setPhase("error");
                setMessage(err instanceof Error ? err.message : "Upload failed.");
            }
        },
        [startIngestPolling],
    );

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    const busy = phase === "uploading" || phase === "ingesting";

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <FileSpreadsheet className="h-4 w-4 text-cyan-500" />
                    Upload Student Dataset (CSV)
                </CardTitle>
                {count !== null && (
                    <span className="flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-600 dark:text-cyan-300">
                        <Database className="h-3 w-3" />
                        {count.toLocaleString()} students
                    </span>
                )}
            </CardHeader>
            <CardContent>
                <div
                    onClick={() => !busy && inputRef.current?.click()}
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!busy) setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={onDrop}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                        dragging
                            ? "border-cyan-400 bg-cyan-500/5"
                            : "border-muted-foreground/25 hover:border-cyan-400/60"
                    } ${busy ? "pointer-events-none opacity-80" : ""}`}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFile(f);
                            e.target.value = "";
                        }}
                    />

                    {phase === "idle" && (
                        <>
                            <UploadCloud className="h-8 w-8 text-cyan-500" />
                            <p className="text-sm font-medium">Drag &amp; drop your dataset CSV, or click to browse</p>
                            <p className="text-xs text-muted-foreground">
                                Feeds the chatbot &amp; Batch Prediction live · .csv · max 10MB
                            </p>
                        </>
                    )}

                    {(phase === "uploading" || phase === "ingesting") && (
                        <>
                            <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
                            <p className="text-sm font-medium">{message}</p>
                            <p className="text-xs text-muted-foreground">{fileName}</p>
                        </>
                    )}

                    {phase === "done" && (
                        <>
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{message}</p>
                            <p className="text-xs text-muted-foreground">Click to upload a different dataset</p>
                        </>
                    )}

                    {phase === "error" && (
                        <>
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">{message}</p>
                            <p className="text-xs text-muted-foreground">Click to try again</p>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
