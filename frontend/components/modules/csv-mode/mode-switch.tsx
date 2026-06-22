"use client";

import { PenLine, FileSpreadsheet } from "lucide-react";

/** Manual | CSV mode switch shown at the top of each prediction module. */
export function ModeSwitch({
    mode,
    onChange,
}: {
    mode: "manual" | "csv";
    onChange: (m: "manual" | "csv") => void;
}) {
    return (
        <div className="inline-flex overflow-hidden rounded-lg border border-[var(--app-border)]/30 bg-[var(--app-card)]">
            <button
                onClick={() => onChange("manual")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    mode === "manual" ? "bg-cyan-400 text-[#101416]" : "text-slate-300 hover:text-[var(--app-text)]"
                }`}
            >
                <PenLine className="h-3.5 w-3.5" /> Manual
            </button>
            <button
                onClick={() => onChange("csv")}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                    mode === "csv" ? "bg-emerald-400 text-[#101416]" : "text-slate-300 hover:text-[var(--app-text)]"
                }`}
            >
                <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
            </button>
        </div>
    );
}
