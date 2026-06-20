"use client";

import { useState } from "react";
import { Grid3x3 } from "lucide-react";
import {
    predictNineBox,
    type NineBoxPredictionRequest,
    type NineBoxPredictionResponse,
} from "@/lib/api/predictions";
import { ApiError } from "@/lib/api/client";
import { NumberField, SubmitButton, ErrorBanner, ResultCard } from "./form-primitives";

const DEFAULTS: NineBoxPredictionRequest = {
    CGPA: 3.5,
    Attendance_Rate: 90,
    Assignment_Completion_Rate: 92,
    Project_Quality_Score: 8,
    Communication_Skill: 7,
    Teamwork_Score: 8,
    Problem_Solving_Score: 8,
    Leadership_Score: 6,
    Time_Management: 7,
    Initiative_Taking: 7,
    Stress_Handling: 6,
    Internship_Experience_Months: 3,
    Extracurricular_Activities: 2,
    Learning_Agility: 8,
    Adaptability: 7,
    Career_Motivation: 9,
};

interface NineBoxPredictionPanelProps {
    /** Fired with the prediction so the parent page can react to it. */
    onResult?: (result: NineBoxPredictionResponse) => void;
    /** Fired when the user edits any input — signals the parent to "start fresh". */
    onReset?: () => void;
}

export function NineBoxPredictionPanel({ onResult, onReset }: NineBoxPredictionPanelProps = {}) {
    const [form, setForm] = useState<NineBoxPredictionRequest>(DEFAULTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<NineBoxPredictionResponse | null>(null);

    const set = <K extends keyof NineBoxPredictionRequest>(key: K, value: NineBoxPredictionRequest[K]) => {
        setForm((f) => ({ ...f, [key]: value }));
        // Editing inputs invalidates the previous evaluation — reset downstream UI.
        if (result) setResult(null);
        setError(null);
        onReset?.();
    };

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await predictNineBox(form);
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
                <Grid3x3 className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Live 9-Box Evaluation</h3>
                <span className="ml-2 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-300">
                    Connected · /prediction/9box
                </span>
            </div>

            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <NumberField label="CGPA (0-4)" id="n-cgpa" value={form.CGPA} min={0} max={4} onChange={(v) => set("CGPA", v)} />
                <NumberField label="Attendance (%)" id="n-att" value={form.Attendance_Rate} min={0} max={100} onChange={(v) => set("Attendance_Rate", v)} />
                <NumberField label="Assignment (%)" id="n-asg" value={form.Assignment_Completion_Rate} min={0} max={100} onChange={(v) => set("Assignment_Completion_Rate", v)} />
                <NumberField label="Project Quality (0-10)" id="n-pq" value={form.Project_Quality_Score} min={0} max={10} onChange={(v) => set("Project_Quality_Score", v)} />
                <NumberField label="Communication (0-10)" id="n-comm" value={form.Communication_Skill} min={0} max={10} onChange={(v) => set("Communication_Skill", v)} />
                <NumberField label="Teamwork (0-10)" id="n-team" value={form.Teamwork_Score} min={0} max={10} onChange={(v) => set("Teamwork_Score", v)} />
                <NumberField label="Problem Solving (0-10)" id="n-prob" value={form.Problem_Solving_Score} min={0} max={10} onChange={(v) => set("Problem_Solving_Score", v)} />
                <NumberField label="Leadership (0-10)" id="n-lead" value={form.Leadership_Score} min={0} max={10} onChange={(v) => set("Leadership_Score", v)} />
                <NumberField label="Time Mgmt (0-10)" id="n-time" value={form.Time_Management} min={0} max={10} onChange={(v) => set("Time_Management", v)} />
                <NumberField label="Initiative (0-10)" id="n-init" value={form.Initiative_Taking} min={0} max={10} onChange={(v) => set("Initiative_Taking", v)} />
                <NumberField label="Stress Handling (0-10)" id="n-stress" value={form.Stress_Handling} min={0} max={10} onChange={(v) => set("Stress_Handling", v)} />
                <NumberField label="Internship (months)" id="n-intern" value={form.Internship_Experience_Months} min={0} onChange={(v) => set("Internship_Experience_Months", v)} />
                <NumberField label="Extracurriculars" id="n-extra" value={form.Extracurricular_Activities} min={0} onChange={(v) => set("Extracurricular_Activities", v)} />
                <NumberField label="Learning Agility (0-10)" id="n-learn" value={form.Learning_Agility} min={0} max={10} onChange={(v) => set("Learning_Agility", v)} />
                <NumberField label="Adaptability (0-10)" id="n-adapt" value={form.Adaptability} min={0} max={10} onChange={(v) => set("Adaptability", v)} />
                <NumberField label="Career Motivation (0-10)" id="n-mot" value={form.Career_Motivation} min={0} max={10} onChange={(v) => set("Career_Motivation", v)} />

                <div className="md:col-span-4">
                    <SubmitButton loading={loading}>Evaluate 9-Box Position</SubmitButton>
                </div>
            </form>

            {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

            {result && (
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ResultCard title="9-Box Position">
                        <span className="text-2xl font-bold text-white">{result.nine_box_position_label}</span>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-300">
                            <span>Grid: <span className="font-mono text-cyan-300">{result.position_in_grid}</span></span>
                            <span>Perf: <span className="font-mono text-cyan-300">{result.performance_level_score}</span></span>
                            <span>Potential: <span className="font-mono text-cyan-300">{result.potential_level_score}</span></span>
                            <span>Confidence: <span className="font-mono text-cyan-300">{Math.round(result.confidence_score * 100)}%</span></span>
                        </div>
                    </ResultCard>
                    <ResultCard title="Recommendation">
                        <p className="text-sm leading-relaxed text-slate-300">{result.descriptive_recommendation}</p>
                    </ResultCard>
                </div>
            )}
        </div>
    );
}
