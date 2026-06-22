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
import { NineBoxPredictionPanel } from "@/components/modules/live-prediction/nine-box-prediction-panel";
import { ModeSwitch } from "@/components/modules/csv-mode/mode-switch";
import { CsvModePanel } from "@/components/modules/csv-mode/csv-mode-panel";
import type { NineBoxPredictionResponse } from "@/lib/api/predictions";
import {
  TrendingUp,
  Download, 
  Award, 
  ShieldAlert, 
  Sparkles, 
  ChevronDown, 
  User, 
  Zap, 
  AlertCircle,
  Brain,
  Check
} from "lucide-react";

// Types
interface Employee {
  employee_id: string;
  employee_name: string;
  department: string;
  role: string;
  performance_score: number; // 1-10
  potential_score: number;   // 1-10
  engagement_score: number;  // 1-100
  retention_risk: "Low" | "Medium" | "High";
  promotion_readiness: "Ready Now" | "1-2 Years" | "2+ Years" | "Not Ready";
  leadership_index: number;  // 1-100
  cohort: string;
}

// 9-Box category definitions
type NineBoxCategory = 
  | "Star" 
  | "High Potential" 
  | "Enigma" 
  | "High Performer" 
  | "Core Player" 
  | "Dilemma" 
  | "Solid" 
  | "Effective" 
  | "Risk";

// Map performance & potential scores to 9-box category
function getNineBoxCategory(performance: number, potential: number): NineBoxCategory {
  // Low: 1-3, Medium: 4-7, High: 8-10
  const perfLevel = performance >= 8 ? "High" : performance >= 4 ? "Medium" : "Low";
  const potLevel = potential >= 8 ? "High" : potential >= 4 ? "Medium" : "Low";

  if (potLevel === "High") {
    if (perfLevel === "High") return "Star";
    if (perfLevel === "Medium") return "High Potential";
    return "Enigma";
  }
  if (potLevel === "Medium") {
    if (perfLevel === "High") return "High Performer";
    if (perfLevel === "Medium") return "Core Player";
    return "Dilemma";
  }
  // Low Potential
  if (perfLevel === "High") return "Solid";
  if (perfLevel === "Medium") return "Effective";
  return "Risk";
}

// Map the backend's 0/1/2 performance & potential levels to a 9-box category.
function levelsToCategory(perfLevel: number, potLevel: number): NineBoxCategory {
  const perf = perfLevel >= 2 ? "High" : perfLevel === 1 ? "Medium" : "Low";
  const pot = potLevel >= 2 ? "High" : potLevel === 1 ? "Medium" : "Low";
  if (pot === "High") {
    if (perf === "High") return "Star";
    if (perf === "Medium") return "High Potential";
    return "Enigma";
  }
  if (pot === "Medium") {
    if (perf === "High") return "High Performer";
    if (perf === "Medium") return "Core Player";
    return "Dilemma";
  }
  if (perf === "High") return "Solid";
  if (perf === "Medium") return "Effective";
  return "Risk";
}

// Derive a retention risk band from the predicted 9-box category.
function deriveRetentionRisk(category: NineBoxCategory): "Low" | "Medium" | "High" {
  if (category === "Risk") return "High";
  if (category === "Dilemma" || category === "Effective" || category === "Enigma") return "Medium";
  return "Low";
}

