"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, User, Layers, FileSpreadsheet } from "lucide-react";
import { StudentPicker } from "./student-picker";
import { BatchView } from "./batch-view";
import {
    predictSingle,
    type CsvModule,
    type StudentBrief,
    type BatchResponseByModule,
} from "@/lib/api/csv-mode";

/**
 * CSV-mode panel shared by every prediction module.
 *
 * Single tab: pick a student from the uploaded dataset → the module's model runs
 * on that row and the result is pushed up via `onSingleResult`, so the page's
 * existing rich dashboard renders exactly as it does for a manually typed input.
 *
 * Batch tab: runs the model across the whole cohort and shows aggregates.
 */
export function CsvModePanel<M extends CsvModule>({
    module,
    label,
    onSingleResult,
    onSingleClear,
}: {
    module: M;
    label: string;
    onSingleResult: (prediction: unknown, inputs?: Record<string, unknown>) => void;
    onSingleClear: () => void;
}) {
    const [tab, setTab] = useState<"single" | "batch">("single");
    const [student, setStudent] = useState<StudentBrief | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch single prediction whenever a student is selected.
    useEffect(() => {
        if (tab !== "single") return;
        if (!student) {
            onSingleClear();
            return;
        }
        let active = true;
        setLoading(true);
        setError(null);
        predictSingle(module, student.student_id)
            .then((res) => {
                if (active) onSingleResult(res.prediction, res.inputs);
            })
            .catch((e) => {
                if (active) {
                    setError(e instanceof Error ? e.message : "Prediction failed");
                    onSingleClear();
                }
            })
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [student, tab, module]);

    // Leaving single (to batch) clears the live single result.
    const switchTab = (next: "single" | "batch") => {
        setTab(next);
        if (next === "batch") onSingleClear();
    };

    return (
        <section className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-[var(--app-text)]">{label} — CSV Mode</span>
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-emerald-300">
                        From uploaded dataset
                    </span>
                </div>
                <div className="inline-flex overflow-hidden rounded-lg border border-[var(--app-border)]/30">
                    <button
                        onClick={() => switchTab("single")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                            tab === "single" ? "bg-cyan-400 text-[#101416]" : "bg-[var(--app-card)] text-slate-300 hover:text-[var(--app-text)]"
                        }`}
                    >
                        <User className="h-3.5 w-3.5" /> Single student
                    </button>
                    <button
                        onClick={() => switchTab("batch")}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                            tab === "batch" ? "bg-cyan-400 text-[#101416]" : "bg-[var(--app-card)] text-slate-300 hover:text-[var(--app-text)]"
                        }`}
                    >
                        <Layers className="h-3.5 w-3.5" /> Whole batch
                    </button>
                </div>
            </div>

            {tab === "single" ? (
                <div className="space-y-3">
                    <StudentPicker selected={student} onSelect={setStudent} />
                    {loading && (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                            Running {label} model on {student?.name}…
                        </div>
                    )}
                    {error && (
                        <div className="flex items-center gap-2 text-xs text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                            {error}
                        </div>
                    )}
                    {!student && !loading && (
                        <p className="text-xs text-slate-400">
                            Pick a student from the uploaded dataset — the analysis below populates from their record.
                        </p>
                    )}
                </div>
            ) : (
                <BatchView module={module} />
            )}
        </section>
    );
}
