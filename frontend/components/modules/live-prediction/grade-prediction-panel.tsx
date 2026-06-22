"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import {
    predictSGPA,
    type SGPAPredictionInput,
    type SGPAPredictionResponse,
    GENDERS,
    YES_NO,
    EDUCATION_LEVELS,
    DEPARTMENTS,
} from "@/lib/api/predictions";
import { ApiError } from "@/lib/api/client";
import {
    NumberField,
    SelectField,
    SubmitButton,
    ErrorBanner,
    ResultCard,
} from "./form-primitives";

const DEFAULTS: SGPAPredictionInput = {
    SSC_GPA: 4.5,
    HSC_GPA: 4.2,
    Previous_SGPA: 3.4,
    Study_Hours_Per_Day: 4,
    Attendance_Rate: 88,
    Family_Income_BDT: 40000,
    Part_Time_Hours: 0,
    Father_Education: "Graduate",
    Mother_Education: "Graduate",
    Parental_Support: "Yes",
    Active_Participation: "Yes",
    Gender: "Male",
    Department: "CSE",
};

interface GradePredictionPanelProps {
    onResult?: (result: SGPAPredictionResponse) => void;
    onReset?: () => void;
}

export function GradePredictionPanel({ onResult, onReset }: GradePredictionPanelProps = {}) {
    const [form, setForm] = useState<SGPAPredictionInput>(DEFAULTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SGPAPredictionResponse | null>(null);

    const set = <K extends keyof SGPAPredictionInput>(key: K, value: SGPAPredictionInput[K]) => {
        setForm((f) => ({ ...f, [key]: value }));
        if (result) setResult(null);
        setError(null);
        onReset?.();
    };

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await predictSGPA(form);
            setResult(res);
            onResult?.(res);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Prediction failed");
            setResult(null);
        } finally {
            setLoading(false);
        }
    }

    const riskColor =
        result?.risk_level?.toLowerCase().includes("high")
            ? "text-red-400"
            : result?.risk_level?.toLowerCase().includes("mid")
              ? "text-amber-400"
              : "text-emerald-400";

    return (
        <div className="rounded-2xl border border-white/10 bg-[var(--app-bg2)] p-6">
            <div className="mb-5 flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-[var(--app-text)]">Live SGPA Prediction</h3>
                <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-300">
                    Connected · /prediction/sgpa
                </span>
            </div>

            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <NumberField label="SSC GPA" id="ssc" value={form.SSC_GPA} min={0} max={5} onChange={(v) => set("SSC_GPA", v)} />
                <NumberField label="HSC GPA" id="hsc" value={form.HSC_GPA} min={0} max={5} onChange={(v) => set("HSC_GPA", v)} />
                <NumberField label="Previous SGPA" id="prev" value={form.Previous_SGPA} min={0} max={4} onChange={(v) => set("Previous_SGPA", v)} />
                <NumberField label="Study Hours / Day" id="study" value={form.Study_Hours_Per_Day} min={0} onChange={(v) => set("Study_Hours_Per_Day", v)} />
                <NumberField label="Attendance Rate (%)" id="att" value={form.Attendance_Rate} min={0} max={100} onChange={(v) => set("Attendance_Rate", v)} />
                <NumberField label="Family Income (BDT)" id="inc" value={form.Family_Income_BDT} min={0} onChange={(v) => set("Family_Income_BDT", v)} />
                <NumberField label="Part-Time Hours / Week" id="pt" value={form.Part_Time_Hours} min={0} onChange={(v) => set("Part_Time_Hours", v)} />
                <SelectField label="Father Education" id="fed" value={form.Father_Education} options={EDUCATION_LEVELS} onChange={(v) => set("Father_Education", v)} />
                <SelectField label="Mother Education" id="med" value={form.Mother_Education} options={EDUCATION_LEVELS} onChange={(v) => set("Mother_Education", v)} />
                <SelectField label="Parental Support" id="ps" value={form.Parental_Support} options={YES_NO} onChange={(v) => set("Parental_Support", v)} />
                <SelectField label="Active Participation" id="ap" value={form.Active_Participation} options={YES_NO} onChange={(v) => set("Active_Participation", v)} />
                <SelectField label="Gender" id="gen" value={form.Gender} options={GENDERS} onChange={(v) => set("Gender", v)} />
                <SelectField label="Department" id="dep" value={form.Department} options={DEPARTMENTS} onChange={(v) => set("Department", v)} />

                <div className="md:col-span-3">
                    <SubmitButton loading={loading}>Predict SGPA</SubmitButton>
                </div>
            </form>

            {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

            {result && (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ResultCard title="Prediction">
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-[var(--app-text)]">{result.predicted_sgpa.toFixed(2)}</span>
                            <span className="text-sm text-slate-400">predicted SGPA</span>
                        </div>
                        <p className={`mt-2 text-sm font-semibold ${riskColor}`}>{result.risk_level}</p>
                    </ResultCard>
                    <ResultCard title="Top Contributing Factors">
                        <ul className="space-y-2">
                            {result.contributing_factors.map((f) => (
                                <li key={f.feature} className="flex items-center justify-between text-sm">
                                    <span className="text-slate-300">{f.feature}</span>
                                    <span className="font-mono text-cyan-300">
                                        {typeof f.value === "number" ? f.value : f.value}
                                        <span className="ml-2 text-slate-500">({f.impact_score.toFixed(3)})</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </ResultCard>
                </div>
            )}
        </div>
    );
}