// Generative Mock Data
const MOCK_EMPLOYEES: Employee[] = [
  // Q3 2023 - Engineering
  { employee_id: "EMP-001", employee_name: "Elena Rostova", department: "Engineering", role: "Lead Architect", performance_score: 9, potential_score: 9, engagement_score: 92, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 88, cohort: "Q3 2023" },
  { employee_id: "EMP-002", employee_name: "Marcus Chen", department: "Engineering", role: "Senior Engineer", performance_score: 7, potential_score: 9, engagement_score: 85, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 78, cohort: "Q3 2023" },
  { employee_id: "EMP-003", employee_name: "David Kim", department: "Engineering", role: "Frontend Dev", performance_score: 8, potential_score: 6, engagement_score: 76, retention_risk: "Medium", promotion_readiness: "1-2 Years", leadership_index: 65, cohort: "Q3 2023" },
  { employee_id: "EMP-004", employee_name: "Sarah Jenkins", department: "Engineering", role: "QA Engineer", performance_score: 5, potential_score: 5, engagement_score: 89, retention_risk: "Low", promotion_readiness: "2+ Years", leadership_index: 54, cohort: "Q3 2023" },
  { employee_id: "EMP-005", employee_name: "Alex Mercer", department: "Engineering", role: "Junior DevOps", performance_score: 2, potential_score: 3, engagement_score: 42, retention_risk: "High", promotion_readiness: "Not Ready", leadership_index: 22, cohort: "Q3 2023" },
  { employee_id: "EMP-006", employee_name: "Li Wei", department: "Engineering", role: "Staff Engineer", performance_score: 9, potential_score: 5, engagement_score: 94, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 85, cohort: "Q3 2023" },
  
  // Q3 2023 - Product
  { employee_id: "EMP-007", employee_name: "Sophia Martinez", department: "Product", role: "Director of Product", performance_score: 10, potential_score: 9, engagement_score: 95, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 92, cohort: "Q3 2023" },
  { employee_id: "EMP-008", employee_name: "John Miller", department: "Product", role: "Product Manager", performance_score: 6, potential_score: 6, engagement_score: 80, retention_risk: "Medium", promotion_readiness: "1-2 Years", leadership_index: 70, cohort: "Q3 2023" },
  { employee_id: "EMP-009", employee_name: "Emma Watson", department: "Product", role: "Associate PM", performance_score: 3, potential_score: 8, engagement_score: 88, retention_risk: "Low", promotion_readiness: "1-2 Years", leadership_index: 60, cohort: "Q3 2023" },
  
  // Q3 2023 - Sales & Marketing
  { employee_id: "EMP-010", employee_name: "James Wilson", department: "Sales", role: "Account Executive", performance_score: 9, potential_score: 4, engagement_score: 81, retention_risk: "High", promotion_readiness: "1-2 Years", leadership_index: 55, cohort: "Q3 2023" },
  { employee_id: "EMP-011", employee_name: "Chloe Bennett", department: "Marketing", role: "Growth Lead", performance_score: 8, potential_score: 8, engagement_score: 90, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 80, cohort: "Q3 2023" },
  { employee_id: "EMP-012", employee_name: "Ryan Reynolds", department: "Marketing", role: "Creative Producer", performance_score: 5, potential_score: 7, engagement_score: 85, retention_risk: "Medium", promotion_readiness: "1-2 Years", leadership_index: 58, cohort: "Q3 2023" },
  { employee_id: "EMP-013", employee_name: "Jordan Sparks", department: "Sales", role: "Account Director", performance_score: 6, potential_score: 5, engagement_score: 79, retention_risk: "Low", promotion_readiness: "2+ Years", leadership_index: 62, cohort: "Q3 2023" },

  // Q4 2023 - Engineering
  { employee_id: "EMP-101", employee_name: "Elena Rostova", department: "Engineering", role: "Lead Architect", performance_score: 10, potential_score: 10, engagement_score: 96, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 95, cohort: "Q4 2023" },
  { employee_id: "EMP-102", employee_name: "Marcus Chen", department: "Engineering", role: "Principal Engineer", performance_score: 8, potential_score: 9, engagement_score: 88, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 84, cohort: "Q4 2023" },
  { employee_id: "EMP-103", employee_name: "David Kim", department: "Engineering", role: "Frontend Dev Lead", performance_score: 9, potential_score: 7, engagement_score: 82, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 72, cohort: "Q4 2023" },
  { employee_id: "EMP-104", employee_name: "Sarah Jenkins", department: "Engineering", role: "QA Engineer", performance_score: 6, potential_score: 5, engagement_score: 90, retention_risk: "Low", promotion_readiness: "2+ Years", leadership_index: 55, cohort: "Q4 2023" },
  { employee_id: "EMP-105", employee_name: "Alex Mercer", department: "Engineering", role: "DevOps Engineer", performance_score: 4, potential_score: 5, engagement_score: 65, retention_risk: "Medium", promotion_readiness: "2+ Years", leadership_index: 45, cohort: "Q4 2023" },
  { employee_id: "EMP-106", employee_name: "Li Wei", department: "Engineering", role: "Staff Engineer", performance_score: 9, potential_score: 6, engagement_score: 93, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 87, cohort: "Q4 2023" },
  
  // Q4 2023 - Product
  { employee_id: "EMP-107", employee_name: "Sophia Martinez", department: "Product", role: "VP of Product", performance_score: 10, potential_score: 10, engagement_score: 98, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 98, cohort: "Q4 2023" },
  { employee_id: "EMP-108", employee_name: "John Miller", department: "Product", role: "Senior PM", performance_score: 8, potential_score: 7, engagement_score: 84, retention_risk: "Low", promotion_readiness: "1-2 Years", leadership_index: 75, cohort: "Q4 2023" },
  { employee_id: "EMP-109", employee_name: "Emma Watson", department: "Product", role: "PM", performance_score: 5, potential_score: 8, engagement_score: 91, retention_risk: "Low", promotion_readiness: "1-2 Years", leadership_index: 68, cohort: "Q4 2023" },

  // Q1 2024 - Engineering
  { employee_id: "EMP-201", employee_name: "Elena Rostova", department: "Engineering", role: "Lead Architect", performance_score: 10, potential_score: 10, engagement_score: 97, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 96, cohort: "Q1 2024" },
  { employee_id: "EMP-202", employee_name: "Marcus Chen", department: "Engineering", role: "Principal Engineer", performance_score: 9, potential_score: 9, engagement_score: 91, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 88, cohort: "Q1 2024" },
  { employee_id: "EMP-203", employee_name: "David Kim", department: "Engineering", role: "Frontend Dev Lead", performance_score: 9, potential_score: 8, engagement_score: 86, retention_risk: "Low", promotion_readiness: "Ready Now", leadership_index: 76, cohort: "Q1 2024" },
  { employee_id: "EMP-204", employee_name: "Sarah Jenkins", department: "Engineering", role: "QA Lead", performance_score: 8, potential_score: 6, engagement_score: 92, retention_risk: "Low", promotion_readiness: "1-2 Years", leadership_index: 62, cohort: "Q1 2024" },
  { employee_id: "EMP-205", employee_name: "Alex Mercer", department: "Engineering", role: "DevOps Engineer", performance_score: 6, potential_score: 6, engagement_score: 72, retention_risk: "Low", promotion_readiness: "1-2 Years", leadership_index: 52, cohort: "Q1 2024" },
];

