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
  Brain,
  Search, 
  Bell, 
  Settings, 
  Sliders, 
  Cpu, 
  Plus, 
  Lock, 
  Lightbulb, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  ChevronRight,
  BookOpen
} from "lucide-react";

export default function SubjectPredictionPage() {
  // Telemetry Sliders
  const [cognitiveWeight, setCognitiveWeight] = useState(0.85);
  const [workloadTolerance, setWorkloadTolerance] = useState(0.60);
  const [marketTrendImpact, setMarketTrendImpact] = useState(0.42);

  // User additions to matrix
  const [matrixList, setMatrixList] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  // Input source: manual form vs. uploaded CSV.
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  // Live ML evaluation result that drives the page when present.
  const [livePrediction, setLivePrediction] = useState<SubjectPredictionResponse | null>(null);

  // Dynamic state simulation
  const simulatedValues = useMemo(() => {
    // Confidence: use the live model confidence when available, else slider sim.
    const confidence = livePrediction
      ? Math.round(livePrediction.confidence_score * 100)
      : Math.min(99, Math.max(70, Math.round(92 + (cognitiveWeight - 0.85) * 8 - (workloadTolerance - 0.6) * 5 + (marketTrendImpact - 0.42) * 6)));
    
    // GPA impact
    const gpaImpact = Number((0.45 + (cognitiveWeight - 0.85) * 0.15 + (marketTrendImpact - 0.42) * 0.10).toFixed(2));
    
    // Alignment percentage
    const alignment = Math.min(100, Math.max(60, Math.round(98 + (cognitiveWeight - 0.85) * 4 - (1 - workloadTolerance) * 10)));
    
    // Match rates for cards
    const cryptoMatch = Math.min(99, Math.max(75, Math.round(94 + (cognitiveWeight - 0.85) * 6)));
    const bioMatch = Math.min(99, Math.max(70, Math.round(88 + (marketTrendImpact - 0.42) * 12)));
    const structuresMatch = Math.min(99, Math.max(65, Math.round(84 - (workloadTolerance - 0.6) * 10)));
    const archMatch = Math.min(99, Math.max(60, Math.round(79 + (cognitiveWeight - 0.85) * 8)));

    // Rationale description updates
    let rationale = "Optimal configuration maintained. Performance vector and cognitive load parameters are balanced.";
    if (workloadTolerance < 0.50) {
      rationale = "Lowering Workload Tolerance below 0.50 shifts the primary recommendation to 'Hardware Architecture' to preserve system stability, despite a minor drop in GPA Delta projection.";
    } else if (marketTrendImpact > 0.70) {
      rationale = "High Market Trend Impact prioritizes cutting-edge vectors such as Quantum Cryptography and Synthetic Bio-Data to capitalize on emerging technological shifts.";
    } else if (cognitiveWeight > 0.90) {
      rationale = "Peak Cognitive Aptitude Weight indicates high capacity for dense algorithm tracks, scaling the difficulty curve up for maximum GPA efficiency.";
    }

    return {
      confidence,
      gpaImpact,
      alignment,
      cryptoMatch,
      bioMatch,
      structuresMatch,
      archMatch,
      rationale
    };
  }, [cognitiveWeight, workloadTolerance, marketTrendImpact, livePrediction]);

  // Map radar coordinate updates dynamically based on current slider values
  const getRadarPoints = () => {
    // center is 100, 100. max radius is 80.
    // categories: Logic, Theory, Systems, Ethics, Data
    const logic = 40 + cognitiveWeight * 40;
    const theory = 50 + cognitiveWeight * 30;
    const systems = 30 + workloadTolerance * 50;
    const ethics = 70 - workloadTolerance * 30;
    const data = 40 + marketTrendImpact * 20 + cognitiveWeight * 20;

    const p1 = [100, 100 - logic]; // 0 deg
    const p2 = [100 + theory * Math.sin(Math.PI/2.5), 100 - theory * Math.cos(Math.PI/2.5)];
    const p3 = [100 + systems * Math.sin(2*Math.PI/2.5), 100 - systems * Math.cos(2*Math.PI/2.5)];
    const p4 = [100 - ethics * Math.sin(2*Math.PI/2.5), 100 - ethics * Math.cos(2*Math.PI/2.5)];
    const p5 = [100 - data * Math.sin(Math.PI/2.5), 100 - data * Math.cos(Math.PI/2.5)];

    return `${p1[0].toFixed(0)},${p1[1].toFixed(0)} ${p2[0].toFixed(0)},${p2[1].toFixed(0)} ${p3[0].toFixed(0)},${p3[1].toFixed(0)} ${p4[0].toFixed(0)},${p4[1].toFixed(0)} ${p5[0].toFixed(0)},${p5[1].toFixed(0)}`;
  };

  const getSecondaryRadarPoints = () => {
    // Current Profile coordinates
    const p1 = [100, 50];
    const p2 = [140, 75];
    const p3 = [150, 120];
    const p4 = [70, 130];
    const p5 = [60, 70];
    return `${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p4[0]},${p4[1]} ${p5[0]},${p5[1]}`;
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
            
            {/* Search & Actions inside matrix page top */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center bg-[var(--app-card)] rounded px-3 py-1.5 border border-[var(--app-border)]/20 focus-within:border-cyan-400 transition-all w-full sm:w-60 group">
                <Search className="text-slate-400 text-xs mr-2 group-focus-within:text-cyan-400 transition-colors w-3.5 h-3.5" />
                <input 
                  className="bg-transparent border-none outline-none text-[10px] text-[var(--app-text)] w-full placeholder:text-slate-500 font-headline uppercase tracking-wider" 
                  placeholder="QUERY SUBJECTS..." 
                  type="text"
                />
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button className="text-slate-400 hover:text-cyan-400 transition-colors">
                  <Bell className="w-4 h-4" />
                </button>
                <button className="text-slate-400 hover:text-cyan-400 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
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
                  Based on your historical performance vector and cognitive load analysis, this pathway represents the optimal subject sequence to maximize your academic potential for Semester 04.
                </p>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsLocked(!isLocked)}
                    className={`px-5 py-2.5 rounded font-headline text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300 flex items-center gap-2 ${
                      isLocked 
                        ? "bg-teal-600 text-[var(--app-text)]" 
                        : "bg-cyan-400 text-[#101416] hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,229,255,0.25)]"
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    {isLocked ? "Lock Selection" : "Lock Selection"}
                  </button>
                  <button className="px-5 py-2.5 bg-transparent border border-[var(--app-border)]/30 text-cyan-400 rounded font-headline text-[10px] font-bold tracking-[0.15em] uppercase hover:bg-[var(--app-surface)]/30 transition-colors">
                    View Syllabus
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
                <span className="text-2xl font-bold text-[var(--app-text)] font-headline">18 <span className="text-xs text-slate-500 font-normal">/20</span></span>
              </div>
              <div className="w-full h-1 bg-[var(--app-surface)] mt-2 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: "90%" }}></div>
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
                <span className="text-sm font-bold text-[var(--app-text)] font-headline block">Level 4</span>
                <span className="text-[8px] text-slate-400 uppercase block">High Capacity</span>
              </div>
              <div className="flex gap-1 mt-2">
                <span className="w-1.5 h-4 bg-cyan-400 rounded-sm"></span>
                <span className="w-1.5 h-4 bg-cyan-400 rounded-sm"></span>
                <span className="w-1.5 h-4 bg-cyan-400 rounded-sm"></span>
                <span className="w-1.5 h-4 bg-cyan-400 rounded-sm"></span>
                <span className="w-1.5 h-4 bg-slate-800 rounded-sm"></span>
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

                  {/* Historical layout */}
                  <polygon points={getSecondaryRadarPoints()} fill="rgba(68, 216, 241, 0.04)" stroke="#44d8f1" strokeDasharray="3 3" strokeWidth="1.2" />

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
                    <span className="text-xl font-bold text-[var(--app-text)] font-headline">18 <span className="text-[10px] text-slate-500 font-normal">/20 max</span></span>
                    <span className="text-[10px] text-teal-400 font-headline uppercase font-semibold">Optimal Load</span>
                  </div>
                  <div className="w-full h-1 bg-[var(--app-surface)] mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full" style={{ width: "90%" }}></div>
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
                    <span className="text-xs font-bold text-[var(--app-text)] font-headline">Level 4: High Capacity</span>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-5 bg-cyan-400 rounded-sm"></span>
                    <span className="w-1.5 h-5 bg-cyan-400 rounded-sm"></span>
                    <span className="w-1.5 h-5 bg-cyan-400 rounded-sm"></span>
                    <span className="w-1.5 h-5 bg-cyan-400 rounded-sm"></span>
                    <span className="w-1.5 h-5 bg-slate-800 rounded-sm"></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PRIMARY TARGET MODULES */}
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-[var(--app-border)]/10 pb-2">
              <h3 className="text-xs text-[var(--app-text)] font-headline font-bold uppercase tracking-wider">Primary Target Modules</h3>
              <button className="text-[9px] font-headline text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-1">
                View Matrix <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: Quantum Cryptography */}
              <div className="bg-[var(--app-card2)]/80 border border-[var(--app-border)]/15 rounded-xl p-5 flex flex-col justify-between min-h-[170px] hover:bg-[var(--app-card)]/80 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] text-cyan-400 font-mono tracking-wider">QCS-401</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/30 text-[9px] font-bold">
                      {livePrediction ? simulatedValues.confidence : simulatedValues.cryptoMatch}% Match
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--app-text)] truncate mb-1">{livePrediction?.recommended_department ?? "Quantum Cryptography"}</h4>
                  <p className="text-[11px] text-slate-400 leading-normal line-clamp-3">
                    Advanced theoretical frameworks for securing post-binary data systems and networks.
                  </p>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--app-border)]/10">
                  <div className="text-[9px] text-slate-400">
                    DIFFICULTY VECTOR: <span className="text-[var(--app-text)] font-semibold">HIGH</span>
                  </div>
                  <div className="flex gap-0.5">
                    <span className="w-1 h-3 bg-red-500 rounded-sm"></span>
                    <span className="w-1 h-3 bg-red-500 rounded-sm"></span>
                    <span className="w-1 h-3 bg-red-500 rounded-sm"></span>
                    <span className="w-1 h-3 bg-red-500 rounded-sm"></span>
                  </div>
                </div>
              </div>

              {/* Card 2: Synthetic Bio-Data */}
              <div className="bg-[var(--app-card2)]/80 border border-[var(--app-border)]/15 rounded-xl p-5 flex flex-col justify-between min-h-[170px] hover:bg-[var(--app-card)]/80 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[9px] text-cyan-400 font-mono tracking-wider">SBD-308</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/30 text-[9px] font-bold">
                      {livePrediction?.alternative_options[0] ? Math.round(livePrediction.alternative_options[0].probability * 100) : simulatedValues.bioMatch}% Match
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[var(--app-text)] truncate mb-1">{livePrediction?.alternative_options[0]?.department ?? "Synthetic Bio-Data"}</h4>
                  <p className="text-[11px] text-slate-400 leading-normal line-clamp-3">
                    Data structures mapping organic computational methodologies and cellular algorithms.
                  </p>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-[var(--app-border)]/10">
                  <div className="text-[9px] text-slate-400">
                    DIFFICULTY VECTOR: <span className="text-[var(--app-text)] font-semibold">MEDIUM</span>
                  </div>
                  <div className="flex gap-0.5">
                    <span className="w-1 h-3 bg-yellow-500 rounded-sm"></span>
                    <span className="w-1 h-3 bg-yellow-500 rounded-sm"></span>
                    <span className="w-1 h-3 bg-slate-800 rounded-sm"></span>
                    <span className="w-1 h-3 bg-slate-800 rounded-sm"></span>
                  </div>
                </div>
              </div>

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
              
              <div className="bg-[var(--app-card2)]/60 border border-[var(--app-border)]/15 hover:border-cyan-500/20 p-4 rounded-xl flex items-center justify-between transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--app-surface)] flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[var(--app-text)] group-hover:text-cyan-400 transition-colors">
                      {livePrediction?.alternative_options[1]?.department ?? "Data Structures III"}
                    </h4>
                    <span className="text-[10px] text-cyan-400 uppercase tracking-widest">
                      Match: {livePrediction?.alternative_options[1] ? Math.round(livePrediction.alternative_options[1].probability * 100) : simulatedValues.structuresMatch}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleMatrix("DAT-303")}
                  className={`text-[9px] font-headline font-bold uppercase tracking-widest transition-colors flex items-center gap-1 ${
                    matrixList.includes("DAT-303") ? "text-teal-400" : "text-slate-400 hover:text-[var(--app-text)]"
                  }`}
                >
                  {matrixList.includes("DAT-303") ? "ADDED" : "ADD TO MATRIX"}
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-[var(--app-card2)]/60 border border-[var(--app-border)]/15 hover:border-cyan-500/20 p-4 rounded-xl flex items-center justify-between transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--app-surface)] flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-[var(--app-text)] group-hover:text-cyan-400 transition-colors">
                      {livePrediction?.alternative_options[2]?.department ?? "Hardware Architecture"}
                    </h4>
                    <span className="text-[10px] text-cyan-400 uppercase tracking-widest">
                      Match: {livePrediction?.alternative_options[2] ? Math.round(livePrediction.alternative_options[2].probability * 100) : simulatedValues.archMatch}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleMatrix("ARC-302")}
                  className={`text-[9px] font-headline font-bold uppercase tracking-widest transition-colors flex items-center gap-1 ${
                    matrixList.includes("ARC-302") ? "text-teal-400" : "text-slate-400 hover:text-[var(--app-text)]"
                  }`}
                >
                  {matrixList.includes("ARC-302") ? "ADDED" : "ADD TO MATRIX"}
                  <Plus className="w-3 h-3" />
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Right Panel (4 columns): Telemetry Tuning & Primary Recommendations */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Telemetry Tuning Slider Control Box */}
          <section className="bg-[var(--app-card)]/40 rounded-xl p-6 border border-[var(--app-border)]/20 flex flex-col justify-between space-y-6">
            <div className="border-b border-[var(--app-border)]/10 pb-3">
              <h3 className="text-sm font-headline text-cyan-400 tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                Telemetry Tuning
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-2 leading-relaxed font-headline">
                Adjust parameters to simulate alternative trajectory outcomes.
              </p>
            </div>

            <div className="space-y-5 flex-1">
              <div>
                <div className="flex justify-between mb-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-300">Cognitive Aptitude Weight</span>
                  <span className="text-cyan-400 font-mono">{cognitiveWeight.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05"
                  className="w-full accent-cyan-400 bg-[var(--app-bg)] h-1 rounded-full appearance-none cursor-pointer"
                  value={cognitiveWeight}
                  onChange={(e) => setCognitiveWeight(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-300">Workload Tolerance</span>
                  <span className="text-cyan-400 font-mono">{workloadTolerance.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05"
                  className="w-full accent-cyan-400 bg-[var(--app-bg)] h-1 rounded-full appearance-none cursor-pointer"
                  value={workloadTolerance}
                  onChange={(e) => setWorkloadTolerance(parseFloat(e.target.value))}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-300">Market Trend Impact</span>
                  <span className="text-cyan-400 font-mono">{marketTrendImpact.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05"
                  className="w-full accent-cyan-400 bg-[var(--app-bg)] h-1 rounded-full appearance-none cursor-pointer"
                  value={marketTrendImpact}
                  onChange={(e) => setMarketTrendImpact(parseFloat(e.target.value))}
                />
              </div>

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

            <button 
              onClick={() => {
                setCognitiveWeight(0.85);
                setWorkloadTolerance(0.60);
                setMarketTrendImpact(0.42);
              }}
              className="w-full bg-transparent border border-[var(--app-border)]/30 text-slate-300 hover:border-cyan-400 hover:text-cyan-400 py-2.5 rounded font-headline text-[10px] font-bold tracking-widest uppercase transition-colors flex justify-center items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recalibrate
            </button>
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
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/30">CORE</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">QCS-401</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                    Alignment: {simulatedValues.alignment}%
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--app-text)] mb-1.5">Advanced Quantum Algorithms</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    <strong>Why it fits:</strong> This module directly bridges your recent high performance in Linear Algebra with your stated goal of Quantum Cryptography. Historically, students with your profile achieve an A- average in this specific curriculum.
                  </p>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-400 uppercase tracking-widest mb-1.5">
                      <span>Cognitive Load / Difficulty</span>
                      <span className="text-[var(--app-text)] font-semibold">High (4.2/5)</span>
                    </div>
                    <div className="h-1 w-full bg-[var(--app-surface)] rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full w-[84%] shadow-[0_0_8px_rgba(0,229,255,0.4)]"></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-[9px] text-slate-400 uppercase tracking-widest">
                    <span>Prerequisite Strength</span>
                    <span className="text-teal-400 font-semibold">Optimal</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[var(--app-border)]/10">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[var(--app-surface)] flex items-center justify-center text-[8px] font-bold text-cyan-400 font-headline">AV</div>
                    <span className="text-[10px] text-slate-400 font-headline">Prof. A. Vance</span>
                  </div>
                  <button className="text-[9px] text-cyan-400 font-headline uppercase font-semibold hover:text-cyan-300 transition-colors">
                    View Syllabus
                  </button>
                </div>
              </div>

              {/* Rec Card 2 */}
              <div className="bg-[var(--app-card)]/60 rounded-xl p-5 border border-[var(--app-border)]/20 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 text-[9px] font-bold tracking-widest uppercase">
                    <span className="px-2 py-0.5 rounded bg-yellow-950/40 text-yellow-400 border border-yellow-800/30">ELECTIVE</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">ETH-210</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">82%</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--app-text)] mb-1.5">AI Ethics &amp; Policy</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Provides a necessary philosophical framework required for leadership roles in AI governance.
                  </p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[var(--app-border)]/10">
                  <div className="text-[9px] text-slate-400">
                    DIFFICULTY: <span className="text-green-400">Low (2.1/5)</span>
                  </div>
                  <button 
                    onClick={() => toggleMatrix("ETH-210")}
                    className={`text-[9px] font-headline font-bold uppercase tracking-widest transition-colors ${
                      matrixList.includes("ETH-210") ? "text-teal-400" : "text-slate-400 hover:text-[var(--app-text)]"
                    }`}
                  >
                    {matrixList.includes("ETH-210") ? "ADDED" : "ADD TO MATRIX"}
                  </button>
                </div>
              </div>

              {/* Rec Card 3 */}
              <div className="bg-[var(--app-card)]/60 rounded-xl p-5 border border-[var(--app-border)]/20 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex gap-2 text-[9px] font-bold tracking-widest uppercase">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/30">CORE</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">DAT-305</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">89%</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--app-text)] mb-1.5">Neural Network Arch.</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Essential prerequisite for Senior year project. Warning: Schedule conflict with QCS-401.
                  </p>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[var(--app-border)]/10">
                  <div className="text-[9px] text-slate-400">
                    DIFFICULTY: <span className="text-yellow-500">Med-High (3.8/5)</span>
                  </div>
                  <button 
                    onClick={() => toggleMatrix("DAT-305")}
                    className={`text-[9px] font-headline font-bold uppercase tracking-widest transition-colors ${
                      matrixList.includes("DAT-305") ? "text-teal-400" : "text-slate-400 hover:text-[var(--app-text)]"
                    }`}
                  >
                    {matrixList.includes("DAT-305") ? "ADDED" : "ADD TO MATRIX"}
                  </button>
                </div>
              </div>

            </div>
          </section>
        </div>
      </main>
      )}

      {/* Footer copyright notice from mockup */}
      <footer className="border-t border-[var(--app-border)]/10 bg-[var(--app-bg)]/50 py-4 px-6 text-[10px] text-slate-500 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
          Matrix adapts in real-time as new performance data becomes available. Last updated: May 15, 2025 10:42 AM
        </div>
        <div>
          MCP ORCHESTRA SYSTEM V1.0.4
        </div>
      </footer>
    </div>
  );
}
