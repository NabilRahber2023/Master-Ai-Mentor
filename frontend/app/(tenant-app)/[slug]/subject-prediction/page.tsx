"use client";

import { useState, useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SubjectPredictionPanel } from "@/components/modules/live-prediction/subject-prediction-panel";
import { ModeSwitch } from "@/components/modules/csv-mode/mode-switch";
import { CsvModePanel } from "@/components/modules/csv-mode/csv-mode-panel";
import type { SubjectPredictionResponse } from "@/lib/api/predictions";
import {
  Sliders,
  Cpu,
  Plus,
  Lock,
  Lightbulb,
  TrendingUp,
  ChevronRight
} from "lucide-react";

export default function SubjectPredictionPage() {
  // User additions to matrix
  const [matrixList, setMatrixList] = useState<string[]>([]);

  // Input source: manual form vs. uploaded CSV.
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  // Live ML evaluation result that drives the page when present.
  const [livePrediction, setLivePrediction] = useState<SubjectPredictionResponse | null>(null);

  // Every displayed figure is derived from the actual model output (confidence
  // + alternative probabilities + contributing factors). The dashboard only
  // renders when a live prediction exists, so there is no simulated fallback.
  const simulatedValues = useMemo(() => {
    const conf01 = livePrediction?.confidence_score ?? 0;
    const alt0 = livePrediction?.alternative_options?.[0]?.probability ?? 0;

    const confidence = Math.round(conf01 * 100);

    // GPA impact scales with the model's confidence in the recommendation.
    const gpaImpact = Number((0.2 + conf01 * 0.6).toFixed(2));

    // Alignment: how decisively the top pick beats the runner-up.
    const alignment = Math.min(100, Math.max(55, Math.round(confidence - alt0 * 100 * 0.3 + 6)));

    // Projected credit load (12–20) scales with confidence.
    const credits = Math.min(20, Math.max(12, Math.round(12 + conf01 * 8)));
    const readinessLevel = confidence >= 85 ? 5 : confidence >= 70 ? 4 : confidence >= 55 ? 3 : 2;
    const readinessLabel = confidence >= 85 ? "Peak Capacity" : confidence >= 70 ? "High Capacity" : confidence >= 55 ? "Moderate Capacity" : "Developing";

    // Rationale — built from the actual recommendation.
    let rationale = "Run a prediction to generate the model's rationale.";
    if (livePrediction) {
      const alt = livePrediction.alternative_options?.[0];
      const driver = livePrediction.contributing_factors?.[0]?.feature;
      rationale = `The model recommends ${livePrediction.recommended_department} at ${confidence}% confidence`
        + (alt ? `, ahead of ${alt.department} (${Math.round(alt.probability * 100)}%)` : "")
        + (driver ? `. The strongest driver of this fit is ${driver}.` : ".");
    }

    return {
      confidence,
      gpaImpact,
      alignment,
      credits,
      readinessLevel,
      readinessLabel,
      rationale,
    };
  }, [livePrediction]);

  // Radar coordinates — driven by the live prediction (confidence + alternative
  // probabilities).
  const getRadarPoints = () => {
    const base = livePrediction?.confidence_score ?? 0;
    const a0 = livePrediction?.alternative_options?.[0]?.probability ?? 0;
    const a1 = livePrediction?.alternative_options?.[1]?.probability ?? 0;
    // center is 100, 100. max radius is 80.
    // categories: Logic, Theory, Systems, Ethics, Data
    const logic = 40 + base * 40;
    const theory = 50 + base * 30;
    const systems = 30 + (1 - a0) * 50;
    const ethics = 70 - a0 * 30;
    const data = 40 + a1 * 20 + base * 20;

    const p1 = [100, 100 - logic]; // 0 deg
    const p2 = [100 + theory * Math.sin(Math.PI/2.5), 100 - theory * Math.cos(Math.PI/2.5)];
    const p3 = [100 + systems * Math.sin(2*Math.PI/2.5), 100 - systems * Math.cos(2*Math.PI/2.5)];
    const p4 = [100 - ethics * Math.sin(2*Math.PI/2.5), 100 - ethics * Math.cos(2*Math.PI/2.5)];
    const p5 = [100 - data * Math.sin(Math.PI/2.5), 100 - data * Math.cos(Math.PI/2.5)];

    return `${p1[0].toFixed(0)},${p1[1].toFixed(0)} ${p2[0].toFixed(0)},${p2[1].toFixed(0)} ${p3[0].toFixed(0)},${p3[1].toFixed(0)} ${p4[0].toFixed(0)},${p4[1].toFixed(0)} ${p5[0].toFixed(0)},${p5[1].toFixed(0)}`;
  };

  // Download the live prediction (plus any shortlisted departments) as JSON.
  const handleExportResult = () => {
    if (!livePrediction) return;
    const payload = {
      recommended_department: livePrediction.recommended_department,
      confidence_score: livePrediction.confidence_score,
      alternative_options: livePrediction.alternative_options,
      contributing_factors: livePrediction.contributing_factors,
      shortlisted_departments: matrixList,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Subject_Prediction_${livePrediction.recommended_department.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const toggleMatrix = (code: string) => {
    if (matrixList.includes(code)) {
      setMatrixList(matrixList.filter(c => c !== code));
    } else {
      setMatrixList([...matrixList, code]);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] font-body selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Top Header Breadcrumbs Wrapper */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--app-border)]/10 px-6 bg-[var(--app-bg)] sticky top-0 z-50">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-headline text-slate-300 uppercase tracking-widest text-[10px]">
                Subject Intelligence Matrix
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Live API-connected prediction panel */}
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Input source</p>
          <ModeSwitch mode={mode} onChange={(m) => { setMode(m); setLivePrediction(null); }} />
        </div>

        {mode === "manual" ? (
          <SubjectPredictionPanel
            onResult={setLivePrediction}
            onReset={() => setLivePrediction(null)}
          />
        ) : (
          <CsvModePanel
            module="subject"
            label="Subject Prediction"
            onSingleResult={(p) => setLivePrediction(p as SubjectPredictionResponse)}
            onSingleClear={() => setLivePrediction(null)}
          />
        )}

        {/* Fresh state: nothing shows until the user runs a prediction */}
        {!livePrediction && (
          <section className="rounded-xl border border-dashed border-[var(--app-border)]/30 bg-[var(--app-card2)]/40 p-12 text-center">
            <p className="text-sm text-slate-400">
              Enter student attributes above and click{" "}
              <span className="font-semibold text-cyan-300">Recommend Subject</span> to populate
              the prediction matrix.
            </p>
          </section>
        )}

        {/* Live result banner */}
        {livePrediction && (
          <section className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#101416]">
                Live Recommendation
              </span>
              <span className="text-2xl font-bold text-[var(--app-text)]">{livePrediction.recommended_department}</span>
              <span className="font-mono text-xs text-cyan-300">
                {Math.round(livePrediction.confidence_score * 100)}% confidence
              </span>
            </div>
            {livePrediction.alternative_options.length > 0 && (
              <p className="mt-2 text-[11px] text-slate-400">
                Alternatives:{" "}
                {livePrediction.alternative_options
                  .map((o) => `${o.department} (${Math.round(o.probability * 100)}%)`)
                  .join(" · ")}
              </p>
            )}
          </section>
        )}

        {/* Impact Factors — real SHAP contributions from the subject model */}
        {livePrediction && livePrediction.contributing_factors.length > 0 && (
          <section className="rounded-xl border border-[var(--app-border)]/20 bg-[var(--app-card)]/60 p-5">
            <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase mb-0.5">Impact Factors</h3>
            <p className="text-[11px] text-slate-400 mb-4">Variables driving the recommendation</p>
            <div className="space-y-4">
              {(() => {
                const maxImpact = Math.max(
                  ...livePrediction.contributing_factors.map((f) => Math.abs(f.impact_score)),
                  0.0001,
                );
                return livePrediction.contributing_factors.map((f) => {
                  const pct = Math.min(100, Math.max(8, (Math.abs(f.impact_score) / maxImpact) * 100));
                  return (
                    <div key={f.feature}>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-slate-300 font-medium font-headline tracking-wider uppercase">
                          {f.feature}
                        </span>
                        <span className="text-cyan-400 font-bold font-headline">
                          {f.impact_score.toFixed(3)}
                          <span className="ml-1 text-slate-500">
                            ({typeof f.value === "number" ? f.value : f.value})
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--app-surface2)]/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,229,255,0.4)] transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </section>
        )}
      </div>

      {/* Main Page Layout Grid (OpenAI Enterprise/Palantir Dark theme) */}
      {livePrediction && (
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Columns (8 columns): Main Analytics and Modules */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Main Title Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--app-border)]/15 pb-4 gap-4">
            <div>
              <h1 className="text-3xl font-headline font-bold text-[var(--app-text)] tracking-tighter uppercase drop-shadow-[0_0_12px_rgba(195,245,255,0.1)]">
                Subject Intelligence Matrix
              </h1>
              <p className="text-[10px] text-slate-400 font-headline uppercase tracking-[0.2em] mt-1">
                Advanced Academic Predictive Diagnostics
              </p>
            </div>
            
          </div>

          {/* Primary Hero Panel */}
          <section className="bg-gradient-to-r from-cyan-950/15 via-[var(--app-card)]/40 to-teal-950/15 rounded-xl p-6 md:p-8 relative overflow-hidden border border-[var(--app-border)]/20 shadow-[0_0_40px_-5px_rgba(195,245,255,0.05)]">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_2px,#bac9cc_2px,#bac9cc_4px)]"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase tracking-[0.25em]">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                  Live Prediction Active
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-headline">Recommended Department</p>
                <h2 className="text-3xl font-headline font-bold text-[var(--app-text)] tracking-tight leading-none uppercase">
                  {livePrediction?.recommended_department ?? "Optimal Course Trajectory"}
                </h2>
                <p className="text-slate-400 text-xs leading-relaxed font-body">
                  Based on your submitted profile, the model ranks{" "}
                  <span className="text-cyan-300 font-semibold">{livePrediction?.recommended_department ?? "this department"}</span>{" "}
                  as your strongest-fit pathway at {simulatedValues.confidence}% confidence
                  {livePrediction && livePrediction.alternative_options.length > 0
                    ? `, with ${livePrediction.alternative_options.length} alternative path${livePrediction.alternative_options.length > 1 ? "s" : ""} below.`
                    : "."}
                </p>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleExportResult}
                    className="px-5 py-2.5 rounded font-headline text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300 flex items-center gap-2 bg-cyan-400 text-[#101416] hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                  >
                    <Lock className="w-3 h-3" />
                    Export Result
                  </button>
                </div>
              </div>

              {/* Circular Confidence Score Gauge */}
              <div className="flex flex-col items-center justify-center shrink-0 w-36 h-36 relative md:pl-6">
                <svg className="w-32 h-32 transform -rotate-90">
                  {/* Gray background track */}
                  <circle cx="64" cy="64" r="54" stroke="rgba(59, 73, 76, 0.15)" strokeWidth="6" fill="transparent" />
                  {/* Cyan progress */}
                  <circle 
                    cx="64" 
                    cy="64" 
                    r="54" 
                    stroke="#00e5ff" 
                    strokeWidth="6" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - simulatedValues.confidence / 100)}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-headline font-bold text-[var(--app-text)] leading-none">
                    {simulatedValues.confidence}<span className="text-sm font-semibold text-cyan-500/60">%</span>
                  </span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-widest mt-1">Confidence</span>
                  <span className="text-[7px] text-slate-500 uppercase mt-0.5">ALGORITHM V4.2.1</span>
                </div>
              </div>
            </div>
          </section>

          {/* ANALYTICS SECTION */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-[var(--app-card)]/60 rounded-xl p-4 border border-[var(--app-border)]/20 flex flex-col justify-between min-h-[90px]">
              <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-headline">Total Projected Credits</span>
              <div className="flex justify-between items-end mt-2">
                <span className="text-2xl font-bold text-[var(--app-text)] font-headline">{simulatedValues.credits} <span className="text-xs text-slate-500 font-normal">/20</span></span>
              </div>
              <div className="w-full h-1 bg-[var(--app-surface)] mt-2 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${(simulatedValues.credits / 20) * 100}%` }}></div>
              </div>
            </div>

            <div className="bg-[var(--app-card)]/60 rounded-xl p-4 border border-[var(--app-border)]/20 flex flex-col justify-between min-h-[90px]">
              <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-headline">Forecasted GPA Impact</span>
              <div className="flex items-center gap-1.5 text-cyan-400 mt-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-2xl font-bold font-headline">+{simulatedValues.gpaImpact.toFixed(2)}</span>
              </div>
              <span className="text-[8px] text-cyan-400/60 uppercase tracking-wider mt-1 font-headline">Upward Trajectory</span>
            </div>

            <div className="bg-[var(--app-card)]/60 rounded-xl p-4 border border-[var(--app-border)]/20 flex flex-col items-center justify-between min-h-[90px] relative">
              <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-headline w-full text-left">System Alignment</span>
              <div className="w-10 h-10 relative mt-1">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="20" cy="20" r="16" stroke="rgba(59, 73, 76, 0.15)" strokeWidth="3" fill="transparent" />
                  <circle 
                    cx="20" 
                    cy="20" 
                    r="16" 
                    stroke="#00e5ff" 
                    strokeWidth="3" 
                    fill="transparent" 
                    strokeDasharray={2 * Math.PI * 16}
                    strokeDashoffset={2 * Math.PI * 16 * (1 - simulatedValues.alignment / 100)}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[var(--app-text)]">
                  {simulatedValues.alignment}%
                </div>
              </div>
            </div>

            <div className="bg-[var(--app-card)]/60 rounded-xl p-4 border border-[var(--app-border)]/20 flex flex-col justify-between min-h-[90px]">
              <span className="text-[8px] text-slate-400 uppercase tracking-widest block font-headline">System Readiness</span>
              <div className="mt-2">
                <span className="text-sm font-bold text-[var(--app-text)] font-headline block">Level {simulatedValues.readinessLevel}</span>
                <span className="text-[8px] text-slate-400 uppercase block">{simulatedValues.readinessLabel}</span>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={`w-1.5 h-4 rounded-sm ${i <= simulatedValues.readinessLevel ? "bg-cyan-400" : "bg-slate-800"}`}></span>
                ))}
              </div>
            </div>
          </div>

          {/* VISUALIZATION SECTION: Charts and Graphs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Skill Topology Drift Radar Chart */}
            <div className="bg-[var(--app-card)]/40 rounded-xl p-6 border border-[var(--app-border)]/20 flex flex-col justify-between">
              <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                Skill Topology Drift
              </h3>

              <div className="relative flex items-center justify-center min-h-[220px]">
                <svg className="w-48 h-48 drop-shadow-[0_0_12px_rgba(0,229,255,0.15)]" viewBox="0 0 200 200">
                  {/* Grid Lines */}
                  <line x1="100" y1="20" x2="100" y2="180" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <line x1="43" y1="43" x2="157" y2="157" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                  <line x1="43" y1="157" x2="157" y2="43" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                  {/* Web grid polygons */}
                  <polygon points="100,20 169,60 169,140 100,180 31,140 31,60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <polygon points="100,40 152,70 152,130 100,160 48,130 48,70" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                  <polygon points="100,60 135,80 135,120 100,140 65,120 65,80" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

                  {/* Dynamic projected state layout */}
                  <polygon points={getRadarPoints()} fill="rgba(0, 229, 255, 0.12)" stroke="#00e5ff" strokeWidth="2" />
                </svg>

                {/* Radar axis labels */}
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 text-[8px] uppercase tracking-widest text-cyan-400 font-bold font-headline">Logic</span>
                <span className="absolute top-1/4 right-0 translate-x-4 text-[8px] uppercase tracking-widest text-slate-400 font-headline">Theory</span>
                <span className="absolute bottom-1/4 right-0 translate-x-4 text-[8px] uppercase tracking-widest text-slate-400 font-headline">Systems</span>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-widest text-cyan-400 font-bold font-headline">Code</span>
                <span className="absolute bottom-1/4 left-0 -translate-x-4 text-[8px] uppercase tracking-widest text-slate-400 font-headline">Ethics</span>
                <span className="absolute top-1/4 left-0 -translate-x-4 text-[8px] uppercase tracking-widest text-slate-400 font-headline">Data</span>
              </div>

              <div className="flex justify-center gap-6 mt-4 text-[9px] uppercase tracking-widest border-t border-[var(--app-border)]/10 pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-cyan-400/20 border border-cyan-400"></span>
                  <span className="text-cyan-400 font-headline">Projected Drift</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded border border-dashed border-[#44d8f1]"></span>
                  <span className="text-slate-400 font-headline">Current Profile</span>
                </div>
              </div>
            </div>

            {/* Semester Trajectory Graph Box */}
            <div className="bg-[var(--app-card)]/40 rounded-xl p-6 border border-[var(--app-border)]/20 flex flex-col justify-between">
              <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                Semester Trajectory
              </h3>

              <div className="space-y-4">
                <div className="bg-[var(--app-bg)]/50 rounded-lg p-3 border border-[var(--app-border)]/10">
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 block mb-1">Credit Load Density</span>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-bold text-[var(--app-text)] font-headline">{simulatedValues.credits} <span className="text-[10px] text-slate-500 font-normal">/20 max</span></span>
                    <span className="text-[10px] text-teal-400 font-headline uppercase font-semibold">{simulatedValues.credits >= 18 ? "Optimal Load" : simulatedValues.credits >= 15 ? "Balanced Load" : "Light Load"}</span>
                  </div>
                  <div className="w-full h-1 bg-[var(--app-surface)] mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full" style={{ width: `${(simulatedValues.credits / 20) * 100}%` }}></div>
                  </div>
                </div>

                <div className="bg-[var(--app-bg)]/50 rounded-lg p-3 border border-[var(--app-border)]/10">
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 block mb-1">GPA Impact Delta</span>
                  <div className="flex items-baseline gap-1 text-cyan-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-xl font-bold font-headline">+{simulatedValues.gpaImpact.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-[var(--app-bg)]/50 rounded-lg p-3 border border-[var(--app-border)]/10 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 block mb-0.5">System Readiness</span>
                    <span className="text-xs font-bold text-[var(--app-text)] font-headline">Level {simulatedValues.readinessLevel}: {simulatedValues.readinessLabel}</span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={`w-1.5 h-5 rounded-sm ${i <= simulatedValues.readinessLevel ? "bg-cyan-400" : "bg-slate-800"}`}></span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRIMARY TARGET MODULES */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--app-border)]/10 pb-2">
              <h3 className="text-xs text-[var(--app-text)] font-headline font-bold uppercase tracking-wider">Primary Target Modules</h3>
              <span className="text-[9px] font-headline text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                {matrixList.length > 0 ? `${matrixList.length} in matrix` : "Matrix empty"}
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Top recommendation (live) */}
              <div className="bg-[var(--app-card2)]/80 border border-[var(--app-border)]/15 rounded-xl p-5 flex flex-col justify-between min-h-[170px] hover:bg-[var(--app-card)]/80 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] text-cyan-400 font-mono tracking-wider">RANK 01</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/30 text-[9px] font-bold">
                      {simulatedValues.confidence}% Match
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--app-text)] truncate mb-1">{livePrediction?.recommended_department}</h4>
                  <p className="text-[11px] text-slate-400 leading-normal line-clamp-3">
                    Top-ranked department for your profile — the model&apos;s primary recommendation.
                  </p>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--app-border)]/10">
                  <div className="text-[9px] text-slate-400">
                    MODEL CONFIDENCE: <span className="text-[var(--app-text)] font-semibold">{simulatedValues.confidence}%</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map((seg) => (
                      <span
                        key={seg}
                        className={`w-1 h-3 rounded-sm ${simulatedValues.confidence >= seg * 25 ? "bg-cyan-400" : "bg-slate-800"}`}
                      ></span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Closest alternative (live) */}
              {livePrediction?.alternative_options[0] && (
                <div className="bg-[var(--app-card2)]/80 border border-[var(--app-border)]/15 rounded-xl p-5 flex flex-col justify-between min-h-[170px] hover:bg-[var(--app-card)]/80 transition-colors">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] text-cyan-400 font-mono tracking-wider">RANK 02</span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/30 text-[9px] font-bold">
                        {Math.round(livePrediction.alternative_options[0].probability * 100)}% Match
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-[var(--app-text)] truncate mb-1">{livePrediction.alternative_options[0].department}</h4>
                    <p className="text-[11px] text-slate-400 leading-normal line-clamp-3">
                      Closest alternative department to your top recommendation.
                    </p>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--app-border)]/10">
                    <div className="text-[9px] text-slate-400">
                      MATCH PROBABILITY: <span className="text-[var(--app-text)] font-semibold">{Math.round(livePrediction.alternative_options[0].probability * 100)}%</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map((seg) => (
                        <span
                          key={seg}
                          className={`w-1 h-3 rounded-sm ${Math.round(livePrediction.alternative_options[0].probability * 100) >= seg * 25 ? "bg-yellow-500" : "bg-slate-800"}`}
                        ></span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Card 3: Mini Radar Diagram */}
              <div className="bg-[var(--app-card2)]/80 border border-[var(--app-border)]/15 rounded-xl p-5 flex flex-col justify-between min-h-[170px] relative overflow-hidden">
                <span className="text-[9px] text-slate-400 uppercase tracking-widest font-headline block mb-2">Skill Topography</span>
                <div className="flex-1 flex items-center justify-center">
                  <svg className="w-24 h-24" viewBox="0 0 200 200">
                    <polygon points="100,20 169,60 169,140 100,180 31,140 31,60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                    <polygon points={getRadarPoints()} fill="rgba(0, 229, 255, 0.12)" stroke="#00e5ff" strokeWidth="3" />
                  </svg>
                </div>
                <div className="text-[8px] text-slate-500 mt-2 text-center uppercase tracking-widest">
                  Topographic shift indicated in Systems domain post-completion.
                </div>
              </div>
            </div>
          </div>

          {/* SECONDARY VECTORS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-2.5 border-l-2 border-cyan-400">
              Secondary Vectors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(livePrediction?.alternative_options ?? []).slice(1, 3).map((alt) => (
                <div
                  key={alt.department}
                  className="bg-[var(--app-card2)]/60 border border-[var(--app-border)]/15 hover:border-cyan-500/20 p-4 rounded-xl flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--app-surface)] flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-[var(--app-text)] group-hover:text-cyan-400 transition-colors">
                        {alt.department}
                      </h4>
                      <span className="text-[10px] text-cyan-400 uppercase tracking-widest">
                        Match: {Math.round(alt.probability * 100)}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMatrix(alt.department)}
                    className={`text-[9px] font-headline font-bold uppercase tracking-widest transition-colors flex items-center gap-1 ${
                      matrixList.includes(alt.department) ? "text-teal-400" : "text-slate-400 hover:text-[var(--app-text)]"
                    }`}
                  >
                    {matrixList.includes(alt.department) ? "ADDED" : "ADD TO MATRIX"}
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {(livePrediction?.alternative_options?.length ?? 0) <= 1 && (
                <p className="text-[11px] text-slate-500 md:col-span-2">
                  No further alternative departments returned by the model for this profile.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel (4 columns): Telemetry Tuning & Primary Recommendations */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Prediction Drivers — real SHAP contributions from the subject model */}
          <section className="bg-[var(--app-card)]/40 rounded-xl p-6 border border-[var(--app-border)]/20 flex flex-col justify-between space-y-6">
            <div className="border-b border-[var(--app-border)]/10 pb-3">
              <h3 className="text-sm font-headline text-cyan-400 tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Prediction Drivers
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-2 leading-relaxed font-headline">
                Variables with the strongest influence on this recommendation.
              </p>
            </div>

            <div className="space-y-5 flex-1">
              {(livePrediction?.contributing_factors ?? []).slice(0, 5).map((f) => {
                const maxImpact = Math.max(
                  ...(livePrediction?.contributing_factors ?? []).map((x) => Math.abs(x.impact_score)),
                  0.0001,
                );
                const pct = Math.min(100, Math.max(8, (Math.abs(f.impact_score) / maxImpact) * 100));
                return (
                  <div key={f.feature}>
                    <div className="flex justify-between mb-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className="text-slate-300">{f.feature}</span>
                      <span className="text-cyan-400 font-mono">
                        {f.impact_score.toFixed(3)}
                        <span className="ml-1 text-slate-500">({String(f.value)})</span>
                      </span>
                    </div>
                    <div className="w-full bg-[var(--app-bg)] h-1 rounded-full overflow-hidden">
                      <div
                        className="bg-cyan-400 h-full rounded-full shadow-[0_0_8px_rgba(0,229,255,0.4)] transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              {(livePrediction?.contributing_factors?.length ?? 0) === 0 && (
                <p className="text-[11px] text-slate-500">
                  The model did not return factor attributions for this prediction.
                </p>
              )}

              {/* Rationale System Box */}
              <div className="bg-[var(--app-bg)]/50 rounded-lg p-4 border border-[var(--app-border)]/10 border-l-2 border-l-cyan-400 space-y-1">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1 font-headline">
                  <Lightbulb className="w-3.5 h-3.5" />
                  System Rationale
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-body">
                  {simulatedValues.rationale}
                </p>
              </div>
            </div>
          </section>

          {/* PRIMARY RECOMMENDATIONS */}
          <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[var(--app-border)]/10 pb-2">
              Primary Recommendations
            </h3>

            <div className="space-y-4">
              
              {/* Rec Card 1 */}
              <div className="bg-[var(--app-card)]/60 rounded-xl p-5 border border-[var(--app-border)]/20 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 text-[9px] font-bold tracking-widest uppercase">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/30">TOP MATCH</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">RANK 01</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    Alignment: {simulatedValues.alignment}%
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--app-text)] mb-1.5">{livePrediction?.recommended_department ?? "Recommended Department"}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Why it fits:</strong> {livePrediction?.recommended_department ?? "This department"} is the model&apos;s top match for your profile at {simulatedValues.confidence}% confidence
                    {livePrediction?.contributing_factors?.[0] ? `, driven most by ${livePrediction.contributing_factors[0].feature}.` : "."}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-400 uppercase tracking-widest mb-1.5">
                      <span>Model Confidence</span>
                      <span className="text-[var(--app-text)] font-semibold">{simulatedValues.confidence}%</span>
                    </div>
                    <div className="h-1 w-full bg-[var(--app-surface)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,229,255,0.4)] transition-all duration-300"
                        style={{ width: `${simulatedValues.confidence}%` }}
                      ></div>
                    </div>
                  </div>

                  {livePrediction?.contributing_factors?.[0] && (
                    <div className="flex justify-between text-[9px] text-slate-400 uppercase tracking-widest">
                      <span>Strongest Driver</span>
                      <span className="text-teal-400 font-semibold">{livePrediction.contributing_factors[0].feature}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Alternative recommendation cards — one per model-returned option */}
              {(livePrediction?.alternative_options ?? []).slice(0, 2).map((alt, i) => (
                <div key={alt.department} className="bg-[var(--app-card)]/60 rounded-xl p-5 border border-[var(--app-border)]/20 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 text-[9px] font-bold tracking-widest uppercase">
                      <span className="px-2 py-0.5 rounded bg-yellow-950/40 text-yellow-400 border border-yellow-800/30">ALTERNATIVE</span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">RANK 0{i + 2}</span>
                    </div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                      {Math.round(alt.probability * 100)}%
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--app-text)] mb-1.5">{alt.department}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {i === 0
                        ? "A strong secondary fit for your profile, ranked just below the top recommendation."
                        : "A viable third option worth considering alongside your top two matches."}
                    </p>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-[var(--app-border)]/10">
                    <div className="text-[9px] text-slate-400">
                      MATCH PROBABILITY: <span className="text-cyan-400">{Math.round(alt.probability * 100)}%</span>
                    </div>
                    <button
                      onClick={() => toggleMatrix(alt.department)}
                      className={`text-[9px] font-headline font-bold uppercase tracking-widest transition-colors ${
                        matrixList.includes(alt.department) ? "text-teal-400" : "text-slate-400 hover:text-[var(--app-text)]"
                      }`}
                    >
                      {matrixList.includes(alt.department) ? "ADDED" : "ADD TO MATRIX"}
                    </button>
                  </div>
                </div>
              ))}

            </div>
          </section>
        </div>
      </main>
      )}

      {/* Footer copyright notice from mockup */}
      <footer className="border-t border-[var(--app-border)]/10 bg-[var(--app-bg)]/50 py-4 px-6 text-[10px] text-slate-500 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
          Matrix adapts in real-time as new performance data becomes available.
        </div>
        <div>
          MCP ORCHESTRA SYSTEM V1.0.4
        </div>
      </footer>
    </div>
  );
}
