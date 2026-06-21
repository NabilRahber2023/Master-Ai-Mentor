"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
    predictBatch,
    type CsvModule,
    type Bucket,
    type GradeBatchResponse,
    type CareerBatchResponse,
    type SubjectBatchResponse,
    type GrowthBatchResponse,
} from "@/lib/api/csv-mode";

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div className="rounded-xl border border-[#3b494c]/20 bg-[#1c2022]/60 p-4">
            <div className="text-[10px] uppercase tracking-widest text-slate-400">{label}</div>
            <div className={`mt-1 text-2xl font-bold ${accent ?? "text-white"}`}>{value}</div>
        </div>
    );
}

function DistBars({ title, buckets }: { title: string; buckets: Bucket[] }) {
    const max = Math.max(...buckets.map((b) => b.count), 1);
    return (
        <div className="rounded-xl border border-[#3b494c]/20 bg-[#1c2022]/40 p-5">
            <h3 className="mb-4 text-xs uppercase tracking-widest text-white">{title}</h3>
            <div className="space-y-2.5">
                {buckets.map((b) => (
                    <div key={b.label} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-[11px] text-slate-300" title={b.label}>
                            {b.label}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#101416]">
                            <div
                                className="h-full rounded-full bg-cyan-400"
                                style={{ width: `${(b.count / max) * 100}%` }}
                            />
                        </div>
                        <span className="w-12 shrink-0 text-right font-mono text-[11px] text-cyan-300">
                            {b.count.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
    return (
        <div className="overflow-hidden rounded-xl border border-[#3b494c]/20">
            <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-[#1c2022] text-slate-400">
                        <tr>
                            {headers.map((h) => (
                                <th key={h} className="px-4 py-2.5 font-medium uppercase tracking-wider text-[10px]">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#3b494c]/10">
                        {rows.map((r, i) => (
                            <tr key={i} className="bg-[#181c1e]/40 hover:bg-cyan-500/5">
                                {r.map((c, j) => (
                                    <td key={j} className="px-4 py-2 text-slate-200">
                                        {c}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function BatchView({ module }: { module: CsvModule }) {
    const [data, setData] = useState<unknown>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);
        predictBatch(module, 200)
            .then((d) => active && setData(d))
            .catch((e) => active && setError(e instanceof Error ? e.message : "Batch prediction failed"))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [module]);

    if (loading) {
        return (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#3b494c]/20 bg-[#181c1e]/40 p-12 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                Running the model across the whole cohort…
            </div>
        );
    }
    if (error) {
        return (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 p-12 text-red-400">
                <AlertTriangle className="h-5 w-5" />
                {error}
            </div>
        );
    }

    if (module === "grade") {
        const d = data as GradeBatchResponse;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <Kpi label="Students" value={d.total.toLocaleString()} />
                    <Kpi label="Avg Predicted SGPA" value={d.avg_predicted.toFixed(2)} accent="text-cyan-300" />
                    <Kpi label="On Track" value={d.on_track.toLocaleString()} accent="text-emerald-400" />
                    <Kpi label="At Risk" value={d.at_risk.toLocaleString()} accent="text-red-400" />
                    <Kpi label="Pass Rate" value={`${d.pass_rate}%`} />
                </div>
                <DistBars title="Predicted SGPA distribution" buckets={d.distribution} />
                <Table
                    headers={["Student", "ID", "Dept", "Prev SGPA", "Predicted", "Risk"]}
                    rows={d.students.map((s) => [
                        s.name, s.student_id, s.department ?? "—", s.previous_sgpa.toFixed(2),
                        s.predicted_sgpa.toFixed(2), s.risk_level,
                    ])}
                />
            </div>
        );
    }
    if (module === "career") {
        const d = data as CareerBatchResponse;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <Kpi label="Students" value={d.total.toLocaleString()} />
                    <Kpi label="Avg Confidence" value={`${d.avg_confidence}%`} accent="text-cyan-300" />
                    <Kpi label="Distinct Careers" value={String(d.career_distribution.length)} />
                </div>
                <DistBars title="Predicted career distribution" buckets={d.career_distribution} />
                <Table
                    headers={["Student", "ID", "Dept", "Predicted Career", "Confidence"]}
                    rows={d.students.map((s) => [
                        s.name, s.student_id, s.department ?? "—", s.predicted_career, `${s.confidence}%`,
                    ])}
                />
            </div>
        );
    }
    if (module === "subject") {
        const d = data as SubjectBatchResponse;
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <Kpi label="Students" value={d.total.toLocaleString()} />
                    <Kpi label="Avg Confidence" value={`${d.avg_confidence}%`} accent="text-cyan-300" />
                    <Kpi label="Match Current Dept" value={`${d.match_rate}%`} />
                    <Kpi label="Distinct Recs" value={String(d.recommendation_distribution.length)} />
                </div>
                <DistBars title="Recommended department distribution" buckets={d.recommendation_distribution} />
                <Table
                    headers={["Student", "ID", "Current Dept", "Recommended", "Confidence"]}
                    rows={d.students.map((s) => [
                        s.name, s.student_id, s.current_department ?? "—", s.recommended_department, `${s.confidence}%`,
                    ])}
                />
            </div>
        );
    }
    // growth
    const d = data as GrowthBatchResponse;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <Kpi label="Students" value={d.total.toLocaleString()} />
                <Kpi label="Stars (High/High)" value={d.stars.toLocaleString()} accent="text-cyan-300" />
                <Kpi label="Risks (Low/Low)" value={d.risks.toLocaleString()} accent="text-red-400" />
            </div>
            <DistBars
                title="9-Box grid distribution"
                buckets={d.grid.map((g) => ({ label: g.label, count: g.count }))}
            />
            <Table
                headers={["Student", "ID", "Dept", "Perf", "Potential", "9-Box Position"]}
                rows={d.students.map((s) => [
                    s.name, s.student_id, s.department ?? "—", s.performance_level, s.potential_level, s.label,
                ])}
            />
        </div>
    );
}
