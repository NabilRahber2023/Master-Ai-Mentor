"use client";

import { useState } from "react";
import { Briefcase } from "lucide-react";
import {
    predictCareer,
    type CareerPredictionRequest,
    type CareerPredictionResponse,
    PERSONALITY_TYPES,
    WORK_ENVIRONMENTS,
    SOCIOECONOMIC_SCORES,
} from "@/lib/api/predictions";
import { ApiError } from "@/lib/api/client";
import {
    NumberField,
    SelectField,
    FieldShell,
    SubmitButton,
    ErrorBanner,
    ResultCard,
    ProbabilityBar,
} from "./form-primitives";

const DEFAULTS: CareerPredictionRequest = {
    Department: "CSE",
    Personality_Type: "INTJ",
    Preferred_Work_Environment: "Hybrid",
    Interest_Area: "Software Engineering",
    Socioeconomic_Score: "Mid",
    CGPA: 3.5,
    Programming_Skill: 8,
    Math_Skill: 7,
    Communication_Skill: 6,
    Creativity_Score: 6,
    Problem_Solving: 8,
    Leadership_Score: 5,
    Research_Interest: 6,
    Public_Speaking: 5,
    Internship_Experience_Months: 3,
    Projects_Completed: 5,
    Extracurriculars: 2,
};

const inputClass =
    "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--app-text)] outline-none transition-colors focus:border-cyan-400/60 focus:bg-white/10";

interface CareerPredictionPanelProps {
    onResult?: (result: CareerPredictionResponse, inputs: CareerPredictionRequest) => void;
    onReset?: () => void;
}

export function CareerPredictionPanel({ onResult, onReset }: CareerPredictionPanelProps = {}) {
    const [form, setForm] = useState<CareerPredictionRequest>(DEFAULTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<CareerPredictionResponse | null>(null);

    const set = <K extends keyof CareerPredictionRequest>(key: K, value: CareerPredictionRequest[K]) => {
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
            const res = await predictCareer(form);
            setResult(res);
            onResult?.(res, form);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Prediction failed");
            setResult(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-[var(--app-bg2)] p-6">
            <div className="mb-5 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-[var(--app-text)]">Live Career Prediction</h3>
                <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-300">
                    Connected · /prediction/career
                </span>
            </div>

            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FieldShell label="Department" htmlFor="c-dep">
                    <input id="c-dep" value={form.Department} onChange={(e) => set("Department", e.target.value)} className={inputClass} />
                </FieldShell>
                <SelectField label="Personality Type" id="c-pers" value={form.Personality_Type} options={PERSONALITY_TYPES} onChange={(v) => set("Personality_Type", v)} />
                <SelectField label="Work Environment" id="c-env" value={form.Preferred_Work_Environment} options={WORK_ENVIRONMENTS} onChange={(v) => set("Preferred_Work_Environment", v)} />
                <FieldShell label="Interest Area" htmlFor="c-int">
                    <input id="c-int" value={form.Interest_Area} onChange={(e) => set("Interest_Area", e.target.value)} className={inputClass} />
                </FieldShell>
                <SelectField label="Socioeconomic Score" id="c-soc" value={form.Socioeconomic_Score} options={SOCIOECONOMIC_SCORES} onChange={(v) => set("Socioeconomic_Score", v)} />
                <NumberField label="CGPA (0-4)" id="c-cgpa" value={form.CGPA} min={0} max={4} onChange={(v) => set("CGPA", v)} />
                <NumberField label="Programming Skill (0-10)" id="c-prog" value={form.Programming_Skill} min={0} max={10} onChange={(v) => set("Programming_Skill", v)} />
                <NumberField label="Math Skill (0-10)" id="c-math" value={form.Math_Skill} min={0} max={10} onChange={(v) => set("Math_Skill", v)} />
                <NumberField label="Communication (0-10)" id="c-comm" value={form.Communication_Skill} min={0} max={10} onChange={(v) => set("Communication_Skill", v)} />
                <NumberField label="Creativity (0-10)" id="c-crea" value={form.Creativity_Score} min={0} max={10} onChange={(v) => set("Creativity_Score", v)} />
                <NumberField label="Problem Solving (0-10)" id="c-prob" value={form.Problem_Solving} min={0} max={10} onChange={(v) => set("Problem_Solving", v)} />
                <NumberField label="Leadership (0-10)" id="c-lead" value={form.Leadership_Score} min={0} max={10} onChange={(v) => set("Leadership_Score", v)} />
                <NumberField label="Research Interest (0-10)" id="c-res" value={form.Research_Interest} min={0} max={10} onChange={(v) => set("Research_Interest", v)} />
                <NumberField label="Public Speaking (0-10)" id="c-pub" value={form.Public_Speaking} min={0} max={10} onChange={(v) => set("Public_Speaking", v)} />
                <NumberField label="Internship (months)" id="c-intern" value={form.Internship_Experience_Months} min={0} onChange={(v) => set("Internship_Experience_Months", v)} />
                <NumberField label="Projects Completed" id="c-proj" value={form.Projects_Completed} min={0} onChange={(v) => set("Projects_Completed", v)} />
                <NumberField label="Extracurriculars" id="c-extra" value={form.Extracurriculars} min={0} onChange={(v) => set("Extracurriculars", v)} />

                <div className="md:col-span-3">
                    <SubmitButton loading={loading}>Predict Career</SubmitButton>
                </div>
            </form>

            {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

            {result && (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ResultCard title="Predicted Career">
                        <span className="text-3xl font-bold text-[var(--app-text)]">{result.predicted_career}</span>
                        <p className="mt-2 text-sm text-cyan-300">
                            {Math.round(result.confidence_score * 100)}% confidence
                        </p>
                    </ResultCard>
                    <ResultCard title="Alternative Paths">
                        <div className="space-y-3">
                            {result.alternative_paths.map((p) => (
                                <ProbabilityBar key={p.career} label={p.career} value={p.probability} />
                            ))}
                        </div>
                    </ResultCard>
                </div>
            )}
        </div>
    );
}
