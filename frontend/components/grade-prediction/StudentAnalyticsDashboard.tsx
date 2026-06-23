"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Bell,
  Settings as SettingsIcon,
  TrendingUp,
  TrendingDown,
  Play,
  Edit2,
  Info
} from "lucide-react";
import type { SGPAPredictionResponse, SGPAPredictionInput } from "@/lib/api/predictions";

interface StudentAnalyticsDashboardProps {
  /** Live SGPA prediction result. The dashboard renders against this. */
  prediction: SGPAPredictionResponse;
  /** The submitted inputs that produced the prediction (manual mode). Optional:
   *  CSV mode supplies only the prediction, so every cell falls back to the
   *  values echoed inside the prediction's contributing factors. */
  input?: SGPAPredictionInput;
}

// Pull the original numeric value of a contributing factor by feature name.
function factorValue(prediction: SGPAPredictionResponse, feature: string): number | null {
  const f = prediction.contributing_factors.find(
    (c) => c.feature.toLowerCase() === feature.toLowerCase(),
  );
  return f && typeof f.value === "number" ? f.value : null;
}

export function StudentAnalyticsDashboard({ prediction, input }: StudentAnalyticsDashboardProps) {
  // ── The "subject" cards have no per-subject model output, so we drive them
  //    entirely from the real contributing factors (feature, submitted value,
  //    SHAP impact) so every card refreshes with each prediction instead of
  //    showing fixed demo courses. ────────────────────────────────────────────
  const factorCards = useMemo(() => {
    const factors = prediction.contributing_factors;
    const maxImpact = Math.max(...factors.map((f) => Math.abs(f.impact_score)), 0.0001);
    return factors.map((f, i) => {
      const strength = Math.abs(f.impact_score) / maxImpact;
      const trend: "up" | "stable" | "down" = strength >= 0.66 ? "up" : strength >= 0.33 ? "stable" : "down";
      const valueText = typeof f.value === "number" ? Number(f.value).toFixed(2) : String(f.value);
      return {
        id: i + 1,
        name: f.feature,
        code: `IMPACT ${f.impact_score.toFixed(3)}`,
        value: valueText,
        impactPct: Math.round(strength * 100),
        trend,
        warning: trend === "down",
      };
    });
  }, [prediction]);
  // Baseline (current) SGPA comes straight from the prediction inputs.
  const currentSgpa = factorValue(prediction, "Previous SGPA") ?? prediction.predicted_sgpa;
  const basePredicted = prediction.predicted_sgpa;

  // Simulator Tuning States — seeded from the user's actual submitted inputs (or
  // the values echoed in the prediction's contributing factors) so "what-if"
  // starts exactly where this prediction was made.
  const [attendanceRate, setAttendanceRate] = useState<number>(
    () => Math.round(input?.Attendance_Rate ?? factorValue(prediction, "Attendance Rate") ?? 92),
  );
  const [studyHours, setStudyHours] = useState<number>(
    () => Math.round((input?.Study_Hours_Per_Day ?? factorValue(prediction, "Study Hours Per Day") ?? 4) * 4),
  );
  const [simulationActive, setSimulationActive] = useState(false);

  // Editable Model Baseline Parameters — every value comes from the actual input
  // (manual mode) or the prediction's contributing factors (CSV mode).
  const [sscGpa, setSscGpa] = useState<number>(() => input?.SSC_GPA ?? factorValue(prediction, "SSC GPA") ?? currentSgpa);
  const [hscGpa, setHscGpa] = useState<number>(() => input?.HSC_GPA ?? factorValue(prediction, "HSC GPA") ?? currentSgpa);
  const [familyIncome, setFamilyIncome] = useState<number>(() => input?.Family_Income_BDT ?? factorValue(prediction, "Family Income") ?? 0);
  const [partTimeHours, setPartTimeHours] = useState<number>(() => input?.Part_Time_Hours ?? factorValue(prediction, "Part-Time Hours") ?? 0);
  const [participation, setParticipation] = useState<string>(() => input?.Active_Participation ?? "—");
  const [prevSemesterSgpa, setPrevSemesterSgpa] = useState<number>(() => input?.Previous_SGPA ?? currentSgpa);
  const [editingParams, setEditingParams] = useState(false);

  // Confidence is derived from the risk band the model assigned (regression model
  // has no native probability). Clearly explainable mapping.
  const riskLower = prediction.risk_level.toLowerCase();
  const baseConfidence = riskLower.includes("high")
    ? 62
    : riskLower.includes("mod") || riskLower.includes("mid")
      ? 79
      : 93;

  // Simulator Calculus — anchored on the real predicted SGPA; sliders nudge it.
  const simulatedValues = useMemo(() => {
    // Deltas relative to the prediction's own attendance / study hours.
    const attImpact = (attendanceRate - (factorValue(prediction, "Attendance Rate") ?? 92)) * 0.015;
    const studyImpact = (studyHours - (factorValue(prediction, "Study Hours Per Day") ?? 4) * 4) * 0.02;

    const rawSim = basePredicted + attImpact + studyImpact;
    const predicted = Math.min(4.0, Math.max(0.0, Number(rawSim.toFixed(2))));

    const primaryConfidence = Math.min(99.9, Math.max(50.0, baseConfidence + attImpact * 5 + studyImpact * 4));

    return {
      predicted,
      confidence: primaryConfidence.toFixed(1),
      risk: prediction.risk_level,
      riskColor: predicted >= 3.5 ? "text-cyan-400 bg-cyan-950/40 border-cyan-800/30" : predicted >= 3.0 ? "text-yellow-400 bg-yellow-950/40 border-yellow-800/30" : "text-red-400 bg-red-950/40 border-red-800/30",
      predicted2: predicted,
    };
  }, [attendanceRate, studyHours, basePredicted, baseConfidence, prediction]);

  return (
    <div className="w-full bg-[var(--app-bg)] text-[var(--app-text)] min-h-screen font-body selection:bg-cyan-500/30 selection:text-cyan-200 space-y-8 pb-24">
      
      {/* Top Bar Navigation Mockup matching layout */}
      <header className="flex justify-between items-center w-full pb-4 border-b border-[var(--app-border)]/10">
        {/* Search */}
        <div className="flex items-center bg-[var(--app-card)] rounded px-4 py-2 w-64 border border-[var(--app-border)]/20 focus-within:border-cyan-400 transition-all group">
          <Search className="text-slate-400 text-sm mr-2 group-focus-within:text-cyan-400 transition-colors w-4 h-4" />
          <input 
            className="bg-transparent border-none outline-none text-xs text-[var(--app-text)] w-full placeholder:text-slate-500 font-headline uppercase tracking-wider" 
            placeholder="QUERY ORCHESTRA..." 
            type="text"
          />
        </div>
        {/* Trailing Actions */}
        <div className="flex items-center gap-4">
          <button className="text-slate-400 hover:text-cyan-400 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
          </button>
          <button className="text-slate-400 hover:text-cyan-400 transition-colors">
            <SettingsIcon className="w-5 h-5" />
          </button>
          <div className="h-8 w-8 rounded-full bg-[var(--app-surface)] border border-[var(--app-border)]/30 overflow-hidden cursor-pointer opacity-80 hover:opacity-100 hover:scale-95 transition-all flex items-center justify-center">
            <span className="text-[10px] text-cyan-400 font-headline font-bold">OP</span>
          </div>
        </div>
      </header>

      {/* Main Top Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] text-cyan-400 font-headline tracking-[0.2em] uppercase">Predictive Analysis</span>
            <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${simulatedValues.riskColor}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
              {simulatedValues.risk}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-[var(--app-text)] tracking-tight">
            Grade Prediction
          </h1>
        </div>
        
        <div className="text-left md:text-right border-l-2 md:border-l-0 md:border-r-2 border-cyan-500/30 pl-4 md:pr-4">
          <p className="text-[10px] text-slate-400 font-headline tracking-[0.1em] uppercase mb-0.5">Model Confidence</p>
          <p className="text-2xl font-bold text-cyan-400 font-headline tracking-wide">{simulatedValues.confidence}%</p>
        </div>
      </div>

      {/* Primary Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* HERO CARD: GPA Forecast Graph (8 cols) */}
        <div className="lg:col-span-8 bg-[var(--app-surface)]/40 backdrop-blur-md rounded-xl p-6 md:p-8 relative overflow-hidden border border-[var(--app-border)]/20 shadow-[0_0_40px_-5px_rgba(195,245,255,0.04)] flex flex-col justify-between min-h-[380px]">
          
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_2px,#bac9cc_2px,#bac9cc_4px)]"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-slate-400 font-headline tracking-[0.1em] uppercase mb-0.5">Trajectory</p>
              <h3 className="text-lg md:text-xl font-bold text-[var(--app-text)] font-headline">Cumulative GPA Forecast</h3>
            </div>
            
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-headline tracking-[0.1em] uppercase mb-0.5">Current</p>
                <p className="text-lg font-bold text-[var(--app-text)] font-headline">{prevSemesterSgpa.toFixed(2)}</p>
              </div>
              <div className="w-px h-8 bg-[var(--app-border)]/50"></div>
              <div className="text-right">
                <p className="text-[9px] text-cyan-400 font-headline tracking-[0.1em] uppercase mb-0.5">Predicted</p>
                <p className="text-lg font-bold text-cyan-400 font-headline">{simulatedValues.predicted.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Dynamic SVG trajectory representation */}
          <div className="relative z-10 flex-1 flex items-end mt-4">
            <div className="w-full h-44 relative">
              <div className="absolute inset-0 flex flex-col justify-between opacity-10">
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
              </div>

              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path 
                  d="M0,80 L25,75 L50,60 L65,52" 
                  fill="none" 
                  stroke="rgba(68, 216, 241, 0.4)" 
                  strokeWidth="2" 
                  vectorEffect="non-scaling-stroke"
                />
                <path 
                  d={`M65,52 L80,${70 - (simulatedValues.predicted - 3.0) * 40} L100,${60 - (simulatedValues.predicted - 3.0) * 50}`}
                  fill="none" 
                  stroke="#00e5ff" 
                  strokeDasharray="4,4" 
                  strokeWidth="2.5" 
                  vectorEffect="non-scaling-stroke"
                />
                <path 
                  d={`M65,52 L80,${70 - (simulatedValues.predicted - 3.0) * 40} L100,${60 - (simulatedValues.predicted - 3.0) * 50}`}
                  fill="none" 
                  filter="blur(4px)" 
                  opacity="0.25" 
                  stroke="#00e5ff" 
                  strokeWidth="8" 
                  vectorEffect="non-scaling-stroke"
                />
                <circle cx="65" cy="52" fill="#101416" r="3" stroke="#44d8f1" strokeWidth="1.5" vectorEffect="non-scaling-stroke"></circle>
                <circle cx="100" cy={`${60 - (simulatedValues.predicted - 3.0) * 50}`} fill="#00e5ff" r="3.5" vectorEffect="non-scaling-stroke"></circle>
                <circle className="animate-pulse" cx="100" cy={`${60 - (simulatedValues.predicted - 3.0) * 50}`} fill="#00e5ff" opacity="0.2" r="10" vectorEffect="non-scaling-stroke"></circle>
              </svg>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4 text-[9px] text-slate-400 font-headline uppercase tracking-widest relative z-10 pt-2 border-t border-[var(--app-border)]/10">
            <span>Q1</span>
            <span>Q2</span>
            <span className="text-[#44d8f1]">Current</span>
            <span>Q3</span>
            <span>Q4 (Proj)</span>
          </div>
        </div>

        {/* IMPACT FACTORS (4 cols) */}
        <div className="lg:col-span-4 bg-[var(--app-card)]/60 rounded-xl p-6 relative flex flex-col border border-[var(--app-border)]/20 justify-between">
          <div>
            <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase mb-0.5">Impact Factors</h3>
            <p className="text-[11px] text-slate-400 mb-6">Variables driving the prediction</p>
            
            <div className="space-y-4">
              {(() => {
                const maxImpact = Math.max(
                  ...prediction.contributing_factors.map((f) => Math.abs(f.impact_score)),
                  0.0001,
                );
                return prediction.contributing_factors.map((f) => {
                  const positive = f.impact_score >= 0;
                  const pct = Math.min(100, Math.max(8, (Math.abs(f.impact_score) / maxImpact) * 100));
                  return (
                    <div key={f.feature}>
                      <div className="flex justify-between text-[11px] mb-1.5">
                        <span className="text-slate-300 font-medium font-headline tracking-wider uppercase">
                          {f.feature}
                        </span>
                        <span className={`font-bold font-headline ${positive ? "text-cyan-400" : "text-yellow-500"}`}>
                          {positive ? "+" : "−"}
                          {Math.abs(f.impact_score).toFixed(3)}
                          <span className="ml-1 text-slate-500">
                            ({typeof f.value === "number" ? f.value : f.value})
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--app-surface2)]/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${positive ? "bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.4)]" : "bg-yellow-500"}`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          <button 
            onClick={() => {
              const target = document.getElementById("simulator-section");
              target?.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-6 w-full py-2.5 px-4 bg-gradient-to-r from-cyan-400 to-[#44d8f1] rounded text-[#101416] font-headline text-[10px] font-bold tracking-[0.15em] uppercase hover:opacity-90 transition-opacity flex justify-center items-center gap-2"
          >
            SIMULATE VARIABLES
          </button>
        </div>
      </div>

      {/* PREDICTIVE INTEL PANEL */}
      <div className="border border-[var(--app-border)]/20 bg-[var(--app-card)]/20 rounded-xl p-6 md:p-8 space-y-6">
        <div className="border-b border-[var(--app-border)]/10 pb-4">
          <h2 className="text-[10px] text-cyan-400 font-headline tracking-[0.2em] uppercase mb-1">Predictive Intel</h2>
          <p className="text-xs text-slate-400 font-headline uppercase tracking-wider">Trajectory Analysis &amp; Impact Diagnostics</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Sub-card: Cumulative GPA Forecast */}
          <div className="xl:col-span-2 bg-[var(--app-card2)]/80 border border-[var(--app-border)]/15 rounded-xl p-6 relative overflow-hidden flex flex-col min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/10"></div>
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_2px,#bac9cc_2px,#bac9cc_4px)]"></div>
            
            <div className="flex justify-between items-start mb-6 z-10">
              <div>
                <h3 className="font-headline text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cumulative GPA Forecast</h3>
                <div className="flex items-end gap-3">
                  <span className="font-headline text-5xl font-bold text-[var(--app-text)]">{simulatedValues.predicted2.toFixed(2)}</span>
                  <div className={`pb-1.5 flex items-center gap-0.5 ${simulatedValues.predicted2 >= currentSgpa ? "text-cyan-400" : "text-yellow-500"}`}>
                    {simulatedValues.predicted2 >= currentSgpa ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    <span className="font-headline text-xs font-semibold">
                      {simulatedValues.predicted2 >= currentSgpa ? "+" : ""}
                      {(simulatedValues.predicted2 - currentSgpa).toFixed(2)} Projected
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="block font-headline text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Current Baseline</span>
                <span className="font-headline text-xl text-slate-300">{currentSgpa.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex-1 min-h-[160px] relative w-full mt-4 z-10">
              <div className="absolute inset-0 flex flex-col justify-between opacity-5">
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
                <div className="w-full h-px bg-white"></div>
              </div>

              <svg className="w-full h-full absolute inset-0 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                <path d="M 0 180 C 200 170, 300 190, 500 120" fill="none" stroke="#3b494c" strokeDasharray="6,6" strokeWidth="2"></path>
                <path d={`M 500 120 C 700 ${140 - (simulatedValues.predicted2 - 3.0) * 60}, 850 ${120 - (simulatedValues.predicted2 - 3.0) * 80}, 1000 ${100 - (simulatedValues.predicted2 - 3.0) * 100}`} fill="none" filter="url(#glow)" stroke="url(#primaryGradient)" strokeWidth="3"></path>
                <defs>
                  <linearGradient id="primaryGradient" x1="0%" x2="100%" y1="0%" y2="0%">
                    <stop offset="0%" stopColor="#44d8f1"></stop>
                    <stop offset="100%" stopColor="#00e5ff"></stop>
                  </linearGradient>
                  <filter height="140%" id="glow" width="140%" x="-20%" y="-20%">
                    <feGaussianBlur result="blur" stdDeviation="6"></feGaussianBlur>
                    <feComposite in="SourceGraphic" in2="blur" operator="over"></feComposite>
                  </filter>
                </defs>
                <circle cx="500" cy="120" fill="#101416" r="5" stroke="#44d8f1" strokeWidth="2.5"></circle>
                <circle cx="1000" cy={`${100 - (simulatedValues.predicted2 - 3.0) * 100}`} fill="#00e5ff" filter="url(#glow)" r="6"></circle>
              </svg>

              <div className="absolute -bottom-1 w-full flex justify-between font-headline text-[9px] text-slate-500 uppercase tracking-widest">
                <span>Q1</span>
                <span>Q2</span>
                <span className="text-cyan-400">Current</span>
                <span>Q3</span>
                <span>Q4 (Proj)</span>
              </div>
            </div>
          </div>

          {/* Right Sub-card: Primary Impact Factors */}
          <div className="bg-[var(--app-card2)]/80 border border-[var(--app-border)]/15 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-headline text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Primary Impact Factors</h3>
              
              <div className="space-y-5">
                {(() => {
                  const maxImpact = Math.max(
                    ...prediction.contributing_factors.map((f) => Math.abs(f.impact_score)),
                    0.0001,
                  );
                  return prediction.contributing_factors.map((f) => {
                    const positive = f.impact_score >= 0;
                    const pct = Math.round(Math.min(100, Math.max(8, (Math.abs(f.impact_score) / maxImpact) * 100)));
                    return (
                      <div key={f.feature}>
                        <div className="flex justify-between items-end mb-1">
                          <span className="text-xs text-slate-200">{f.feature}</span>
                          <span className={`font-headline text-sm font-semibold ${positive ? "text-cyan-400" : "text-yellow-500"}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[var(--app-surface2)]/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${positive ? "bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.6)]" : "bg-yellow-500"}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        {!positive && (
                          <p className="mt-2 text-[9px] text-yellow-500/80 font-headline uppercase tracking-wider flex items-center gap-1">
                            <Info className="w-3 h-3" /> Potential Drag Factor
                          </p>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--app-border)]/10 text-[10px] text-slate-400 font-mono">
              SGPA {basePredicted.toFixed(2)} · {prediction.risk_level.toUpperCase()} · {prediction.contributing_factors.length} FACTORS
            </div>
          </div>
        </div>

        {/* Granular Subject Diagnostics */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4 border-b border-[var(--app-border)]/10 pb-2">
            <h3 className="font-headline text-xs font-bold text-[var(--app-text)] uppercase tracking-wider">Granular Subject Diagnostics</h3>
            <button className="text-[9px] font-headline text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-1">
              View Matrix <span className="text-xs">→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {factorCards.map((subject) => (
              <div key={subject.id} className="bg-[var(--app-card2)]/60 border border-[var(--app-border)]/15 rounded-xl p-4 flex flex-col justify-between hover:bg-[var(--app-card)]/80 transition-colors">
                <div>
                  <h4 className="font-headline text-sm text-[var(--app-text)] font-medium truncate mb-0.5">{subject.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-6">{subject.code}</p>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Value</span>
                    <span className="font-headline text-sm text-[var(--app-text)] font-bold">{subject.value}</span>
                  </div>

                  {subject.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  ) : subject.trend === "down" ? (
                    <TrendingDown className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <span className="text-xs text-slate-500 font-bold">→</span>
                  )}

                  <div className="text-right">
                    <span className="block text-[8px] text-cyan-400 uppercase tracking-wider mb-0.5 font-headline">Impact</span>
                    <span className={`font-headline text-sm font-bold ${subject.trend === "down" ? "text-yellow-500" : "text-cyan-400"}`}>
                      {subject.impactPct}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SUBJECT LEVEL BREAKDOWN */}
      <div>
        <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
          Subject Level Breakdown
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {factorCards.map((subject) => (
            <div
              key={subject.id}
              className={`bg-[#0b0f11]/80 rounded-xl p-5 flex flex-col justify-between border relative overflow-hidden transition-all duration-300 ${
                subject.warning
                  ? "border-yellow-500/20 hover:border-yellow-500/40"
                  : "border-[var(--app-border)]/10 hover:border-[var(--app-border)]/30 hover:bg-[var(--app-card2)]/60"
              }`}
            >
              {subject.warning && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mb-0.5">{subject.code}</p>
                  <h4 className="text-sm font-medium text-[var(--app-text)]">{subject.name}</h4>
                </div>
                <span className="text-xs font-mono text-cyan-400">⚡</span>
              </div>

              <div className="flex justify-between items-end mt-4">
                <div>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Value</p>
                  <p className="text-base text-slate-300 font-headline">{subject.value}</p>
                </div>

                <div className="flex flex-col items-center justify-center px-4">
                  <span className={`text-xs font-bold ${subject.warning ? "text-yellow-500" : "text-cyan-400"}`}>→</span>
                </div>

                <div className="text-right">
                  <p className={`text-[8px] uppercase tracking-wider mb-0.5 ${subject.warning ? "text-yellow-500" : "text-cyan-400"}`}>Impact</p>
                  <p className={`text-lg font-bold font-headline drop-shadow-[0_0_8px_rgba(0,229,255,0.4)] ${subject.warning ? "text-yellow-500" : "text-cyan-400"}`}>
                    {subject.impactPct}%
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SIMULATOR & MODEL PARAMETERS GRID */}
      <div id="simulator-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        
        {/* WHAT-IF SIMULATOR */}
        <div className="lg:col-span-6 bg-[var(--app-surface)]/30 border border-[var(--app-border)]/20 rounded-xl p-6 md:p-8 relative flex flex-col justify-between">
          <div className="mb-6 flex justify-between items-center border-b border-[var(--app-border)]/10 pb-3">
            <div>
              <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase mb-0.5">What-If Simulator</h3>
              <p className="text-[11px] text-slate-400">Adjust variables to see impact</p>
            </div>
            <span className="text-cyan-400 text-xs font-mono">⚡ LIVE</span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[11px] mb-2 font-headline uppercase tracking-wider">
                <span className="text-slate-300">Attendance Rate</span>
                <span className="text-cyan-400 font-bold">{attendanceRate}%</span>
              </div>
              <input 
                className="w-full accent-cyan-400 bg-[var(--app-card2)] h-1.5 rounded-lg appearance-none cursor-pointer" 
                max="100" 
                min="50" 
                type="range" 
                value={attendanceRate}
                onChange={(e) => setAttendanceRate(Number(e.target.value))}
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-2 font-headline uppercase tracking-wider">
                <span className="text-slate-300">Weekly Study Hours</span>
                <span className="text-cyan-400 font-bold">{studyHours} hrs</span>
              </div>
              <input 
                className="w-full accent-cyan-400 bg-[var(--app-card2)] h-1.5 rounded-lg appearance-none cursor-pointer" 
                max="40" 
                min="0" 
                type="range" 
                value={studyHours}
                onChange={(e) => setStudyHours(Number(e.target.value))}
              />
            </div>
          </div>

          <button 
            onClick={() => {
              setSimulationActive(true);
              setTimeout(() => setSimulationActive(false), 800);
            }}
            className={`mt-8 w-full py-2.5 px-4 bg-cyan-950/20 border border-cyan-500/20 text-cyan-400 rounded font-headline text-[10px] font-bold tracking-[0.15em] uppercase hover:bg-cyan-950/40 hover:border-cyan-500/40 transition-all flex justify-center items-center gap-2 ${
              simulationActive ? "animate-pulse" : ""
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            {simulationActive ? "Recalculating..." : "Run Simulation"}
          </button>
        </div>

        {/* MODEL PARAMETERS */}
        <div className="lg:col-span-6 bg-[var(--app-card2)]/60 border border-[var(--app-border)]/20 rounded-xl p-6 md:p-8 flex flex-col justify-between">
          <div className="mb-6 flex justify-between items-center border-b border-[var(--app-border)]/10 pb-3">
            <div>
              <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase mb-0.5">Model Parameters</h3>
              <p className="text-[11px] text-slate-400">Baseline inputs for prediction</p>
            </div>
            <button 
              onClick={() => setEditingParams(!editingParams)}
              className="text-slate-400 hover:text-cyan-400 transition-colors text-[10px] font-headline tracking-widest uppercase flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              {editingParams ? "Done" : "Edit"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-[var(--app-surface)]/30 p-3 rounded-lg border border-[var(--app-border)]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">SSC GPA</p>
              {editingParams ? (
                <input 
                  type="number" 
                  step="0.01" 
                  className="bg-[var(--app-bg)] border border-[var(--app-border)]/30 text-[var(--app-text)] text-xs p-1 rounded w-full"
                  value={sscGpa} 
                  onChange={(e) => setSscGpa(Number(e.target.value))}
                />
              ) : (
                <p className="text-xs font-bold text-[var(--app-text)]">{sscGpa.toFixed(2)}</p>
              )}
            </div>

            <div className="bg-[var(--app-surface)]/30 p-3 rounded-lg border border-[var(--app-border)]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">HSC GPA</p>
              {editingParams ? (
                <input 
                  type="number" 
                  step="0.01" 
                  className="bg-[var(--app-bg)] border border-[var(--app-border)]/30 text-[var(--app-text)] text-xs p-1 rounded w-full"
                  value={hscGpa} 
                  onChange={(e) => setHscGpa(Number(e.target.value))}
                />
              ) : (
                <p className="text-xs font-bold text-[var(--app-text)]">{hscGpa.toFixed(2)}</p>
              )}
            </div>

            <div className="bg-[var(--app-surface)]/30 p-3 rounded-lg border border-[var(--app-border)]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">Family Income (BDT)</p>
              {editingParams ? (
                <input
                  type="number"
                  className="bg-[var(--app-bg)] border border-[var(--app-border)]/30 text-[var(--app-text)] text-xs p-1 rounded w-full"
                  value={familyIncome}
                  onChange={(e) => setFamilyIncome(Number(e.target.value))}
                />
              ) : (
                <p className="text-xs font-bold text-[var(--app-text)]">{familyIncome.toLocaleString()}</p>
              )}
            </div>

            <div className="bg-[var(--app-surface)]/30 p-3 rounded-lg border border-[var(--app-border)]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">Part-Time Hrs/Wk</p>
              {editingParams ? (
                <input
                  type="number"
                  className="bg-[var(--app-bg)] border border-[var(--app-border)]/30 text-[var(--app-text)] text-xs p-1 rounded w-full"
                  value={partTimeHours}
                  onChange={(e) => setPartTimeHours(Number(e.target.value))}
                />
              ) : (
                <p className="text-xs font-bold text-[var(--app-text)]">{partTimeHours}</p>
              )}
            </div>

            <div className="bg-[var(--app-surface)]/30 p-3 rounded-lg border border-[var(--app-border)]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">Active Participation</p>
              {editingParams ? (
                <input
                  type="text"
                  className="bg-[var(--app-bg)] border border-[var(--app-border)]/30 text-[var(--app-text)] text-xs p-1 rounded w-full"
                  value={participation}
                  onChange={(e) => setParticipation(e.target.value)}
                />
              ) : (
                <p className="text-xs font-bold text-[var(--app-text)]">{participation}</p>
              )}
            </div>

            <div className="bg-[var(--app-surface)]/30 p-3 rounded-lg border border-[var(--app-border)]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">Previous Semester</p>
              {editingParams ? (
                <input 
                  type="number" 
                  step="0.01" 
                  className="bg-[var(--app-bg)] border border-[var(--app-border)]/30 text-[var(--app-text)] text-xs p-1 rounded w-full"
                  value={prevSemesterSgpa} 
                  onChange={(e) => setPrevSemesterSgpa(Number(e.target.value))}
                />
              ) : (
                <p className="text-xs font-bold text-[var(--app-text)]">{prevSemesterSgpa.toFixed(2)} SGPA</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
