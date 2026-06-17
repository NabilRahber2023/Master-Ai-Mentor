"use client";

import { useMemo, useState } from "react";
import { 
  GraduationCap, 
  Search, 
  Bell, 
  Settings as SettingsIcon, 
  TrendingUp, 
  TrendingDown, 
  Play, 
  Edit2,
  Info
} from "lucide-react";

// Initial Subject configurations
const INITIAL_SUBJECTS_DIAGNOSTICS = [
  { id: 1, name: "Advanced Cryptography", code: "CS-401", current: "B+", forecast: "A-", trend: "up" },
  { id: 2, name: "Neural Network Arch", code: "AI-350", current: "A", forecast: "A", trend: "stable" },
  { id: 3, name: "Quantum Mechanics", code: "PHYS-502", current: "B-", forecast: "C+", trend: "down" },
];

const INITIAL_SUBJECTS_BREAKDOWN = [
  { code: "CS 401", title: "Advanced Algorithms", historical: "B+", predicted: "A-", icon: "code" },
  { code: "MATH 350", title: "Linear Algebra", historical: "A", predicted: "A", icon: "calculate" },
  { code: "PHYS 201", title: "Quantum Mechanics", historical: "C+", predicted: "C", icon: "science", warning: true },
];

export function StudentAnalyticsDashboard() {
  // Simulator Tuning States (bound to visual simulator widgets)
  const [attendanceRate, setAttendanceRate] = useState<number>(92);
  const [studyHours, setStudyHours] = useState<number>(18);
  const [simulationActive, setSimulationActive] = useState(false);

  // Editable Model Baseline Parameters
  const [sscGpa, setSscGpa] = useState<number>(4.80);
  const [hscGpa, setHscGpa] = useState<number>(4.92);
  const [familyIncome, setFamilyIncome] = useState<string>("Tier 2");
  const [scholarship, setScholarship] = useState<string>("Merit Based");
  const [distanceFromUni, setDistanceFromUni] = useState<string>("12 km");
  const [prevSemesterSgpa, setPrevSemesterSgpa] = useState<number>(3.42);
  const [editingParams, setEditingParams] = useState(false);

  // Diagnostics states
  const [subjectsDiagnostics, setSubjectsDiagnostics] = useState(INITIAL_SUBJECTS_DIAGNOSTICS);

  // Simulator Calculus
  const simulatedValues = useMemo(() => {
    const baseline = prevSemesterSgpa; // 3.42
    
    // Attendance rate formula
    const attImpact = (attendanceRate - 92) * 0.015;
    // Study hours formula
    const studyImpact = (studyHours - 18) * 0.02;

    const rawSim = baseline + 0.36 + attImpact + studyImpact;
    const predicted = Math.min(4.0, Math.max(1.0, Number(rawSim.toFixed(2))));

    // Primary Confidence
    const primaryConfidence = Math.min(99.9, Math.max(70.0, 94.2 + attImpact * 5 + studyImpact * 4));

    // Dynamic predicted values for granular components
    const cryptoGpa = Math.min(4.0, 3.7 + attImpact + studyImpact);
    const quantumGpa = Math.min(4.0, 2.3 + attImpact + studyImpact);
    
    return {
      predicted,
      confidence: primaryConfidence.toFixed(1),
      risk: predicted >= 3.5 ? "Low Risk" : predicted >= 3.0 ? "Moderate Risk" : "High Risk",
      riskColor: predicted >= 3.5 ? "text-cyan-400 bg-cyan-950/40 border-cyan-800/30" : predicted >= 3.0 ? "text-yellow-400 bg-yellow-950/40 border-yellow-800/30" : "text-red-400 bg-red-950/40 border-red-800/30",
      cryptoForecast: cryptoGpa >= 3.85 ? "A" : cryptoGpa >= 3.5 ? "A-" : cryptoGpa >= 3.15 ? "B+" : "B",
      quantumForecast: quantumGpa >= 3.15 ? "B" : quantumGpa >= 2.85 ? "B-" : quantumGpa >= 2.5 ? "C+" : "C",
      predicted2: Math.min(4.0, Math.max(1.0, Number((rawSim + 0.04).toFixed(2))))
    };
  }, [attendanceRate, studyHours, prevSemesterSgpa]);

  return (
    <div className="w-full bg-[#101416] text-[#e0e3e6] min-h-screen font-body selection:bg-cyan-500/30 selection:text-cyan-200 space-y-8 pb-24">
      
      {/* Top Bar Navigation Mockup matching layout */}
      <header className="flex justify-between items-center w-full pb-4 border-b border-[#3b494c]/10">
        {/* Search */}
        <div className="flex items-center bg-[#1c2022] rounded px-4 py-2 w-64 border border-[#3b494c]/20 focus-within:border-cyan-400 transition-all group">
          <Search className="text-slate-400 text-sm mr-2 group-focus-within:text-cyan-400 transition-colors w-4 h-4" />
          <input 
            className="bg-transparent border-none outline-none text-xs text-white w-full placeholder:text-slate-500 font-headline uppercase tracking-wider" 
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
          <div className="h-8 w-8 rounded-full bg-[#272a2d] border border-[#3b494c]/30 overflow-hidden cursor-pointer opacity-80 hover:opacity-100 hover:scale-95 transition-all flex items-center justify-center">
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
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-white tracking-tight">
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
        <div className="lg:col-span-8 bg-[#272a2d]/40 backdrop-blur-md rounded-xl p-6 md:p-8 relative overflow-hidden border border-[#3b494c]/20 shadow-[0_0_40px_-5px_rgba(195,245,255,0.04)] flex flex-col justify-between min-h-[380px]">
          
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_2px,#bac9cc_2px,#bac9cc_4px)]"></div>
          
          <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] text-slate-400 font-headline tracking-[0.1em] uppercase mb-0.5">Trajectory</p>
              <h3 className="text-lg md:text-xl font-bold text-white font-headline">Cumulative GPA Forecast</h3>
            </div>
            
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-headline tracking-[0.1em] uppercase mb-0.5">Current</p>
                <p className="text-lg font-bold text-white font-headline">{prevSemesterSgpa.toFixed(2)}</p>
              </div>
              <div className="w-px h-8 bg-[#3b494c]/50"></div>
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

          <div className="flex justify-between items-center mt-4 text-[9px] text-slate-400 font-headline uppercase tracking-widest relative z-10 pt-2 border-t border-[#3b494c]/10">
            <span>Q1</span>
            <span>Q2</span>
            <span className="text-[#44d8f1]">Current</span>
            <span>Q3</span>
            <span>Q4 (Proj)</span>
          </div>
        </div>

        {/* IMPACT FACTORS (4 cols) */}
        <div className="lg:col-span-4 bg-[#1c2022]/60 rounded-xl p-6 relative flex flex-col border border-[#3b494c]/20 justify-between">
          <div>
            <h3 className="text-xs text-white font-headline tracking-[0.1em] uppercase mb-0.5">Impact Factors</h3>
            <p className="text-[11px] text-slate-400 mb-6">Variables driving the prediction</p>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-slate-300 font-medium font-headline tracking-wider uppercase">Attendance</span>
                  <span className="text-cyan-400 font-bold font-headline">+{attendanceRate >= 92 ? "0.15" : (0.15 + (attendanceRate - 92) * 0.005).toFixed(2)} GPA</span>
                </div>
                <div className="h-1.5 w-full bg-[#313538]/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,229,255,0.4)] transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(10, attendanceRate - 10))}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-slate-300 font-medium font-headline tracking-wider uppercase">Study Hours</span>
                  <span className="text-cyan-400 font-bold font-headline">+{studyHours >= 18 ? "0.12" : (0.12 + (studyHours - 18) * 0.008).toFixed(2)} GPA</span>
                </div>
                <div className="h-1.5 w-full bg-[#313538]/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,229,255,0.4)] transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(10, (studyHours / 40) * 100))}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-slate-300 font-medium font-headline tracking-wider uppercase">Participation</span>
                  <span className="text-cyan-400 font-bold font-headline">+0.08 GPA</span>
                </div>
                <div className="h-1.5 w-full bg-[#313538]/50 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full w-[50%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-slate-300 font-medium font-headline tracking-wider uppercase">Extracurriculars</span>
                  <span className="text-cyan-400 font-bold font-headline">+0.04 GPA</span>
                </div>
                <div className="h-1.5 w-full bg-[#313538]/50 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full w-[30%]"></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1.5">
                  <span className="text-slate-300 font-medium font-headline tracking-wider uppercase">Assignment Quality</span>
                  <span className="text-yellow-500 font-bold font-headline">-0.05 GPA</span>
                </div>
                <div className="h-1.5 w-full bg-[#313538]/50 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full w-[45%]"></div>
                </div>
              </div>
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
      <div className="border border-[#3b494c]/20 bg-[#1c2022]/20 rounded-xl p-6 md:p-8 space-y-6">
        <div className="border-b border-[#3b494c]/10 pb-4">
          <h2 className="text-[10px] text-cyan-400 font-headline tracking-[0.2em] uppercase mb-1">Predictive Intel</h2>
          <p className="text-xs text-slate-400 font-headline uppercase tracking-wider">Trajectory Analysis &amp; Impact Diagnostics</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Sub-card: Cumulative GPA Forecast */}
          <div className="xl:col-span-2 bg-[#181c1e]/80 border border-[#3b494c]/15 rounded-xl p-6 relative overflow-hidden flex flex-col min-h-[300px]">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/10"></div>
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-[repeating-linear-gradient(to_bottom,transparent,transparent_2px,#bac9cc_2px,#bac9cc_4px)]"></div>
            
            <div className="flex justify-between items-start mb-6 z-10">
              <div>
                <h3 className="font-headline text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Cumulative GPA Forecast</h3>
                <div className="flex items-end gap-3">
                  <span className="font-headline text-5xl font-bold text-white">{simulatedValues.predicted2.toFixed(2)}</span>
                  <div className="pb-1.5 flex items-center gap-0.5 text-cyan-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="font-headline text-xs font-semibold">+0.14 Projected</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="block font-headline text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Current Baseline</span>
                <span className="font-headline text-xl text-slate-300">3.68</span>
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
          <div className="bg-[#181c1e]/80 border border-[#3b494c]/15 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-headline text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Primary Impact Factors</h3>
              
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-slate-200">Algorithmic Consistency</span>
                    <span className="font-headline text-sm font-semibold text-cyan-400">94%</span>
                  </div>
                  <div className="w-full h-1 bg-[#313538]/50 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 rounded-full w-[94%] shadow-[0_0_8px_rgba(0,229,255,0.6)]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-slate-200">Assignment Quality</span>
                    <span className="font-headline text-sm font-semibold text-[#44d8f1]">88%</span>
                  </div>
                  <div className="w-full h-1 bg-[#313538]/50 rounded-full overflow-hidden">
                    <div className="h-full bg-[#44d8f1] rounded-full w-[88%]"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-xs text-slate-200">Peer Collaboration</span>
                    <span className="font-headline text-sm font-semibold text-yellow-500">62%</span>
                  </div>
                  <div className="w-full h-1 bg-[#313538]/50 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-500 rounded-full w-[62%]"></div>
                  </div>
                  <p className="mt-2 text-[9px] text-yellow-500/80 font-headline uppercase tracking-wider flex items-center gap-1">
                    <Info className="w-3 h-3" /> Potential Drag Factor
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#3b494c]/10 text-[10px] text-slate-400 font-mono">
              UPDATED: JUST NOW
            </div>
          </div>
        </div>

        {/* Granular Subject Diagnostics */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4 border-b border-[#3b494c]/10 pb-2">
            <h3 className="font-headline text-xs font-bold text-white uppercase tracking-wider">Granular Subject Diagnostics</h3>
            <button className="text-[9px] font-headline text-cyan-400 uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-1">
              View Matrix <span className="text-xs">→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {subjectsDiagnostics.map((subject) => (
              <div key={subject.id} className="bg-[#181c1e]/60 border border-[#3b494c]/15 rounded-xl p-4 flex flex-col justify-between hover:bg-[#1c2022]/80 transition-colors">
                <div>
                  <h4 className="font-headline text-sm text-white font-medium truncate mb-0.5">{subject.name}</h4>
                  <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-6">{subject.code}</p>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="block text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Current</span>
                    <span className="font-headline text-sm text-white font-bold">{subject.current}</span>
                  </div>
                  
                  {subject.trend === "up" ? (
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  ) : subject.trend === "down" ? (
                    <TrendingDown className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <span className="text-xs text-slate-500 font-bold">→</span>
                  )}

                  <div className="text-right">
                    <span className="block text-[8px] text-cyan-400 uppercase tracking-wider mb-0.5 font-headline">Forecast</span>
                    <span className={`font-headline text-sm font-bold ${subject.trend === "down" ? "text-yellow-500" : "text-cyan-400"}`}>
                      {subject.id === 1 ? simulatedValues.cryptoForecast : subject.id === 3 ? simulatedValues.quantumForecast : subject.forecast}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Add subject diagnostics mockup card */}
            <div 
              onClick={() => {
                const name = prompt("Enter new subject name:");
                const code = prompt("Enter subject code (e.g., CSE-302):");
                if (name && code) {
                  setSubjectsDiagnostics([
                    ...subjectsDiagnostics,
                    { id: Date.now(), name, code, current: "B", forecast: "B+", trend: "up" }
                  ]);
                }
              }}
              className="bg-[#272a2d]/20 border border-[#3b494c]/15 rounded-xl p-4 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-[#272a2d]/50 hover:border-cyan-500/30 transition-all group min-h-[120px]"
            >
              <div className="w-8 h-8 rounded-full bg-[#181c1e] border border-[#3b494c]/30 flex items-center justify-center mb-2 group-hover:border-cyan-500/50 transition-colors">
                <span className="text-slate-400 text-lg group-hover:text-cyan-400 transition-colors">+</span>
              </div>
              <span className="font-headline text-[10px] text-slate-400 uppercase tracking-widest group-hover:text-cyan-400 transition-colors">Add Subject Intel</span>
            </div>
          </div>
        </div>
      </div>

      {/* SUBJECT LEVEL BREAKDOWN */}
      <div>
        <h3 className="text-xs text-white font-headline tracking-[0.1em] uppercase mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
          Subject Level Breakdown
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {INITIAL_SUBJECTS_BREAKDOWN.map((subject) => (
            <div 
              key={subject.code} 
              className={`bg-[#0b0f11]/80 rounded-xl p-5 flex flex-col justify-between border relative overflow-hidden transition-all duration-300 ${
                subject.warning 
                  ? "border-yellow-500/20 hover:border-yellow-500/40" 
                  : "border-[#3b494c]/10 hover:border-[#3b494c]/30 hover:bg-[#181c1e]/60"
              }`}
            >
              {subject.warning && <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase mb-0.5">{subject.code}</p>
                  <h4 className="text-sm font-medium text-white">{subject.title}</h4>
                </div>
                <span className="text-xs font-mono text-cyan-400">⚡</span>
              </div>

              <div className="flex justify-between items-end mt-4">
                <div>
                  <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Historical</p>
                  <p className="text-base text-slate-300 font-headline">{subject.historical}</p>
                </div>

                <div className="flex flex-col items-center justify-center px-4">
                  <span className={`text-xs font-bold ${subject.warning ? "text-yellow-500" : "text-cyan-400"}`}>→</span>
                </div>

                <div className="text-right">
                  <p className={`text-[8px] uppercase tracking-wider mb-0.5 ${subject.warning ? "text-yellow-500" : "text-cyan-400"}`}>Predicted</p>
                  <p className={`text-lg font-bold font-headline drop-shadow-[0_0_8px_rgba(0,229,255,0.4)] ${subject.warning ? "text-yellow-500" : "text-cyan-400"}`}>
                    {subject.code === "CS 401" ? simulatedValues.cryptoForecast : subject.code === "PHYS 201" ? simulatedValues.quantumForecast : subject.predicted}
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
        <div className="lg:col-span-6 bg-[#272a2d]/30 border border-[#3b494c]/20 rounded-xl p-6 md:p-8 relative flex flex-col justify-between">
          <div className="mb-6 flex justify-between items-center border-b border-[#3b494c]/10 pb-3">
            <div>
              <h3 className="text-xs text-white font-headline tracking-[0.1em] uppercase mb-0.5">What-If Simulator</h3>
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
                className="w-full accent-cyan-400 bg-[#181c1e] h-1.5 rounded-lg appearance-none cursor-pointer" 
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
                className="w-full accent-cyan-400 bg-[#181c1e] h-1.5 rounded-lg appearance-none cursor-pointer" 
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
        <div className="lg:col-span-6 bg-[#181c1e]/60 border border-[#3b494c]/20 rounded-xl p-6 md:p-8 flex flex-col justify-between">
          <div className="mb-6 flex justify-between items-center border-b border-[#3b494c]/10 pb-3">
            <div>
              <h3 className="text-xs text-white font-headline tracking-[0.1em] uppercase mb-0.5">Model Parameters</h3>
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
            <div className="bg-[#272a2d]/30 p-3 rounded-lg border border-[#3b494c]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">SSC GPA</p>
              {editingParams ? (
                <input 
                  type="number" 
                  step="0.01" 
                  className="bg-[#101416] border border-[#3b494c]/30 text-white text-xs p-1 rounded w-full"
                  value={sscGpa} 
                  onChange={(e) => setSscGpa(Number(e.target.value))}
                />
              ) : (
                <p className="text-xs font-bold text-white">{sscGpa.toFixed(2)}</p>
              )}
            </div>

            <div className="bg-[#272a2d]/30 p-3 rounded-lg border border-[#3b494c]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">HSC GPA</p>
              {editingParams ? (
                <input 
                  type="number" 
                  step="0.01" 
                  className="bg-[#101416] border border-[#3b494c]/30 text-white text-xs p-1 rounded w-full"
                  value={hscGpa} 
                  onChange={(e) => setHscGpa(Number(e.target.value))}
                />
              ) : (
                <p className="text-xs font-bold text-white">{hscGpa.toFixed(2)}</p>
              )}
            </div>

            <div className="bg-[#272a2d]/30 p-3 rounded-lg border border-[#3b494c]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">Family Income</p>
              {editingParams ? (
                <input 
                  type="text" 
                  className="bg-[#101416] border border-[#3b494c]/30 text-white text-xs p-1 rounded w-full"
                  value={familyIncome} 
                  onChange={(e) => setFamilyIncome(e.target.value)}
                />
              ) : (
                <p className="text-xs font-bold text-white">{familyIncome}</p>
              )}
            </div>

            <div className="bg-[#272a2d]/30 p-3 rounded-lg border border-[#3b494c]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">Scholarship</p>
              {editingParams ? (
                <input 
                  type="text" 
                  className="bg-[#101416] border border-[#3b494c]/30 text-white text-xs p-1 rounded w-full"
                  value={scholarship} 
                  onChange={(e) => setScholarship(e.target.value)}
                />
              ) : (
                <p className="text-xs font-bold text-white">{scholarship}</p>
              )}
            </div>

            <div className="bg-[#272a2d]/30 p-3 rounded-lg border border-[#3b494c]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">Distance from Uni</p>
              {editingParams ? (
                <input 
                  type="text" 
                  className="bg-[#101416] border border-[#3b494c]/30 text-white text-xs p-1 rounded w-full"
                  value={distanceFromUni} 
                  onChange={(e) => setDistanceFromUni(e.target.value)}
                />
              ) : (
                <p className="text-xs font-bold text-white">{distanceFromUni}</p>
              )}
            </div>

            <div className="bg-[#272a2d]/30 p-3 rounded-lg border border-[#3b494c]/10">
              <p className="text-[9px] text-slate-400 font-headline tracking-widest uppercase mb-1">Previous Semester</p>
              {editingParams ? (
                <input 
                  type="number" 
                  step="0.01" 
                  className="bg-[#101416] border border-[#3b494c]/30 text-white text-xs p-1 rounded w-full"
                  value={prevSemesterSgpa} 
                  onChange={(e) => setPrevSemesterSgpa(Number(e.target.value))}
                />
              ) : (
                <p className="text-xs font-bold text-white">{prevSemesterSgpa.toFixed(2)} SGPA</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
