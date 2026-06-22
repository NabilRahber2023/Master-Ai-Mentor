"use client";

import { useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { StudentAnalyticsDashboard } from "@/components/grade-prediction/StudentAnalyticsDashboard";
import { GradePredictionPanel } from "@/components/modules/live-prediction/grade-prediction-panel";
import { ModeSwitch } from "@/components/modules/csv-mode/mode-switch";
import { CsvModePanel } from "@/components/modules/csv-mode/csv-mode-panel";
import type { SGPAPredictionResponse } from "@/lib/api/predictions";

export default function GradePredictionDashboardPage() {
    const [mode, setMode] = useState<"manual" | "csv">("manual");
    const [livePrediction, setLivePrediction] = useState<SGPAPredictionResponse | null>(null);

    const riskColor = livePrediction?.risk_level?.toLowerCase().includes("high")
        ? "text-red-400"
        : livePrediction?.risk_level?.toLowerCase().includes("mid")
          ? "text-amber-400"
          : "text-emerald-400";

    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Grade Prediction</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex-1 space-y-8 p-6 md:p-8 bg-[var(--app-bg)]">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        Input source
                    </p>
                    <ModeSwitch
                        mode={mode}
                        onChange={(m) => {
                            setMode(m);
                            setLivePrediction(null);
                        }}
                    />
                </div>

                {mode === "manual" ? (
                    <GradePredictionPanel
                        onResult={setLivePrediction}
                        onReset={() => setLivePrediction(null)}
                    />
                ) : (
                    <CsvModePanel
                        module="grade"
                        label="Grade Prediction"
                        onSingleResult={(p) => setLivePrediction(p as SGPAPredictionResponse)}
                        onSingleClear={() => setLivePrediction(null)}
                    />
                )}

                {/* Fresh state: nothing shows until the user runs a prediction */}
                {!livePrediction && (
                    <section className="rounded-xl border border-dashed border-white/10 bg-[var(--app-bg2)]/50 p-12 text-center">
                        <p className="text-sm text-slate-400">
                            Enter student metrics above and click{" "}
                            <span className="font-semibold text-cyan-300">Predict SGPA</span> to
                            populate the analytics dashboard.
                        </p>
                    </section>
                )}

                {/* The full dashboard only renders from a live prediction */}
                {livePrediction && (
                    <>
                        <section className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-5">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#101416]">
                                    Live Prediction
                                </span>
                                <span className="text-2xl font-bold text-[var(--app-text)]">
                                    {livePrediction.predicted_sgpa.toFixed(2)}
                                    <span className="ml-2 text-sm font-normal text-slate-400">predicted SGPA</span>
                                </span>
                                <span className={`text-sm font-semibold ${riskColor}`}>
                                    {livePrediction.risk_level}
                                </span>
                            </div>
                            {livePrediction.contributing_factors.length > 0 && (
                                <p className="mt-2 text-[11px] text-slate-400">
                                    Top factor:{" "}
                                    <span className="font-semibold text-cyan-300">
                                        {livePrediction.contributing_factors[0].feature}
                                    </span>{" "}
                                    (impact {livePrediction.contributing_factors[0].impact_score.toFixed(3)})
                                </p>
                            )}
                        </section>

                        <StudentAnalyticsDashboard prediction={livePrediction} />
                    </>
                )}
            </div>
        </>
    );
}
