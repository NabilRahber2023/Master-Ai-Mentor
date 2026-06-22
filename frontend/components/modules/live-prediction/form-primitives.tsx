"use client";

/**
 * Small shared building blocks for the live ML prediction forms.
 * Dark-theme styled to match the existing module dashboards.
 */
import { Loader2 } from "lucide-react";

export function FieldShell({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label
                htmlFor={htmlFor}
                className="text-[11px] font-medium uppercase tracking-wider text-slate-400"
            >
                {label}
            </label>
            {children}
        </div>
    );
}

const inputClass =
    "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--app-text)] outline-none transition-colors focus:border-cyan-400/60 focus:bg-white/10";

export function NumberField({
    label,
    id,
    value,
    onChange,
    min,
    max,
    step = "any",
}: {
    label: string;
    id: string;
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: string | number;
}) {
    return (
        <FieldShell label={label} htmlFor={id}>
            <input
                id={id}
                type="number"
                value={Number.isNaN(value) ? "" : value}
                min={min}
                max={max}
                step={step}
                onChange={(e) => onChange(e.target.value === "" ? NaN : Number(e.target.value))}
                className={inputClass}
            />
        </FieldShell>
    );
}

export function SelectField<T extends string>({
    label,
    id,
    value,
    onChange,
    options,
}: {
    label: string;
    id: string;
    value: T;
    onChange: (v: T) => void;
    options: readonly T[];
}) {
    return (
        <FieldShell label={label} htmlFor={id}>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value as T)}
                className={inputClass}
            >
                {options.map((opt) => (
                    <option key={opt} value={opt} className="bg-slate-900">
                        {opt}
                    </option>
                ))}
            </select>
        </FieldShell>
    );
}

export function SubmitButton({
    loading,
    children,
}: {
    loading: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-[var(--app-text)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    );
}

export function ErrorBanner({ message }: { message: string }) {
    return (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {message}
        </div>
    );
}

export function ProbabilityBar({ label, value }: { label: string; value: number }) {
    const pct = Math.round(value * 100);
    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-300">
                <span>{label}</span>
                <span className="font-mono text-cyan-300">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

export function ResultCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-5">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-cyan-300">
                {title}
            </h4>
            {children}
        </div>
    );
}
