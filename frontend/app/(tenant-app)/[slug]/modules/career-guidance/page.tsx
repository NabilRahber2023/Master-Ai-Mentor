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
import { CareerPredictionPanel } from "@/components/modules/live-prediction/career-prediction-panel";
import { ModeSwitch } from "@/components/modules/csv-mode/mode-switch";
import { CsvModePanel } from "@/components/modules/csv-mode/csv-mode-panel";
import type { CareerPredictionResponse, CareerPredictionRequest } from "@/lib/api/predictions";
import {
  Radar,
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { 
  Search, 
  Bell, 
  Settings, 
  TrendingUp, 
  Code, 
  Terminal, 
  Database, 
  Shield, 
  Brain, 
  Sparkles, 
  ChevronRight, 
  CheckCircle2, 
  Circle,
  Lightbulb,
  Zap,
  Briefcase,
  Compass,
  GraduationCap,
  Hammer
} from "lucide-react";

// Types
interface Competency {
  name: string;
  current: number;
  target: number;
  critical: boolean;
}

interface CareerPath {
  name: string;
  match: number;
  growth: string;
  demand: string;
  icon: any;
}

interface LearningModule {
  name: string;
  duration: string;
  desc: string;
  completed: boolean;
}

// ── Derivation helpers: turn the live career prediction + its inputs into every
//    section's data, so the whole dashboard updates from each prediction. ──────
interface CareerSkills {
  prog: number; math: number; comm: number; crea: number; prob: number;
  lead: number; resi: number; pub: number; cgpa: number; intern: number;
  proj: number; extra: number;
}

const clampN = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const pct10 = (v: number) => Math.round(clampN(v, 0, 10) * 10);

function skillsFromInputs(inp: CareerPredictionRequest | null): CareerSkills {
  return {
    prog: inp?.Programming_Skill ?? 5,
    math: inp?.Math_Skill ?? 5,
    comm: inp?.Communication_Skill ?? 5,
    crea: inp?.Creativity_Score ?? 5,
    prob: inp?.Problem_Solving ?? 5,
    lead: inp?.Leadership_Score ?? 5,
    resi: inp?.Research_Interest ?? 5,
    pub: inp?.Public_Speaking ?? 5,
    cgpa: inp?.CGPA ?? 3,
    intern: inp?.Internship_Experience_Months ?? 0,
    proj: inp?.Projects_Completed ?? 0,
    extra: inp?.Extracurriculars ?? 0,
  };
}

function competenciesFromSkills(s: CareerSkills): Competency[] {
  const mk = (name: string, cur: number): Competency => ({
    name, current: cur, target: Math.min(100, cur + 18), critical: cur < 50,
  });
  return [
    mk("Algorithmic Complexity", pct10(s.prog)),
    mk("Distributed Systems", pct10((s.prob + s.prog) / 2)),
    mk("Machine Learning Ops", pct10((s.resi + s.math) / 2)),
    mk("System Design", pct10((s.prog + s.prob) / 2)),
  ];
}

function learningFromSkills(s: CareerSkills): LearningModule[] {
  const axes = [
    { v: pct10((s.prog + s.prob) / 2), mod: { name: "Advanced System Design", duration: "4-6 Weeks", desc: "Deepen architectural thinking and scalability concepts" } },
    { v: pct10(s.comm), mod: { name: "Technical Communication & Influence", duration: "3-4 Weeks", desc: "Sharpen written and verbal communication for technical leadership" } },
    { v: pct10(s.lead), mod: { name: "Technical Leadership", duration: "3-4 Weeks", desc: "Mentorship, team scaling, and technical decision making" } },
    { v: pct10(s.prob), mod: { name: "Advanced Problem Solving & DSA", duration: "5-7 Weeks", desc: "Master algorithms and complex problem decomposition" } },
    { v: pct10((s.resi + s.math) / 2), mod: { name: "Applied ML & Research Methods", duration: "6-8 Weeks", desc: "Model building, evaluation, and research rigor" } },
  ];
  return axes.sort((a, b) => a.v - b.v).slice(0, 4).map((a) => ({ ...a.mod, completed: false }));
}

export default function CareerGuidancePage() {
  // Competency state (connected to sliders)
  const [competencies, setCompetencies] = useState<Competency[]>([
    { name: "Algorithmic Complexity", current: 75, target: 90, critical: false },
    { name: "Distributed Systems", current: 40, target: 80, critical: true },
    { name: "Machine Learning Ops", current: 60, target: 70, critical: false },
    { name: "System Design", current: 55, target: 85, critical: false },
  ]);

  // Selected timeline node (0 = now, 1 = +2Y, 2 = +5Y, 3 = +10Y)
  const [activeTimeline, setActiveTimeline] = useState<number>(1); // default "+2 Years"

  // Learning journey module states
  const [learningModules, setLearningModules] = useState<LearningModule[]>([
    { name: "Advanced System Design", duration: "4-6 Weeks", desc: "Deepen architectural thinking and scalability concepts", completed: true },
    { name: "Distributed Systems Mastery", duration: "6-8 Weeks", desc: "Master microservices, caching, and event-driven systems", completed: false },
    { name: "Cloud Native Architecture", duration: "4-5 Weeks", desc: "Learn Kubernetes, serverless & cloud patterns", completed: false },
    { name: "Technical Leadership", duration: "3-4 Weeks", desc: "Mentorship, team scaling, and technical decision making", completed: false },
  ]);

  // Search query
  const [searchQuery, setSearchQuery] = useState("");

  // Target recommendations selection
  const [selectedCareer, setSelectedCareer] = useState<string>("Staff Software Engineer");

  // Input source: manual form vs. uploaded CSV.
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  // Live ML evaluation result + the inputs it was computed from. Together these
  // drive every section of the dashboard below.
  const [livePrediction, setLivePrediction] = useState<CareerPredictionResponse | null>(null);
  const [liveInputs, setLiveInputs] = useState<CareerPredictionRequest | null>(null);

  const handleLiveResult = (result: CareerPredictionResponse, inputs?: CareerPredictionRequest) => {
    setLivePrediction(result);
    setSelectedCareer(result.predicted_career);
    const inp = inputs ?? null;
    setLiveInputs(inp);
    // Seed the interactive panels (competency sliders + learning path) from the
    // real prediction inputs so they reflect this candidate, not static demo data.
    const skills = skillsFromInputs(inp);
    setCompetencies(competenciesFromSkills(skills));
    setLearningModules(learningFromSkills(skills));
  };

  const handleLiveReset = () => {
    setLivePrediction(null);
    setLiveInputs(null);
  };

  // Handle slide updates
  const handleSliderChange = (index: number, val: number) => {
    const updated = [...competencies];
    updated[index].current = val;
    // Recalculate Distributed Systems criticality (below 50 is critical)
    if (updated[index].name === "Distributed Systems") {
      updated[index].critical = val < 50;
    }
    setCompetencies(updated);
  };

  // Everything below is derived from the live prediction + the inputs it ran on,
  // so every section refreshes with each new prediction.
  const careerEngineData = useMemo(() => {
    const s = skillsFromInputs(liveInputs);
    const conf = livePrediction ? livePrediction.confidence_score : 0;
    const clampPct = (v: number) => Math.max(5, Math.min(99, Math.round(v)));

    // Industry alignment matrix — derived from the actual skill vector.
    const seMatch = clampPct(s.prog * 5 + s.prob * 3 + Math.min(s.proj, 10) + 10);
    const dsMatch = clampPct(s.math * 5 + s.prog * 2.5 + s.resi * 2 + 8);
    const prodMatch = clampPct(s.comm * 5 + s.lead * 3 + s.crea * 2 + 8);
    const cloudMatch = clampPct(s.prog * 4 + s.prob * 2 + s.intern * 3 + 8);

    // Telemetry — readiness is the model confidence; the rest are skill-driven.
    const careerReadiness = Math.round(conf * 100);
    const marketDemand = clampPct(55 + s.prog * 2 + s.proj * 1.5 + s.resi * 0.8);
    const futureGrowth = clampPct(58 + s.resi * 2.2 + s.math * 1.4);
    const automationRisk = Math.max(5, Math.round(62 - s.prob * 3 - s.lead * 2 - s.crea * 1.5));

    // Recommended careers — straight from the model.
    const recIcons = [Code, Compass, Briefcase, Database];
    const careers: CareerPath[] = livePrediction
      ? [
          {
            name: livePrediction.predicted_career,
            match: Math.round(conf * 100),
            growth: "Top Match",
            demand: "AI Predicted",
            icon: Code,
          },
          ...livePrediction.alternative_paths.map((p, i) => ({
            name: p.career,
            match: Math.round(p.probability * 100),
            growth: "Alternative",
            demand: "AI Predicted",
            icon: recIcons[(i + 1) % recIcons.length],
          })),
        ]
      : [];

    // Skill radar — current (from inputs) vs target.
    const radarData = [
      { subject: "Technical Depth", A: pct10((s.prog + s.math) / 2), B: 90, fullMark: 100 },
      { subject: "Problem Solving", A: pct10(s.prob), B: 85, fullMark: 100 },
      { subject: "System Design", A: pct10((s.prog + s.prob) / 2), B: 85, fullMark: 100 },
      { subject: "Communication", A: pct10(s.comm), B: 80, fullMark: 100 },
      { subject: "Leadership", A: pct10(s.lead), B: 80, fullMark: 100 },
    ];

    // Priority gaps derived from the radar deltas.
    const gaps = radarData
      .map((r) => {
        const gap = Math.max(0, r.B - r.A);
        return { name: r.subject, gap, status: gap > 25 ? "High" : gap > 10 ? "Medium" : "Low" };
      })
      .sort((a, b) => b.gap - a.gap);

    // Career trajectory sub-labels derived from the predicted role.
    const role = livePrediction?.predicted_career ?? "Professional";
    const trajectory = [
      "FOUNDATION",
      `Junior ${role}`,
      `Senior ${role}`,
      "Lead / Principal",
    ];

    // AI insight cards derived from the prediction + contributing factors.
    const topFactor = livePrediction?.contributing_factors?.[0];
    const topGap = gaps.find((g) => g.gap > 0);
    const secondGap = gaps.filter((g) => g.gap > 0)[1];
    const insights = {
      alignment: `High alignment with ${role} roles — model confidence ${Math.round(conf * 100)}%.`,
      velocity: topFactor
        ? `"${topFactor.feature}" (${topFactor.value}) is the strongest driver of this prediction.`
        : "Your strongest skills are driving this career match.",
      advantage: `Projected future-growth index of ${futureGrowth}% places this path among durable, in-demand roles.`,
      nextMove: topGap
        ? `Focus on ${topGap.name}${secondGap ? ` and ${secondGap.name}` : ""} to maximize outcomes.`
        : "Maintain your balanced profile and pursue stretch projects.",
    };

    // Industry alignment — ranked so the strongest match leads as the primary
    // vector, reflecting the predicted career's actual domain (not always SE).
    const aTags = ["PRIMARY VECTOR MATCH", "HIGH SYNERGY", "DEVELOPMENT REQUIRED", "SECONDARY SKILLSET"];
    const alignment = [
      { name: "Software Engineering", value: seMatch, icon: Code },
      { name: "Data & Analytics", value: dsMatch, icon: Database },
      { name: "Product & Strategy", value: prodMatch, icon: Compass },
      { name: "Operations & Infrastructure", value: cloudMatch, icon: Shield },
    ]
      .sort((a, b) => b.value - a.value)
      .map((r, i) => ({ ...r, tag: aTags[i], rank: i }));

    return {
      seMatch, dsMatch, prodMatch, cloudMatch,
      careerReadiness, marketDemand, futureGrowth, automationRisk,
      careers, radarData, gaps, trajectory, insights, alignment,
    };
  }, [livePrediction, liveInputs]);

  // Recalibrate competency sliders back to the values implied by the prediction inputs.
  const resetCompetencies = () => {
    setCompetencies(competenciesFromSkills(skillsFromInputs(liveInputs)));
  };

  // Regenerate the learning path from the current candidate's weakest skills.
  const handleGenerateLearningPath = () => {
    setLearningModules(learningFromSkills(skillsFromInputs(liveInputs)));
  };

  const toggleModuleCompletion = (idx: number) => {
    const updated = [...learningModules];
    updated[idx].completed = !updated[idx].completed;
    setLearningModules(updated);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--app-bg)] text-[var(--app-text)] font-body selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Header & Breadcrumb Container */}
      <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--app-border)]/10 px-6 bg-[var(--app-bg)] sticky top-0 z-50">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="font-headline text-slate-300 uppercase tracking-widest text-[10px]">
                Career Horizon Analysis
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00daf3]/5 rounded-full blur-[130px] pointer-events-none -translate-y-1/3 translate-x-1/4"></div>
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Input source</p>
          <ModeSwitch mode={mode} onChange={(m) => { setMode(m); handleLiveReset(); }} />
        </div>

        {mode === "manual" ? (
          <CareerPredictionPanel
            onResult={handleLiveResult}
            onReset={handleLiveReset}
          />
        ) : (
          <div className="relative z-10">
            <CsvModePanel
              module="career"
              label="Career Guidance"
              onSingleResult={(p, inp) => handleLiveResult(p as CareerPredictionResponse, inp as CareerPredictionRequest | undefined)}
              onSingleClear={handleLiveReset}
            />
          </div>
        )}

        {/* Fresh state: nothing shows until the user runs a prediction */}
        {!livePrediction && (
          <section className="rounded-xl border border-dashed border-[var(--app-border)]/30 bg-[var(--app-card2)]/40 p-12 text-center relative z-10">
            <p className="text-sm text-slate-400">
              Enter candidate attributes above and click{" "}
              <span className="font-semibold text-cyan-300">Predict Career</span> to populate
              the Career Horizon analysis.
            </p>
          </section>
        )}

        {/* The full dashboard only renders from a live prediction */}
        {livePrediction && (
          <>
            {/* Live result banner */}
            <section className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-5 relative z-10">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#101416]">
                  Live Prediction
                </span>
                <span className="text-2xl font-bold text-[var(--app-text)]">{livePrediction.predicted_career}</span>
                <span className="font-mono text-xs text-cyan-300">
                  {Math.round(livePrediction.confidence_score * 100)}% confidence
                </span>
              </div>
              {livePrediction.alternative_paths.length > 0 && (
                <p className="mt-2 text-[11px] text-slate-400">
                  Alternatives:{" "}
                  {livePrediction.alternative_paths
                    .map((p) => `${p.career} (${Math.round(p.probability * 100)}%)`)
                    .join(" · ")}
                </p>
              )}
            </section>

            {/* Impact Factors — real SHAP contributions from the career model */}
            {livePrediction.contributing_factors.length > 0 && (
              <section className="rounded-xl border border-[var(--app-border)]/20 bg-[var(--app-card)]/60 p-5 relative z-10">
                <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase mb-0.5">Impact Factors</h3>
                <p className="text-[11px] text-slate-400 mb-4">Variables driving the career prediction</p>
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

        {/* Hero Top Title & Search bar row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[var(--app-border)]/15 pb-4 gap-4 relative z-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-headline font-bold text-[var(--app-text)] tracking-tight uppercase flex items-center gap-3">
              {livePrediction?.predicted_career ?? "Career Horizon Analysis"}
            </h1>
            <p className="text-[10px] text-slate-400 font-headline uppercase tracking-[0.2em] mt-1">
              {livePrediction
                ? `PREDICTED CAREER · ${Math.round(livePrediction.confidence_score * 100)}% CONFIDENCE`
                : "PREDICTIVE VECTOR: 5-YEAR CINEMATIC PROJECTION"}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center bg-[var(--app-card)] rounded px-3 py-1.5 border border-[var(--app-border)]/20 focus-within:border-cyan-400 transition-all w-full md:w-72 group">
              <Search className="text-slate-400 w-4 h-4 mr-2 group-focus-within:text-cyan-400 transition-colors" />
              <input 
                className="bg-transparent border-none outline-none text-[11px] text-[var(--app-text)] w-full placeholder:text-slate-500 font-headline uppercase tracking-wider" 
                placeholder="Search careers, skills, industries..." 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <button className="relative p-2 text-slate-400 hover:text-cyan-400 transition-colors border border-[var(--app-border)]/10 rounded bg-[var(--app-card)]/40">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-400 hover:text-cyan-400 transition-colors border border-[var(--app-border)]/10 rounded bg-[var(--app-card)]/40" onClick={resetCompetencies}>
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main 2-column workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          
          {/* LEFT 8 COLUMNS: Project trajectory, alignment, skill gaps, learning roadmap */}
          <div className="lg:col-span-8 space-y-8">

            {/* 1. PROJECTED TRAJECTORY TIMELINE */}
            <section className="bg-[var(--app-card)]/40 rounded-xl p-6 border border-[var(--app-border)]/20 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00daf3]/25 to-transparent"></div>
              
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="font-headline text-[#00daf3] text-xs uppercase tracking-[0.2em] font-bold flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5" />
                    PROJECTED TRAJECTORY
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">Optimal pathway based on current momentum</p>
                </div>
                <div className="bg-[var(--app-bg)]/60 px-3 py-1 rounded border border-[var(--app-border)]/25 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="text-[9px] text-slate-200 uppercase tracking-widest font-semibold font-headline">TRAJECTORY: STABLE</span>
                </div>
              </div>

              {/* Responsive Timeline Grid */}
              <div className="relative py-6">
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[var(--app-border)]/30 -translate-y-1/2 z-0"></div>
                <div 
                  className="absolute top-1/2 left-0 h-[1px] bg-gradient-to-r from-cyan-400 to-[#44d8f1] -translate-y-1/2 z-0 transition-all duration-500"
                  style={{ width: `${(activeTimeline / 3) * 100}%` }}
                ></div>

                <div className="flex justify-between items-center relative z-10 w-full">
                  {/* Node 0: NOW */}
                  <div 
                    onClick={() => setActiveTimeline(0)}
                    className="flex flex-col items-center gap-3 w-24 relative cursor-pointer group/node"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      activeTimeline >= 0 
                        ? "bg-[var(--app-bg)] border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]" 
                        : "bg-[var(--app-card)] border-[var(--app-border)]/50 text-slate-500"
                    } hover:scale-105`}>
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-[var(--app-text)] mb-0.5 font-headline">Current State</p>
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest">{careerEngineData.trajectory[0]}</p>
                    </div>
                  </div>

                  {/* Node 1: +2 YEARS */}
                  <div 
                    onClick={() => setActiveTimeline(1)}
                    className="flex flex-col items-center gap-3 w-24 relative cursor-pointer group/node"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      activeTimeline >= 1 
                        ? "bg-[var(--app-bg)] border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]" 
                        : "bg-[var(--app-card)] border-[var(--app-border)]/50 text-slate-500"
                    } hover:scale-105`}>
                      <Code className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] font-bold mb-0.5 font-headline ${activeTimeline === 1 ? "text-cyan-400" : "text-[var(--app-text)]"}`}>+2 Years</p>
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest">{careerEngineData.trajectory[1]}</p>
                    </div>
                  </div>

                  {/* Node 2: +5 YEARS */}
                  <div 
                    onClick={() => setActiveTimeline(2)}
                    className="flex flex-col items-center gap-3 w-24 relative cursor-pointer group/node"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      activeTimeline >= 2 
                        ? "bg-[var(--app-bg)] border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]" 
                        : "bg-[var(--app-card)] border-[var(--app-border)]/50 text-slate-500"
                    } hover:scale-105`}>
                      <Hammer className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] font-bold mb-0.5 font-headline ${activeTimeline === 2 ? "text-cyan-400" : "text-[var(--app-text)]"}`}>+5 Years</p>
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest">{careerEngineData.trajectory[2]}</p>
                    </div>
                  </div>

                  {/* Node 3: +10 YEARS */}
                  <div 
                    onClick={() => setActiveTimeline(3)}
                    className="flex flex-col items-center gap-3 w-24 relative cursor-pointer group/node"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 ${
                      activeTimeline >= 3 
                        ? "bg-[var(--app-bg)] border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]" 
                        : "bg-[var(--app-card)] border-[var(--app-border)]/50 text-slate-500"
                    } hover:scale-105`}>
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] font-bold mb-0.5 font-headline ${activeTimeline === 3 ? "text-cyan-400" : "text-[var(--app-text)]"}`}>+10 Years</p>
                      <p className="text-[8px] text-slate-400 uppercase tracking-widest">{careerEngineData.trajectory[3]}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. INDUSTRY ALIGNMENT MATRIX */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 pl-2.5 border-l-2 border-cyan-400">
                  INDUSTRY ALIGNMENT MATRIX
                </h3>
                <span className="text-[9px] text-slate-500 font-headline uppercase tracking-widest bg-[var(--app-card)] px-2 py-0.5 rounded border border-[var(--app-border)]/10">
                  LIVE SCAN ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {careerEngineData.alignment.map((a) => {
                  const c = [
                    { bar: "bg-cyan-400 shadow-[0_0_10px_rgba(0,229,255,0.5)]", text: "text-cyan-400", fill: "bg-gradient-to-r from-cyan-400 to-[#44d8f1]" },
                    { bar: "bg-teal-400 shadow-[0_0_10px_rgba(0,255,150,0.3)]", text: "text-teal-400", fill: "bg-teal-400" },
                    { bar: "bg-yellow-500 shadow-[0_0_10px_rgba(250,200,0,0.3)]", text: "text-yellow-500", fill: "bg-yellow-500" },
                    { bar: "bg-slate-500", text: "text-slate-400", fill: "bg-slate-500" },
                  ][a.rank];
                  const Icon = a.icon;
                  return (
                    <div key={a.name} className="bg-[var(--app-card)]/60 rounded-xl p-5 border border-[var(--app-border)]/20 hover:bg-[var(--app-card)] transition-colors relative overflow-hidden group">
                      <div className={`absolute top-0 inset-x-0 h-[2px] ${c.bar}`}></div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded bg-[var(--app-bg)] border border-[var(--app-border)]/20 ${c.text}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-headline font-bold text-sm text-[var(--app-text)]">{a.name}</h4>
                            <span className={`text-[8px] uppercase tracking-widest font-semibold block mt-0.5 font-headline ${c.text}`}>{a.tag}</span>
                          </div>
                        </div>
                        <span className={`text-3xl font-headline font-bold tracking-tighter ${c.text}`}>{a.value}%</span>
                      </div>
                      <div className="w-full h-1 bg-[var(--app-bg)] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${c.fill}`} style={{ width: `${a.value}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. SKILL GAP ANALYSIS & RECOMMENDED LEARNING PATH GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Radar and Gap priorities */}
              <div className="bg-[var(--app-card)]/40 rounded-xl p-6 border border-[var(--app-border)]/20 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase mb-4 flex items-center gap-1.5 font-bold">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                    SKILL GAP ANALYSIS
                  </h3>
                  
                  {/* Radar Chart */}
                  <div className="w-full h-48 flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={careerEngineData.radarData}>
                        <PolarGrid stroke="#3b494c" strokeOpacity={0.3} />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#bac9cc", fontSize: 8 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#3b494c", fontSize: 6 }} />
                        <Radar name="Current Level" dataKey="A" stroke="#00e5ff" fill="#00e5ff" fillOpacity={0.15} />
                        <Radar name="Target Level" dataKey="B" stroke="#fec931" fill="transparent" strokeDasharray="3 3" />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-[var(--app-border)]/10">
                  <div className="flex justify-between items-center text-[9px] uppercase tracking-widest text-slate-400 mb-1 font-headline font-semibold">
                    <span>TOP PRIORITY GAPS</span>
                    <span className="flex gap-2">
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Current Level</span>
                      <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Target Level</span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    {careerEngineData.gaps.slice(0, 3).map((g, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-[var(--app-bg)]/40 p-2 rounded border border-[var(--app-border)]/10">
                        <span className="text-xs text-[var(--app-text)] font-medium">{g.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          g.status === "High" ? "bg-red-950/40 text-red-400 border border-red-800/30" : "bg-yellow-950/40 text-yellow-400 border border-yellow-800/30"
                        }`}>
                          {g.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full mt-2 py-2 bg-transparent hover:bg-[var(--app-card)] text-[9px] font-headline font-bold text-cyan-400 uppercase tracking-widest border border-[var(--app-border)]/20 hover:border-cyan-400 transition-colors rounded">
                    VIEW ALL RECOMMENDATIONS
                  </button>
                </div>
              </div>

              {/* Recommended Learning Path Roadmap */}
              <div className="bg-[var(--app-card)]/40 rounded-xl p-6 border border-[var(--app-border)]/20 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase mb-4 flex items-center gap-1.5 font-bold">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                    RECOMMENDED LEARNING PATH
                  </h3>

                  <div className="space-y-4">
                    {learningModules.map((mod, idx) => (
                      <div 
                        key={idx} 
                        className={`flex gap-3 cursor-pointer p-2 rounded transition-colors ${mod.completed ? "bg-teal-950/10" : "hover:bg-[var(--app-bg)]/30"}`}
                        onClick={() => toggleModuleCompletion(idx)}
                      >
                        <div className="mt-0.5">
                          {mod.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.4)]" />
                          ) : (
                            <Circle className="w-4 h-4 text-[var(--app-border)] hover:text-cyan-400" />
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-[var(--app-text)] leading-tight">{mod.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-[var(--app-bg)] text-[#00daf3] text-[7px] font-bold uppercase tracking-wider font-mono border border-[var(--app-border)]/20">{mod.duration}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-normal">{mod.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--app-border)]/10 mt-4">
                  <button 
                    onClick={handleGenerateLearningPath}
                    className="w-full py-3 bg-cyan-400 text-[#101416] hover:bg-cyan-300 font-headline font-bold text-xs uppercase tracking-widest transition-all duration-300 rounded shadow-[0_0_15px_rgba(0,229,255,0.25)] flex justify-center items-center gap-2"
                  >
                    START LEARNING JOURNEY
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT 4 COLUMNS: Sliders, Competency Deltas, Recommended Careers */}
          <div className="lg:col-span-4 space-y-8">

            {/* 1. COMPETENCY TUNING PANEL (Sliders) */}
            <section className="bg-[var(--app-card)]/40 rounded-xl p-6 border border-[var(--app-border)]/20 space-y-6">
              <div className="border-b border-[var(--app-border)]/10 pb-3 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-headline text-cyan-400 tracking-wider flex items-center gap-2 font-bold uppercase">
                    Competency Delta
                  </h3>
                </div>
              </div>

              {/* Base, Current, Target Delta Indicators */}
              <div className="flex justify-end gap-4 text-[9px] uppercase tracking-widest text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-1 bg-[var(--app-border)]"></span>
                  <span>BASE</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-1 bg-cyan-400"></span>
                  <span>CURRENT</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1 h-2 bg-yellow-500"></span>
                  <span>TARGET DELTA</span>
                </div>
              </div>

              <div className="space-y-5">
                {competencies.map((comp, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-end text-[10px] uppercase font-bold tracking-wider">
                      <span className="text-slate-300">{comp.name}</span>
                      <span className="text-cyan-400 font-mono">
                        Current: <span className="font-extrabold">{comp.current}</span> / Target: <span className="text-yellow-500">{comp.target}</span>
                      </span>
                    </div>

                    <div className="relative w-full h-1.5 bg-[var(--app-bg)] rounded-full">
                      {/* Current Progress bar */}
                      <div className="absolute top-0 left-0 h-full bg-cyan-400 rounded-l-full" style={{ width: `${comp.current}%` }}></div>
                      
                      {/* Delta Zone Highlight */}
                      {comp.current < comp.target && (
                        <div 
                          className="absolute top-0 h-full bg-yellow-500/10 border-x border-dashed border-yellow-500/30" 
                          style={{ left: `${comp.current}%`, width: `${comp.target - comp.current}%` }}
                        ></div>
                      )}

                      {/* Target Indicator pin */}
                      <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3.5 bg-yellow-500" style={{ left: `${comp.target}%` }}></div>

                      <input 
                        type="range" 
                        min="10" 
                        max="100" 
                        step="1"
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                        value={comp.current}
                        onChange={(e) => handleSliderChange(idx, parseInt(e.target.value))}
                      />
                    </div>
                    
                    {comp.critical && (
                      <span className="text-[8px] text-red-400 uppercase tracking-widest font-bold block mt-1">
                        CRITICAL DELTA DETECTED
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handleGenerateLearningPath}
                className="w-full bg-[#00e5ff] text-[#101416] hover:bg-cyan-300 py-3 rounded font-headline text-[10px] font-bold tracking-widest uppercase transition-all duration-300 flex justify-center items-center gap-2 shadow-[0_0_12px_rgba(0,229,255,0.2)]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                GENERATE LEARNING PATH
              </button>
            </section>

            {/* 2. DYNAMIC READINESS METRICS */}
            <section className="bg-[var(--app-card)]/40 rounded-xl p-5 border border-[var(--app-border)]/20 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[#00daf3] font-headline">
                TELEMETRY DIAGNOSTICS
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[var(--app-bg)]/50 p-3 rounded border border-[var(--app-border)]/10 flex flex-col justify-between">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider font-headline">Career Readiness</span>
                  <span className="text-2xl font-bold font-headline text-[var(--app-text)] mt-1">{careerEngineData.careerReadiness}%</span>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${careerEngineData.careerReadiness}%` }}></div>
                  </div>
                </div>

                <div className="bg-[var(--app-bg)]/50 p-3 rounded border border-[var(--app-border)]/10 flex flex-col justify-between">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider font-headline">Market Demand</span>
                  <span className="text-2xl font-bold font-headline text-[var(--app-text)] mt-1">{careerEngineData.marketDemand}%</span>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-teal-400 rounded-full" style={{ width: `${careerEngineData.marketDemand}%` }}></div>
                  </div>
                </div>

                <div className="bg-[var(--app-bg)]/50 p-3 rounded border border-[var(--app-border)]/10 flex flex-col justify-between">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider font-headline">Future Growth</span>
                  <span className="text-2xl font-bold font-headline text-[var(--app-text)] mt-1">{careerEngineData.futureGrowth}%</span>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${careerEngineData.futureGrowth}%` }}></div>
                  </div>
                </div>

                <div className="bg-[var(--app-bg)]/50 p-3 rounded border border-[var(--app-border)]/10 flex flex-col justify-between">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider font-headline">Automation Risk</span>
                  <span className="text-2xl font-bold font-headline text-red-400 mt-1">{careerEngineData.automationRisk}%</span>
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${careerEngineData.automationRisk}%` }}></div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. RECOMMENDED CAREER PATHS */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-[var(--app-border)]/10 pb-2 flex-1 font-headline">
                  RECOMMENDED CAREER PATHS
                </h3>
                <button className="text-[8px] font-headline text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors pb-2">
                  VIEW ALL
                </button>
              </div>

              <div className="space-y-3">
                {careerEngineData.careers.map((car, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedCareer(car.name)}
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      selectedCareer === car.name 
                        ? "bg-[var(--app-card)] border-cyan-400/80 shadow-[0_0_15px_rgba(0,229,255,0.15)]" 
                        : "bg-[var(--app-card)]/60 border-[var(--app-border)]/15 hover:border-cyan-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedCareer === car.name ? "bg-cyan-950 text-cyan-400" : "bg-[var(--app-bg)] text-slate-400"}`}>
                        <car.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-[var(--app-text)]">{car.name}</h4>
                        <span className="text-[8px] text-slate-400 uppercase font-mono tracking-wider">
                          {car.growth} • {car.demand}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-cyan-400 font-headline block">{car.match}%</span>
                      <span className="text-[7px] text-slate-400 uppercase tracking-widest">MATCH</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>

        {/* BOTTOM FULL-WIDTH: AI Career Insights cards */}
        <section className="bg-[var(--app-card)]/30 border border-[var(--app-border)]/15 p-6 rounded-xl relative z-10 grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
          <div className="md:col-span-1 md:border-r border-[var(--app-border)]/15 pr-4 flex items-center gap-3">
            <Brain className="w-7 h-7 text-[#00daf3] shadow-[0_0_12px_rgba(0,218,243,0.3)]" />
            <div>
              <h4 className="font-headline font-bold text-xs uppercase text-[var(--app-text)]">AI CAREER INSIGHTS</h4>
              <p className="text-[9px] text-slate-400 mt-0.5 font-headline">Personalized career intelligence</p>
            </div>
          </div>

          <div className="md:col-span-1 bg-[var(--app-bg)]/40 p-3.5 rounded border border-[var(--app-border)]/10 flex flex-col justify-between min-h-[90px]">
            <div className="flex items-center gap-2 text-cyan-400 font-headline text-[10px] font-bold uppercase">
              <TrendingUp className="w-3.5 h-3.5" />
              Strong Alignment
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              {careerEngineData.insights.alignment}
            </p>
          </div>

          <div className="md:col-span-1 bg-[var(--app-bg)]/40 p-3.5 rounded border border-[var(--app-border)]/10 flex flex-col justify-between min-h-[90px]">
            <div className="flex items-center gap-2 text-[#00daf3] font-headline text-[10px] font-bold uppercase">
              <Compass className="w-3.5 h-3.5" />
              Skill Velocity
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              {careerEngineData.insights.velocity}
            </p>
          </div>

          <div className="md:col-span-1 bg-[var(--app-bg)]/40 p-3.5 rounded border border-[var(--app-border)]/10 flex flex-col justify-between min-h-[90px]">
            <div className="flex items-center gap-2 text-yellow-500 font-headline text-[10px] font-bold uppercase">
              <Lightbulb className="w-3.5 h-3.5" />
              Market Advantage
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              {careerEngineData.insights.advantage}
            </p>
          </div>

          <div className="md:col-span-1 bg-[var(--app-bg)]/40 p-3.5 rounded border border-[var(--app-border)]/10 flex flex-col justify-between min-h-[90px]">
            <div className="flex items-center gap-2 text-teal-400 font-headline text-[10px] font-bold uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Next Best Move
            </div>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              {careerEngineData.insights.nextMove}
            </p>
          </div>
        </section>
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--app-border)]/10 bg-[var(--app-bg)]/50 py-4 px-6 text-[10px] text-slate-500 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
          Predictive model calibrated daily against current labor market intelligence telemetry.
        </div>
        <div>
          MCP ORCHESTRA SYSTEM V1.0.4
        </div>
      </footer>
    </div>
  );
}
