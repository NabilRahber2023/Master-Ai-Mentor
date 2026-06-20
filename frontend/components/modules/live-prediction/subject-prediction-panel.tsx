"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import {
    predictSubject,
    type SubjectPredictionInput,
    type SubjectPredictionResponse,
    GENDERS,
    SKILL_LEVELS,
    STUDY_STYLES,
    LOCATIONS,
    CAREER_GOALS,
} from "@/lib/api/predictions";
import { ApiError } from "@/lib/api/client";
import {
    NumberField,
    SelectField,
    SubmitButton,
    ErrorBanner,
    ResultCard,
    ProbabilityBar,
} from "./form-primitives";

const DEFAULTS: SubjectPredictionInput = {
    gender: "Male",
    age: 19,
    hsc_gpa: 4.5,
    study_style: "Mixed",
    math_skill_level: "High",
    programming_interest: "High",
    tech_interest_score: 80,
    budget_per_semester: 30000,
    business_interest: "Medium",
    creative_interest: "Low",
    location: "Dhaka",
    career_goal: "Developer",
};

interface SubjectPredictionPanelProps {
    onResult?: (result: SubjectPredictionResponse) => void;
    onReset?: () => void;
}

export function SubjectPredictionPanel({ onResult, onReset }: SubjectPredictionPanelProps = {}) {
    const [form, setForm] = useState<SubjectPredictionInput>(DEFAULTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SubjectPredictionResponse | null>(null);

    const set = <K extends keyof SubjectPredictionInput>(key: K, value: SubjectPredictionInput[K]) => {
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
            const res = await predictSubject(form);
            setResult(res);
            onResult?.(res);
        } catch (err) {
            setError(err instanceof ApiError ? err.message : "Prediction failed");
            setResult(null);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-[#161b1e] p-6">
            <div className="mb-5 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Live Subject Recommendation</h3>
                <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-300">
                    Connected · /prediction/subject
                </span>
            </div>

            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SelectField label="Gender" id="s-gen" value={form.gender} options={GENDERS} onChange={(v) => set("gender", v)} />
                <NumberField label="Age" id="s-age" value={form.age} min={15} max={40} onChange={(v) => set("age", v)} />
                <NumberField label="HSC GPA" id="s-hsc" value={form.hsc_gpa} min={0} max={5} onChange={(v) => set("hsc_gpa", v)} />
                <SelectField label="Study Style" id="s-style" value={form.study_style} options={STUDY_STYLES} onChange={(v) => set("study_style", v)} />
                <SelectField label="Math Skill" id="s-math" value={form.math_skill_level} options={SKILL_LEVELS} onChange={(v) => set("math_skill_level", v)} />
                <SelectField label="Programming Interest" id="s-prog" value={form.programming_interest} options={SKILL_LEVELS} onChange={(v) => set("programming_interest", v)} />
                <NumberField label="Tech Interest (0-100)" id="s-tech" value={form.tech_interest_score} min={0} max={100} onChange={(v) => set("tech_interest_score", v)} />
                <NumberField label="Budget / Semester" id="s-bud" value={form.budget_per_semester} min={0} onChange={(v) => set("budget_per_semester", v)} />
                <SelectField label="Business Interest" id="s-bus" value={form.business_interest} options={SKILL_LEVELS} onChange={(v) => set("business_interest", v)} />
                <SelectField label="Creative Interest" id="s-cre" value={form.creative_interest} options={SKILL_LEVELS} onChange={(v) => set("creative_interest", v)} />
                <SelectField label="Location" id="s-loc" value={form.location} options={LOCATIONS} onChange={(v) => set("location", v)} />
                <SelectField label="Career Goal" id="s-goal" value={form.career_goal} options={CAREER_GOALS} onChange={(v) => set("career_goal", v)} />

                <div className="md:col-span-3">
                    <SubmitButton loading={loading}>Recommend Subject</SubmitButton>
                </div>
            </form>

            {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

            {result && (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ResultCard title="Recommended Department">
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-white">{result.recommended_department}</span>
                        </div>
                        <p className="mt-2 text-sm text-cyan-300">
                            {Math.round(result.confidence_score * 100)}% confidence
                        </p>
                    </ResultCard>
                    <ResultCard title="Alternative Options">
                        <div className="space-y-3">
                            {result.alternative_options.map((o) => (
                                <ProbabilityBar key={o.department} label={o.department} value={o.probability} />
                            ))}
                        </div>
                    </ResultCard>
                </div>
            )}
        </div>
    );
}