export default function GrowthPotentialPage() {
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  const [selectedDept, setSelectedDept] = useState<string>("Engineering");
  const [selectedCohort, setSelectedCohort] = useState<string>("Q3 2023");
  const [selectedCategory, setSelectedCategory] = useState<NineBoxCategory>("Star");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  // Live ML evaluation result that drives the dashboard when present.
  const [livePrediction, setLivePrediction] = useState<NineBoxPredictionResponse | null>(null);

  // When the user evaluates a candidate, snap the whole dashboard to the predicted box.
  const handleLiveResult = (result: NineBoxPredictionResponse) => {
    const category = levelsToCategory(result.performance_level_score, result.potential_level_score);
    setLivePrediction(result);
    setSelectedCategory(category);
    setSelectedEmployeeId(null);
  };

  // Editing inputs starts fresh.
  const handleLiveReset = () => setLivePrediction(null);

  // Departments & Cohorts
  const departments = ["Engineering", "Product", "Sales", "Marketing", "All"];
  const cohorts = ["Q3 2023", "Q4 2023", "Q1 2024"];

  // The dashboard starts fresh: no demo employees are shown. It is driven entirely
  // by the live 9-Box evaluation result. (MOCK_EMPLOYEES retained only for the
  // export sample format below.)
  const filteredEmployees = useMemo<Employee[]>(() => [], []);

  // Aggregate matrix statistics
  const categoryStats = useMemo(() => {
    const stats: Record<NineBoxCategory, { count: number; percentage: number; employees: Employee[] }> = {
      Star: { count: 0, percentage: 0, employees: [] },
      "High Potential": { count: 0, percentage: 0, employees: [] },
      Enigma: { count: 0, percentage: 0, employees: [] },
      "High Performer": { count: 0, percentage: 0, employees: [] },
      "Core Player": { count: 0, percentage: 0, employees: [] },
      Dilemma: { count: 0, percentage: 0, employees: [] },
      Solid: { count: 0, percentage: 0, employees: [] },
      Effective: { count: 0, percentage: 0, employees: [] },
      Risk: { count: 0, percentage: 0, employees: [] },
    };

    const total = filteredEmployees.length;
    if (total === 0) {
      // Driven by the live evaluation: the predicted box reads 100%.
      if (livePrediction) {
        const cat = levelsToCategory(
          livePrediction.performance_level_score,
          livePrediction.potential_level_score,
        );
        stats[cat].count = 1;
        stats[cat].percentage = 100;
      }
      return stats;
    }

    filteredEmployees.forEach(emp => {
      const cat = getNineBoxCategory(emp.performance_score, emp.potential_score);
      stats[cat].count += 1;
      stats[cat].employees.push(emp);
    });

    Object.keys(stats).forEach(key => {
      const cat = key as NineBoxCategory;
      stats[cat].percentage = Math.round((stats[cat].count / total) * 100);
    });

    return stats;
  }, [filteredEmployees, livePrediction]);

  // Handle category / node selection
  const selectedCategoryEmployees = categoryStats[selectedCategory]?.employees || [];
  const activeEmployee = useMemo(() => {
    if (selectedEmployeeId) {
      const emp = selectedCategoryEmployees.find(e => e.employee_id === selectedEmployeeId);
      if (emp) return emp;
    }
    return selectedCategoryEmployees[0] || null;
  }, [selectedEmployeeId, selectedCategoryEmployees]);

  // AI Insight is generated from the live evaluation result.
  const aiInsight = useMemo(() => {
    if (!livePrediction) {
      return { text: "", growthRec: "", retentionRec: "", promotionInsight: "", predictiveObs: "" };
    }
    const category = levelsToCategory(
      livePrediction.performance_level_score,
      livePrediction.potential_level_score,
    );
    const confidencePct = Math.round(livePrediction.confidence_score * 100);
    return {
      text: `This candidate is classified as '${livePrediction.nine_box_position_label}' (grid ${livePrediction.position_in_grid}) with ${confidencePct}% model confidence.`,
      growthRec: livePrediction.descriptive_recommendation,
      retentionRec: deriveRetentionRisk(category) === "High"
        ? "Elevated attrition risk — schedule a stay interview and clarify a development path."
        : deriveRetentionRisk(category) === "Medium"
          ? "Moderate risk — provide stretch assignments and regular check-ins."
          : "Low risk — keep engaged with growth opportunities.",
      promotionInsight: `Performance level ${livePrediction.performance_level_score}/2 · Potential level ${livePrediction.potential_level_score}/2.`,
      predictiveObs: `Model confidence in this placement is ${confidencePct}%.`,
    };
  }, [livePrediction]);

  // Confidence + retention derived from the live result.
  const liveConfidencePct = livePrediction ? Math.round(livePrediction.confidence_score * 100) : null;
  const liveRetention = livePrediction
    ? deriveRetentionRisk(levelsToCategory(livePrediction.performance_level_score, livePrediction.potential_level_score))
    : null;

  // Export functions
  const handleExport = (format: "csv" | "json" | "report") => {
    setShowExportOptions(false);
    
    let content = "";
    let filename = `Growth_Potential_${selectedDept}_${selectedCohort}`;

    if (format === "json") {
      content = JSON.stringify(filteredEmployees, null, 2);
      filename += ".json";
    } else if (format === "csv") {
      const headers = ["Employee ID", "Name", "Department", "Role", "Performance Score", "Potential Score", "Engagement Score", "Retention Risk", "Promotion Readiness", "Leadership Index", "Nine-Box Category"];
      const rows = filteredEmployees.map(emp => [
        emp.employee_id,
        emp.employee_name,
        emp.department,
        emp.role,
        emp.performance_score,
        emp.potential_score,
        emp.engagement_score,
        emp.retention_risk,
        emp.promotion_readiness,
        emp.leadership_index,
        getNineBoxCategory(emp.performance_score, emp.potential_score)
      ]);
      content = [headers.join(","), ...rows.map(r => r.map(val => `"${val}"`).join(","))].join("\n");
      filename += ".csv";
    } else {
      // Report ready
      content = `AI MENTOR - TALENT GROWTH POTENTIAL REPORT\n`;
      content += `==========================================\n`;
      content += `Department: ${selectedDept}\n`;
      content += `Cohort: ${selectedCohort}\n`;
      content += `Total Employees Evaluated: ${filteredEmployees.length}\n\n`;
      content += `Nine-Box Breakdown:\n`;
      Object.entries(categoryStats).forEach(([cat, stat]) => {
        content += `- ${cat}: ${stat.count} employee(s) (${stat.percentage}%)\n`;
      });
      content += `\nEmployee Detail List:\n`;
      filteredEmployees.forEach(emp => {
        content += `[${emp.employee_id}] ${emp.employee_name} | Role: ${emp.role} | Perf: ${emp.performance_score} | Pot: ${emp.potential_score} | Category: ${getNineBoxCategory(emp.performance_score, emp.potential_score)}\n`;
      });
      filename += "_report.txt";
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                Growth Potential Dashboard
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Input source</p>
          <ModeSwitch mode={mode} onChange={(m) => { setMode(m); handleLiveReset(); }} />
        </div>

        {mode === "manual" ? (
          <NineBoxPredictionPanel onResult={handleLiveResult} onReset={handleLiveReset} />
        ) : (
          <CsvModePanel
            module="growth"
            label="Growth Potential"
            onSingleResult={(p) => handleLiveResult(p as NineBoxPredictionResponse)}
            onSingleClear={handleLiveReset}
          />
        )}

        {/* Live evaluation banner — drives the dashboard below */}
        {livePrediction && (
          <section className="rounded-xl border border-cyan-400/40 bg-cyan-500/10 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-cyan-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#101416]">
                Live Evaluation
              </span>
              <span className="text-lg font-bold text-[var(--app-text)]">
                {livePrediction.nine_box_position_label}
              </span>
              <span className="font-mono text-xs text-cyan-300">
                Grid {livePrediction.position_in_grid} · Perf {livePrediction.performance_level_score} · Potential {livePrediction.potential_level_score}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-200">
              <span className="font-semibold text-cyan-300">Recommendation: </span>
              {livePrediction.descriptive_recommendation}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              The matrix and breakdown below are highlighting the <span className="font-semibold text-cyan-300">{selectedCategory}</span> box for this candidate. Edit values above and re-evaluate to refresh.
            </p>
          </section>
        )}
        
        {/* Fresh state: nothing is shown until the user runs an evaluation */}
        {!livePrediction && (
          <section className="rounded-xl border border-dashed border-[var(--app-border)]/30 bg-[var(--app-card2)]/40 p-12 text-center">
            <p className="text-sm text-slate-400">
              Enter candidate metrics above and click{" "}
              <span className="font-semibold text-cyan-300">Evaluate 9-Box Position</span> to
              populate the Growth Potential dashboard.
            </p>
          </section>
        )}

        {/* The full dashboard only renders from a live evaluation result */}
        {livePrediction && (
          <>
        {/* Dynamic header row with title, description, and filter toolbar */}
        <section className="flex flex-col xl:flex-row justify-between items-start xl:items-center border-b border-[var(--app-border)]/15 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-[var(--app-text)] tracking-tighter uppercase drop-shadow-[0_0_12px_rgba(195,245,255,0.1)]">
              Growth Potential
            </h1>
            <p className="text-[10px] text-slate-400 font-headline uppercase tracking-[0.2em] mt-1">
              Performance vs. Potential Mapping
            </p>
          </div>

          {/* Filtering and Export Tools */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Department Dropdown */}
            <div className="flex items-center gap-2 bg-[var(--app-card)] rounded px-3 py-1.5 border border-[var(--app-border)]/20">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-headline">Department</span>
              <select 
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setSelectedEmployeeId(null);
                }}
                className="bg-transparent border-none outline-none text-xs font-semibold text-[var(--app-text)] cursor-pointer pr-4 font-headline uppercase tracking-wider"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept} className="bg-[var(--app-card)] text-[var(--app-text)]">{dept}</option>
                ))}
              </select>
            </div>

            {/* Cohort Dropdown */}
            <div className="flex items-center gap-2 bg-[var(--app-card)] rounded px-3 py-1.5 border border-[var(--app-border)]/20">
              <span className="text-[9px] uppercase tracking-wider text-slate-500 font-headline">Cohort</span>
              <select 
                value={selectedCohort}
                onChange={(e) => {
                  setSelectedCohort(e.target.value);
                  setSelectedEmployeeId(null);
                }}
                className="bg-transparent border-none outline-none text-xs font-semibold text-[var(--app-text)] cursor-pointer pr-4 font-headline uppercase tracking-wider"
              >
                {cohorts.map(cohort => (
                  <option key={cohort} value={cohort} className="bg-[var(--app-card)] text-[var(--app-text)]">{cohort}</option>
                ))}
              </select>
            </div>

            {/* Export dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowExportOptions(!showExportOptions)}
                className="px-4 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-[#101416] rounded font-headline text-[10px] font-bold tracking-[0.15em] uppercase flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,229,255,0.25)]"
              >
                <Download className="w-3.5 h-3.5" />
                Export Analysis
                <ChevronDown className="w-3 h-3" />
              </button>

              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-[var(--app-card)] border border-[var(--app-border)]/30 rounded shadow-2xl z-50 overflow-hidden">
                  <button 
                    onClick={() => handleExport("csv")}
                    className="w-full text-left px-4 py-2 text-[10px] uppercase font-bold tracking-wider hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                  >
                    CSV format
                  </button>
                  <button 
                    onClick={() => handleExport("json")}
                    className="w-full text-left px-4 py-2 text-[10px] uppercase font-bold tracking-wider hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                  >
                    JSON format
                  </button>
                  <button 
                    onClick={() => handleExport("report")}
                    className="w-full text-left px-4 py-2 text-[10px] uppercase font-bold tracking-wider hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors border-t border-[var(--app-border)]/10"
                  >
                    Report summary
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Primary dashboard content layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main 9-Box Grid Section */}
          <section className="lg:col-span-8 bg-[var(--app-card2)]/40 rounded-xl p-6 border border-[var(--app-border)]/20 relative flex flex-col min-h-[500px]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400/20 via-transparent to-transparent"></div>

            {/* Matrix Frame Container */}
            <div className="flex-1 flex flex-col justify-between relative pl-8 pb-8">
              
              {/* Y-Axis Label */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -rotate-90 origin-left flex items-center gap-2">
                <span className="text-[10px] font-headline uppercase tracking-[0.25em] text-slate-500 font-bold">POTENTIAL</span>
                <span className="h-0.5 w-16 bg-[var(--app-border)]/20"></span>
              </div>

              {/* Y-Axis Tick Marks */}
              <div className="absolute left-4 h-full flex flex-col justify-around py-6 text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                <span>HIGH</span>
                <span>MEDIUM</span>
                <span>LOW</span>
              </div>

              {/* Grid 9-Box mapping */}
              <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-2.5">
                
                {/* ROW 1: HIGH POTENTIAL */}
                {/* 1. Enigma (Low Perf, High Pot) */}
                <div 
                  onClick={() => { setSelectedCategory("Enigma"); setSelectedEmployeeId(null); }}
                  className={`bg-[var(--app-card)]/40 rounded-lg p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedCategory === "Enigma" 
                      ? "border-cyan-400 bg-cyan-950/10 shadow-[0_0_15px_rgba(0,229,255,0.08)]" 
                      : "border-[var(--app-border)]/10 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Enigma</span>
                    <span className="text-xs font-headline font-bold text-slate-400">{categoryStats["Enigma"].percentage}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                    {categoryStats["Enigma"].employees.map(emp => (
                      <span 
                        key={emp.employee_id}
                        title={`${emp.employee_name} (${emp.role})`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory("Enigma"); setSelectedEmployeeId(emp.employee_id); }}
                        className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${
                          selectedEmployeeId === emp.employee_id ? "bg-cyan-400 shadow-[0_0_8px_#00e5ff]" : "bg-yellow-500/80"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 2. High Potential (Medium Perf, High Pot) */}
                <div 
                  onClick={() => { setSelectedCategory("High Potential"); setSelectedEmployeeId(null); }}
                  className={`bg-[var(--app-card)]/40 rounded-lg p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedCategory === "High Potential" 
                      ? "border-cyan-400 bg-cyan-950/10 shadow-[0_0_15px_rgba(0,229,255,0.08)]" 
                      : "border-[var(--app-border)]/10 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] text-cyan-400/80 font-bold uppercase tracking-wider">High Potential</span>
                    <span className="text-xs font-headline font-bold text-cyan-400">{categoryStats["High Potential"].percentage}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                    {categoryStats["High Potential"].employees.map(emp => (
                      <span 
                        key={emp.employee_id}
                        title={`${emp.employee_name} (${emp.role})`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory("High Potential"); setSelectedEmployeeId(emp.employee_id); }}
                        className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${
                          selectedEmployeeId === emp.employee_id ? "bg-cyan-400 shadow-[0_0_8px_#00e5ff]" : "bg-cyan-400/80"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 3. Star (High Perf, High Pot) */}
                <div 
                  onClick={() => { setSelectedCategory("Star"); setSelectedEmployeeId(null); }}
                  className={`bg-[var(--app-card)]/60 rounded-lg p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedCategory === "Star" 
                      ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(0,229,255,0.15)]" 
                      : "border-[var(--app-border)]/20 hover:border-cyan-400/40"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/5 via-transparent to-transparent"></div>
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest glow-text">Star</span>
                    <span className="text-xs font-headline font-bold text-cyan-400 glow-text">{categoryStats["Star"].percentage}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                    {categoryStats["Star"].employees.map(emp => (
                      <span 
                        key={emp.employee_id}
                        title={`${emp.employee_name} (${emp.role})`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory("Star"); setSelectedEmployeeId(emp.employee_id); }}
                        className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${
                          selectedEmployeeId === emp.employee_id ? "bg-white shadow-[0_0_10px_#ffffff]" : "bg-[#44d8f1]"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* ROW 2: MEDIUM POTENTIAL */}
                {/* 4. Dilemma (Low Perf, Med Pot) */}
                <div 
                  onClick={() => { setSelectedCategory("Dilemma"); setSelectedEmployeeId(null); }}
                  className={`bg-[var(--app-card)]/40 rounded-lg p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedCategory === "Dilemma" 
                      ? "border-cyan-400 bg-cyan-950/10 shadow-[0_0_15px_rgba(0,229,255,0.08)]" 
                      : "border-[var(--app-border)]/10 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Dilemma</span>
                    <span className="text-xs font-headline font-bold text-slate-400">{categoryStats["Dilemma"].percentage}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                    {categoryStats["Dilemma"].employees.map(emp => (
                      <span 
                        key={emp.employee_id}
                        title={`${emp.employee_name} (${emp.role})`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory("Dilemma"); setSelectedEmployeeId(emp.employee_id); }}
                        className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${
                          selectedEmployeeId === emp.employee_id ? "bg-cyan-400 shadow-[0_0_8px_#00e5ff]" : "bg-yellow-600/70"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 5. Core Player (Med Perf, Med Pot) */}
                <div 
                  onClick={() => { setSelectedCategory("Core Player"); setSelectedEmployeeId(null); }}
                  className={`bg-[var(--app-card)]/40 rounded-lg p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedCategory === "Core Player" 
                      ? "border-cyan-400 bg-cyan-950/10 shadow-[0_0_15px_rgba(0,229,255,0.08)]" 
                      : "border-[var(--app-border)]/10 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Core Player</span>
                    <span className="text-xs font-headline font-bold text-slate-300">{categoryStats["Core Player"].percentage}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                    {categoryStats["Core Player"].employees.map(emp => (
                      <span 
                        key={emp.employee_id}
                        title={`${emp.employee_name} (${emp.role})`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory("Core Player"); setSelectedEmployeeId(emp.employee_id); }}
                        className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${
                          selectedEmployeeId === emp.employee_id ? "bg-cyan-400 shadow-[0_0_8px_#00e5ff]" : "bg-blue-400/80"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 6. High Performer (High Perf, Med Pot) */}
                <div 
                  onClick={() => { setSelectedCategory("High Performer"); setSelectedEmployeeId(null); }}
                  className={`bg-[var(--app-card)]/40 rounded-lg p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedCategory === "High Performer" 
                      ? "border-cyan-400 bg-cyan-950/10 shadow-[0_0_15px_rgba(0,229,255,0.08)]" 
                      : "border-[var(--app-border)]/10 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">High Performer</span>
                    <span className="text-xs font-headline font-bold text-slate-300">{categoryStats["High Performer"].percentage}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                    {categoryStats["High Performer"].employees.map(emp => (
                      <span 
                        key={emp.employee_id}
                        title={`${emp.employee_name} (${emp.role})`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory("High Performer"); setSelectedEmployeeId(emp.employee_id); }}
                        className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${
                          selectedEmployeeId === emp.employee_id ? "bg-cyan-400 shadow-[0_0_8px_#00e5ff]" : "bg-teal-400/80"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* ROW 3: LOW POTENTIAL */}
                {/* 7. Risk (Low Perf, Low Pot) */}
                <div 
                  onClick={() => { setSelectedCategory("Risk"); setSelectedEmployeeId(null); }}
                  className={`bg-[var(--app-card)]/40 rounded-lg p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedCategory === "Risk" 
                      ? "border-red-500/80 bg-red-950/10 shadow-[0_0_15px_rgba(239,68,68,0.08)]" 
                      : "border-[var(--app-border)]/10 hover:border-red-500/30"
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">Risk</span>
                    <span className="text-xs font-headline font-bold text-red-400">{categoryStats["Risk"].percentage}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                    {categoryStats["Risk"].employees.map(emp => (
                      <span 
                        key={emp.employee_id}
                        title={`${emp.employee_name} (${emp.role})`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory("Risk"); setSelectedEmployeeId(emp.employee_id); }}
                        className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${
                          selectedEmployeeId === emp.employee_id ? "bg-red-400 shadow-[0_0_8px_#ef4444]" : "bg-red-500/80"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 8. Effective (Med Perf, Low Pot) */}
                <div 
                  onClick={() => { setSelectedCategory("Effective"); setSelectedEmployeeId(null); }}
                  className={`bg-[var(--app-card)]/40 rounded-lg p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedCategory === "Effective" 
                      ? "border-cyan-400 bg-cyan-950/10 shadow-[0_0_15px_rgba(0,229,255,0.08)]" 
                      : "border-[var(--app-border)]/10 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Effective</span>
                    <span className="text-xs font-headline font-bold text-slate-400">{categoryStats["Effective"].percentage}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                    {categoryStats["Effective"].employees.map(emp => (
                      <span 
                        key={emp.employee_id}
                        title={`${emp.employee_name} (${emp.role})`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory("Effective"); setSelectedEmployeeId(emp.employee_id); }}
                        className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${
                          selectedEmployeeId === emp.employee_id ? "bg-cyan-400 shadow-[0_0_8px_#00e5ff]" : "bg-slate-500"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* 9. Solid (High Perf, Low Pot) */}
                <div 
                  onClick={() => { setSelectedCategory("Solid"); setSelectedEmployeeId(null); }}
                  className={`bg-[var(--app-card)]/40 rounded-lg p-3.5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    selectedCategory === "Solid" 
                      ? "border-cyan-400 bg-cyan-950/10 shadow-[0_0_15px_rgba(0,229,255,0.08)]" 
                      : "border-[var(--app-border)]/10 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Solid</span>
                    <span className="text-xs font-headline font-bold text-slate-400">{categoryStats["Solid"].percentage}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2 z-10">
                    {categoryStats["Solid"].employees.map(emp => (
                      <span 
                        key={emp.employee_id}
                        title={`${emp.employee_name} (${emp.role})`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCategory("Solid"); setSelectedEmployeeId(emp.employee_id); }}
                        className={`w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 ${
                          selectedEmployeeId === emp.employee_id ? "bg-cyan-400 shadow-[0_0_8px_#00e5ff]" : "bg-slate-400"
                        }`}
                      />
                    ))}
                  </div>
                </div>

              </div>

              {/* X-Axis labels */}
              <div className="absolute bottom-0 left-8 right-0 flex justify-around text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                <span>LOW</span>
                <span>MEDIUM</span>
                <span>HIGH</span>
              </div>

              {/* X-Axis Label */}
              <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="h-0.5 w-16 bg-[var(--app-border)]/20"></span>
                <span className="text-[10px] font-headline uppercase tracking-[0.25em] text-slate-500 font-bold">PERFORMANCE</span>
                <span className="h-0.5 w-16 bg-[var(--app-border)]/20"></span>
              </div>

            </div>
          </section>

          {/* Right Column details */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Top Talent Pool */}
            <div className="bg-[var(--app-card)]/60 rounded-xl p-5 border border-[var(--app-border)]/20 relative overflow-hidden flex flex-col gap-4">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <Award className="w-24 h-24 text-cyan-400" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="px-2.5 py-0.5 bg-cyan-950 text-cyan-400 text-[8px] font-bold uppercase tracking-widest rounded border border-cyan-800/30">
                    9-Box: {selectedCategory}
                  </span>
                </div>
                <h3 className="font-headline text-lg font-bold text-[var(--app-text)]">Top Talent Pool</h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Active candidate metrics and movement indicators within the filtered cohort pool.
                </p>
              </div>

              {/* Core metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--app-bg)]/50 rounded p-2.5 border border-[var(--app-border)]/10">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block mb-0.5">Confidence Score</span>
                  <div className="flex items-end gap-1">
                    <span className="text-lg font-headline font-bold text-cyan-400">
                      {liveConfidencePct !== null ? `${liveConfidencePct}%` : "—"}
                    </span>
                    {liveConfidencePct !== null && (
                      <span className="text-[9px] text-[#44d8f1] mb-0.5 font-bold uppercase">
                        {liveConfidencePct >= 66 ? "High" : liveConfidencePct >= 33 ? "Medium" : "Low"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-[var(--app-bg)]/50 rounded p-2.5 border border-[var(--app-border)]/10">
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider block mb-0.5">Retention Risk</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-sm font-headline font-bold uppercase ${
                      liveRetention === "High" ? "text-red-400" : liveRetention === "Medium" ? "text-yellow-500" : liveRetention === "Low" ? "text-[#44d8f1]" : "text-slate-500"
                    }`}>
                      {liveRetention ?? "—"}
                    </span>
                    {liveRetention === "High" ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    ) : liveRetention ? (
                      <Check className="w-3.5 h-3.5 text-teal-400" />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Movement Trajectory */}
              <div className="space-y-2.5">
                <h4 className="text-[9px] font-label uppercase tracking-widest text-slate-400 font-bold border-b border-[var(--app-border)]/10 pb-1">
                  Movement Trajectory
                </h4>

                <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1">
                  {selectedCategoryEmployees.length === 0 ? (
                    livePrediction ? (
                      <div className="rounded border border-cyan-400/20 bg-cyan-500/5 p-2.5 text-[10px] leading-relaxed text-slate-200">
                        <span className="font-bold text-cyan-300">Evaluated candidate → {selectedCategory}.</span>{" "}
                        {livePrediction.descriptive_recommendation}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic py-2">No employees in selected grid box.</div>
                    )
                  ) : (
                    selectedCategoryEmployees.map(emp => (
                      <div 
                        key={emp.employee_id} 
                        onClick={() => setSelectedEmployeeId(emp.employee_id)}
                        className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition-colors ${
                          activeEmployee?.employee_id === emp.employee_id 
                            ? "bg-cyan-500/10 border border-cyan-400/20" 
                            : "hover:bg-[var(--app-bg)]/40"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[var(--app-surface)] flex items-center justify-center border border-outline-variant/20">
                            <User className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-[var(--app-text)] font-medium">{emp.employee_name}</span>
                            <span className="text-[9px] text-slate-400">{emp.role}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[8px] text-[#44d8f1] font-mono">L-Index: {emp.leadership_index}</span>
                          <TrendingUp className="w-3 h-3 text-cyan-400" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button 
                onClick={() => alert(`Initiating action plan for ${activeEmployee ? activeEmployee.employee_name : "selected pool"}`)}
                className="mt-2 w-full py-2.5 bg-gradient-to-r from-cyan-400 to-teal-500 text-[#101416] rounded font-headline text-[10px] font-bold tracking-widest uppercase hover:opacity-90 transition-opacity shadow-[0_0_20px_-5px_rgba(0,229,255,0.4)]"
              >
                Initiate Action Plan
              </button>
            </div>

            {/* Cohort Breakdown */}
            <div className="bg-[var(--app-card)]/40 rounded-xl p-5 border border-[var(--app-border)]/20 flex flex-col gap-3">
              <h3 className="text-xs text-[var(--app-text)] font-headline tracking-[0.1em] uppercase border-b border-[var(--app-border)]/10 pb-1.5">
                Cohort Breakdown
              </h3>

              <div className="grid grid-cols-1 gap-2.5">
                {/* Star Card */}
                <div 
                  onClick={() => setSelectedCategory("Star")}
                  className={`p-2.5 rounded border transition-colors cursor-pointer ${
                    selectedCategory === "Star" ? "bg-cyan-950/20 border-cyan-400" : "bg-[var(--app-bg)]/30 border-[var(--app-border)]/10 hover:border-cyan-400/20"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[var(--app-text)] uppercase tracking-wider">Star</span>
                    <span className="text-xs font-headline font-bold text-cyan-400">{categoryStats["Star"].percentage}%</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Consistently high performers with high potential. Ready for leadership/fast-track.
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/30 text-[7px] font-bold tracking-wider rounded uppercase">Mentorship</span>
                    <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/30 text-[7px] font-bold tracking-wider rounded uppercase">Fast-Track</span>
                  </div>
                </div>

                {/* High Potential Card */}
                <div 
                  onClick={() => setSelectedCategory("High Potential")}
                  className={`p-2.5 rounded border transition-colors cursor-pointer ${
                    selectedCategory === "High Potential" ? "bg-cyan-950/20 border-cyan-400" : "bg-[var(--app-bg)]/30 border-[var(--app-border)]/10 hover:border-cyan-400/20"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[var(--app-text)] uppercase tracking-wider">High Potential</span>
                    <span className="text-xs font-headline font-bold text-cyan-400">{categoryStats["High Potential"].percentage}%</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Moderate performance but high potential. Needs development to reach full capacity.
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="px-1.5 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/30 text-[7px] font-bold tracking-wider rounded uppercase">Skills Bootcamps</span>
                  </div>
                </div>

                {/* Core Player Card */}
                <div 
                  onClick={() => setSelectedCategory("Core Player")}
                  className={`p-2.5 rounded border transition-colors cursor-pointer ${
                    selectedCategory === "Core Player" ? "bg-cyan-950/20 border-cyan-400" : "bg-[var(--app-bg)]/30 border-[var(--app-border)]/10 hover:border-cyan-400/20"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[var(--app-text)] uppercase tracking-wider">Core Player</span>
                    <span className="text-xs font-headline font-bold text-cyan-400">{categoryStats["Core Player"].percentage}%</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Steady, reliable performers. The backbone of the organization. Moderate potential.
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 text-[7px] font-bold tracking-wider rounded uppercase">Retention Plan</span>
                  </div>
                </div>

                {/* Risk Card */}
                <div 
                  onClick={() => setSelectedCategory("Risk")}
                  className={`p-2.5 rounded border transition-colors cursor-pointer ${
                    selectedCategory === "Risk" ? "bg-red-950/20 border-red-500" : "bg-[var(--app-bg)]/30 border-[var(--app-border)]/10 hover:border-red-500/20"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-[var(--app-text)] uppercase tracking-wider">Risk</span>
                    <span className="text-xs font-headline font-bold text-red-400">{categoryStats["Risk"].percentage}%</span>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    Low performance and low potential. Requires immediate intervention or reassignment.
                  </p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="px-1.5 py-0.5 bg-red-950/40 text-red-400 border border-red-800/30 text-[7px] font-bold tracking-wider rounded uppercase">PIP Intervention</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insights Panel */}
            <div className="bg-[var(--app-card)]/40 rounded-xl p-5 border border-[var(--app-border)]/20 flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="text-cyan-400 w-4.5 h-4.5" />
                <span className="text-xs font-label uppercase tracking-widest text-cyan-400 font-bold">Aetheris Insight</span>
              </div>
              
              <div className="space-y-3 text-xs leading-relaxed text-slate-300">
                <p className="italic text-slate-400">
                  "{aiInsight.text}"
                </p>
                <div className="border-t border-[var(--app-border)]/15 pt-2.5 space-y-2">
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-cyan-400 block">Growth Recommendation</span>
                    <span className="text-[11px] text-slate-300">{aiInsight.growthRec}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-cyan-400 block">Retention Plan</span>
                    <span className="text-[11px] text-slate-300">{aiInsight.retentionRec}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-cyan-400 block">Promotion Track</span>
                    <span className="text-[11px] text-slate-300">{aiInsight.promotionInsight}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-cyan-400 block">Predictive Observation</span>
                    <span className="text-[11px] text-slate-300">{aiInsight.predictiveObs}</span>
                  </div>
                </div>
              </div>
            </div>

          </aside>
        </div>
          </>
        )}

      </main>

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
