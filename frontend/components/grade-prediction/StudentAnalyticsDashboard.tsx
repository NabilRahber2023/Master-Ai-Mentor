"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Chart from "chart.js/auto";
import styles from "./StudentAnalyticsDashboard.module.css";

const PIPELINE_STEPS = [
    "Data loaded",
    "Segmented",
    "Predict",
    "Filter",
    "Prescribe",
    "Forecast",
];

type DashboardFilters = {
    department?: string;
    category?: string;
    parental_support?: string;
    min_study_hours?: number;
    min_attendance?: number;
};

type DashboardStudent = {
    student_id: number;
    name: string;
    department: string;
    gender: string;
    parental_support: string;
    active_participation: string;
    previous_sgpa: number;
    ssc_gpa: number;
    hsc_gpa: number;
    study_hours_per_day: number;
    attendance_rate: number;
    part_time_hours: number;
    category: string;
    predicted_sgpa: number;
    status: string;
};

type DashboardResponse = {
    overview: {
        total_students: number;
        high_count: number;
        mid_count: number;
        low_count: number;
        avg_previous_sgpa: number;
        avg_study_hours: number;
        avg_attendance: number;
    };
    category_distribution: { high: number; mid: number; low: number };
    gender_split: { male: number; female: number };
    departments: Array<{
        department: string;
        avg_previous_sgpa: number;
        avg_predicted_sgpa: number;
        count: number;
    }>;
    prediction_summary: {
        filtered_count: number;
        on_track: number;
        at_risk: number;
        avg_predicted: number;
        pass_rate: number;
    };
    prediction_distribution: Array<{ label: string; count: number }>;
    students: DashboardStudent[];
    prescriptions: Array<{
        student_id: number;
        name: string;
        department: string;
        category: string;
        predicted_sgpa: number;
        recommendations: string[];
    }>;
    forecast: {
        labels: string[];
        history: number[];
        forecast: number[];
        t1: number;
        t2: number;
        t3: number;
        target: number;
        mode: string;
        cohort_plan?: string[];
    };
};

const defaultFilters: DashboardFilters = {
    department: "",
    category: "",
    parental_support: "",
    min_study_hours: 0,
    min_attendance: 0,
};

function getPipelineClass(index: number, stage: number) {
    if (index < stage) return `${styles.pipeStep} ${styles.pipeStepDone}`;
    if (index === stage) return `${styles.pipeStep} ${styles.pipeStepActive}`;
    return styles.pipeStep;
}

export function StudentAnalyticsDashboard() {
    const [data, setData] = useState<DashboardResponse | null>(null);
    const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);
    const [forecastMode, setForecastMode] = useState<"ma" | "reg">("ma");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pipelineStage, setPipelineStage] = useState(2);
    const [showPrescriptions, setShowPrescriptions] = useState(false);
    const [csvUploading, setCsvUploading] = useState(false);

    const catChartRef = useRef<HTMLCanvasElement | null>(null);
    const genderChartRef = useRef<HTMLCanvasElement | null>(null);
    const deptChartRef = useRef<HTMLCanvasElement | null>(null);
    const predDistRef = useRef<HTMLCanvasElement | null>(null);
    const predScatterRef = useRef<HTMLCanvasElement | null>(null);
    const forecastChartRef = useRef<HTMLCanvasElement | null>(null);
    const chartsRef = useRef<Record<string, Chart>>({});

    const deptOptions = useMemo(() => {
        if (!data) return [];
        return data.departments.map((dept) => dept.department);
    }, [data]);

    async function loadDashboard(nextFilters: DashboardFilters, nextMode: "ma" | "reg") {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${apiBase}/api/v1/prediction/sgpa/dashboard`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    data_source: "demo",
                    forecast_mode: nextMode,
                    limit: 200,
                    filters: {
                        department: nextFilters.department || undefined,
                        category: nextFilters.category || undefined,
                        parental_support: nextFilters.parental_support || undefined,
                        min_study_hours: nextFilters.min_study_hours || 0,
                        min_attendance: nextFilters.min_attendance || 0,
                    },
                }),
            });
            if (!response.ok) {
                throw new Error(`Request failed (${response.status})`);
            }
            const payload = (await response.json()) as DashboardResponse;
            setData(payload);
            setShowPrescriptions(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
        } finally {
            setLoading(false);
        }
    }

    async function handleCsvUpload(file: File) {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "";
        setCsvUploading(true);
        setError(null);
        try {
            // Read file locally to obtain rows for merging with predictions
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
            if (lines.length < 2) throw new Error("CSV must include header and at least one row");
            const headers = lines[0].split(",").map((h) => h.trim());
            const rows = lines.slice(1).map((line) => {
                const cols = line.split(",");
                const obj: Record<string, string> = {};
                headers.forEach((h, i) => (obj[h] = (cols[i] ?? "").trim()));
                return obj;
            });

            // Upload file to backend batch endpoint to get predictions (order preserved)
            const form = new FormData();
            form.append("file", file, file.name);
            const resp = await fetch(`${apiBase}/api/v1/prediction/sgpa/batch`, {
                method: "POST",
                body: form,
            });
            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(`Batch prediction failed: ${resp.status} ${txt}`);
            }
            const predictions = await resp.json();

            // Merge rows + predictions into dashboard students
            const mergedStudents = rows.map((r, idx) => {
                const pred = predictions[idx] || { predicted_sgpa: 0, risk_level: "", contributing_factors: [] };
                const previous_sgpa = Number(r.Previous_SGPA || r.Previous_SGPA || r.Previous_SGPA || r.Previous_SGPA || r.Previous_SGPA || r.Previous_SGPA || r.Previous_SGPA || r.previous_sgpa || r.Previous || 0) || Number(r.Previous_SGPA) || 0;
                const student = {
                    student_id: idx + 1,
                    name: r.Name || `Student ${idx + 1}`,
                    department: r.Department || r.Department || "Unknown",
                    gender: r.Gender || r.gender || "Male",
                    parental_support: r.Parental_Support || r.Parental_Support || "None",
                    active_participation: r.Active_Participation || r.Active_Participation || "Moderate",
                    previous_sgpa: Number(r.Previous_SGPA ?? r.Previous_SGPA ?? r.previous_sgpa) || 0,
                    ssc_gpa: Number(r.SSC_GPA ?? r.SSC_GPA ?? r.ssc_gpa) || 0,
                    hsc_gpa: Number(r.HSC_GPA ?? r.HSC_GPA ?? r.hsc_gpa) || 0,
                    study_hours_per_day: Number(r.Study_Hours_Per_Day ?? r.Study_Hours_Per_Day ?? r.study_hours_per_day) || 0,
                    attendance_rate: Number(r.Attendance_Rate ?? r.Attendance_Rate ?? r.attendance_rate) || 0,
                    part_time_hours: Number(r.Part_Time_Hours ?? r.Part_Time_Hours ?? r.part_time_hours) || 0,
                    category: r.Previous_SGPA ? (Number(r.Previous_SGPA) >= 3.5 ? "High" : Number(r.Previous_SGPA) >= 2.5 ? "Mid" : "Low") : "Mid",
                    predicted_sgpa: Number(pred.predicted_sgpa ?? 0),
                    status: Number(pred.predicted_sgpa ?? 0) >= 3.5 ? "On track" : "At risk",
                } as any;
                return student;
            });

            // Build simple dashboard payload from mergedStudents (reuse server logic pattern)
            const total_students = mergedStudents.length;
            const high_count = mergedStudents.filter((s) => s.category === "High").length;
            const mid_count = mergedStudents.filter((s) => s.category === "Mid").length;
            const low_count = mergedStudents.filter((s) => s.category === "Low").length;
            const avg_prev = total_students ? Number((mergedStudents.reduce((a, b) => a + Number(b.previous_sgpa), 0) / total_students).toFixed(2)) : 0;
            const avg_study = total_students ? Number((mergedStudents.reduce((a, b) => a + Number(b.study_hours_per_day), 0) / total_students).toFixed(1)) : 0;
            const avg_attendance = total_students ? Math.round(mergedStudents.reduce((a, b) => a + Number(b.attendance_rate), 0) / total_students) : 0;

            const overview = {
                total_students,
                high_count,
                mid_count,
                low_count,
                avg_previous_sgpa: avg_prev,
                avg_study_hours: avg_study,
                avg_attendance,
            };

            const category_distribution = { high: high_count, mid: mid_count, low: low_count };
            const gender_split = { male: mergedStudents.filter((s) => s.gender === "Male").length, female: mergedStudents.filter((s) => s.gender === "Female").length };

            const deptMap: Record<string, { prev: number; pred: number; count: number }> = {};
            mergedStudents.forEach((s) => {
                const d = s.department || "Unknown";
                if (!deptMap[d]) deptMap[d] = { prev: 0, pred: 0, count: 0 };
                deptMap[d].prev += Number(s.previous_sgpa);
                deptMap[d].pred += Number(s.predicted_sgpa);
                deptMap[d].count += 1;
            });
            const departments = Object.keys(deptMap).sort().map((k) => ({ department: k, avg_previous_sgpa: Number((deptMap[k].prev / deptMap[k].count).toFixed(2)), avg_predicted_sgpa: Number((deptMap[k].pred / deptMap[k].count).toFixed(2)), count: deptMap[k].count }));

            const on_track = mergedStudents.filter((s) => s.predicted_sgpa >= 3.5).length;
            const at_risk = total_students - on_track;
            const avg_predicted = total_students ? Number((mergedStudents.reduce((a, b) => a + Number(b.predicted_sgpa), 0) / total_students).toFixed(2)) : 0;
            const pass_rate = total_students ? Math.round((on_track / total_students) * 100) : 0;

            const prediction_summary = { filtered_count: total_students, on_track, at_risk, avg_predicted, pass_rate };

            const bins = ["1.0-1.9", "2.0-2.4", "2.5-2.9", "3.0-3.4", "3.5-3.9", "4.0"];
            const prediction_distribution = bins.map((label) => ({ label, count: 0 }));
            mergedStudents.forEach((s) => {
                const v = Number(s.predicted_sgpa);
                if (v >= 1.0 && v < 2.0) prediction_distribution[0].count++;
                else if (v >= 2.0 && v < 2.5) prediction_distribution[1].count++;
                else if (v >= 2.5 && v < 3.0) prediction_distribution[2].count++;
                else if (v >= 3.0 && v < 3.5) prediction_distribution[3].count++;
                else if (v >= 3.5 && v < 4.0) prediction_distribution[4].count++;
                else prediction_distribution[5].count++;
            });

            const prescriptions = mergedStudents.filter((s) => s.predicted_sgpa < 3.5).map((s) => ({ student_id: s.student_id, name: s.name, department: s.department, category: s.category, predicted_sgpa: s.predicted_sgpa, recommendations: [] }));

            const base = total_students ? mergedStudents.reduce((a, b) => a + Number(b.previous_sgpa), 0) / total_students : 0;
            const history = [Number((base - 0.24).toFixed(2)), Number((base - 0.16).toFixed(2)), Number((base - 0.07).toFixed(2)), Number((base + 0.01).toFixed(2)), Number(base.toFixed(2))];
            const t1 = Number(((history[2] + history[3] + history[4]) / 3).toFixed(2));
            const t2 = Number(((history[3] + history[4] + t1) / 3).toFixed(2));
            const t3 = Number(((history[4] + t1 + t2) / 3).toFixed(2));
            const forecast = { labels: ["Term -4", "Term -3", "Term -2", "Term -1", "Current", "T+1", "T+2", "T+3"], history, forecast: [history[4], t1, t2, t3], t1, t2, t3, target: 3.5, mode: "ma", cohort_plan: [] };

            const payload = {
                overview,
                category_distribution,
                gender_split,
                departments,
                prediction_summary,
                prediction_distribution,
                students: mergedStudents,
                prescriptions,
                forecast,
            } as any;

            setData(payload);
            setPipelineStage(3);
            setShowPrescriptions(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setCsvUploading(false);
        }
    }

    useEffect(() => {
        loadDashboard(filters, forecastMode);
    }, []);

    useEffect(() => {
        if (!data) return;

        const destroy = (key: string) => {
            if (chartsRef.current[key]) {
                chartsRef.current[key].destroy();
                delete chartsRef.current[key];
            }
        };

        const buildCategoryChart = () => {
            destroy("cat");
            if (!catChartRef.current) return;
            const { high, mid, low } = data.category_distribution;
            chartsRef.current.cat = new Chart(catChartRef.current, {
                type: "bar",
                data: {
                    labels: ["High (>=3.5)", "Mid (2.5-3.49)", "Low (<2.5)"],
                    datasets: [
                        {
                            label: "Students",
                            data: [high, mid, low],
                            backgroundColor: ["#639922", "#BA7517", "#E24B4A"],
                            borderColor: ["#3B6D11", "#854F0B", "#A32D2D"],
                            borderWidth: 1,
                            borderRadius: 6,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { ticks: { precision: 0 } },
                    },
                },
            });
        };

        const buildGenderChart = () => {
            destroy("gender");
            if (!genderChartRef.current) return;
            chartsRef.current.gender = new Chart(genderChartRef.current, {
                type: "doughnut",
                data: {
                    labels: ["Male", "Female"],
                    datasets: [
                        {
                            data: [data.gender_split.male, data.gender_split.female],
                            backgroundColor: ["#3266ad", "#D85A30"],
                            borderWidth: 0,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: "65%",
                    plugins: { legend: { position: "right" } },
                },
            });
        };

        const buildDepartmentChart = () => {
            destroy("dept");
            if (!deptChartRef.current) return;
            chartsRef.current.dept = new Chart(deptChartRef.current, {
                type: "bar",
                data: {
                    labels: data.departments.map((d) => d.department),
                    datasets: [
                        {
                            label: "Prev SGPA",
                            data: data.departments.map((d) => d.avg_previous_sgpa),
                            backgroundColor: "rgba(50,102,173,0.7)",
                            borderColor: "#185FA5",
                            borderWidth: 1,
                            borderRadius: 4,
                        },
                        {
                            label: "Predicted SGPA",
                            data: data.departments.map((d) => d.avg_predicted_sgpa),
                            backgroundColor: "rgba(99,153,34,0.7)",
                            borderColor: "#3B6D11",
                            borderWidth: 1,
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { min: 2, max: 4.1 },
                    },
                },
            });
        };

        const buildPredictionDistribution = () => {
            destroy("predDist");
            if (!predDistRef.current) return;
            chartsRef.current.predDist = new Chart(predDistRef.current, {
                type: "bar",
                data: {
                    labels: data.prediction_distribution.map((bin) => bin.label),
                    datasets: [
                        {
                            label: "Students",
                            data: data.prediction_distribution.map((bin) => bin.count),
                            backgroundColor: data.prediction_distribution.map((bin, i) =>
                                i >= 4 ? "#639922" : i >= 3 ? "#BA7517" : "#E24B4A"
                            ),
                            borderWidth: 0,
                            borderRadius: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { ticks: { precision: 0 } },
                    },
                },
            });
        };

        const buildPredictionScatter = () => {
            destroy("predScatter");
            if (!predScatterRef.current) return;
            const sample = data.students.filter((_, i) => i % 2 === 0).slice(0, 60);
            chartsRef.current.predScatter = new Chart(predScatterRef.current, {
                type: "scatter",
                data: {
                    datasets: [
                        {
                            label: "On-track",
                            data: sample
                                .filter((s) => s.predicted_sgpa >= 3.5)
                                .map((s) => ({ x: s.previous_sgpa, y: s.predicted_sgpa })),
                            backgroundColor: "rgba(99,153,34,0.6)",
                            pointRadius: 4,
                        },
                        {
                            label: "At-risk",
                            data: sample
                                .filter((s) => s.predicted_sgpa < 3.5)
                                .map((s) => ({ x: s.previous_sgpa, y: s.predicted_sgpa })),
                            backgroundColor: "rgba(226,75,74,0.6)",
                            pointRadius: 4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { min: 1.5, max: 4.1 },
                        y: { min: 1.5, max: 4.1 },
                    },
                },
            });
        };

        const buildForecast = () => {
            destroy("forecast");
            if (!forecastChartRef.current) return;
            const histData = [...data.forecast.history, null, null, null];
            const forecastData = [
                null,
                null,
                null,
                null,
                data.forecast.history[4] ?? null,
                data.forecast.t1,
                data.forecast.t2,
                data.forecast.t3,
            ];
            chartsRef.current.forecast = new Chart(forecastChartRef.current, {
                type: "line",
                data: {
                    labels: data.forecast.labels,
                    datasets: [
                        {
                            label: "Historical",
                            data: histData,
                            borderColor: "#3266ad",
                            backgroundColor: "rgba(50,102,173,0.08)",
                            tension: 0.4,
                            fill: true,
                            pointRadius: 5,
                            pointBackgroundColor: "#3266ad",
                            borderWidth: 2,
                        },
                        {
                            label: "Forecast",
                            data: forecastData,
                            borderColor: "#E24B4A",
                            backgroundColor: "rgba(226,75,74,0.07)",
                            tension: 0.4,
                            fill: true,
                            pointRadius: 5,
                            pointBackgroundColor: "#E24B4A",
                            borderWidth: 2,
                            borderDash: [6, 3],
                        },
                        {
                            label: "Target (3.5)",
                            data: Array(8).fill(3.5),
                            borderColor: "#639922",
                            borderDash: [4, 4],
                            pointRadius: 0,
                            borderWidth: 1.5,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false } },
                        y: { min: 2.0, max: 4.1 },
                    },
                },
            });
        };

        buildCategoryChart();
        buildGenderChart();
        buildDepartmentChart();
        buildPredictionDistribution();
        buildPredictionScatter();
        buildForecast();

        return () => {
            Object.keys(chartsRef.current).forEach((key) => destroy(key));
        };
    }, [data]);

    const highPercent = data ? Math.round((data.overview.high_count / data.overview.total_students) * 100) : 0;
    const midPercent = data ? Math.round((data.overview.mid_count / data.overview.total_students) * 100) : 0;
    const lowPercent = data ? Math.round((data.overview.low_count / data.overview.total_students) * 100) : 0;

    if (loading) {
        return <div className={styles.noData}>Loading dashboard...</div>;
    }

    if (error) {
        return <div className={styles.noData}>{error}</div>;
    }

    if (!data) {
        return <div className={styles.noData}>No data available.</div>;
    }

    return (
        <div className={styles.dash}>
            <div className={styles.pipeline}>
                {PIPELINE_STEPS.map((step, index) => (
                    <span key={step} className={getPipelineClass(index, pipelineStage)}>
                        {step}
                    </span>
                ))}
            </div>

            <div className={styles.section}>
                <div className={styles.secTitle}>Upload CSV (no DB required)</div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleCsvUpload(f);
                        }}
                    />
                    <button
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => {
                            // reopen demo dashboard
                            setPipelineStage(2);
                            loadDashboard(filters, forecastMode);
                        }}
                    >
                        Load demo
                    </button>
                    {csvUploading && <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Uploading CSV...</span>}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.secTitle}>Dataset overview — {data.overview.total_students} students</div>
                <div className={styles.metricGrid}>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>Total students</div>
                        <div className={styles.metricVal}>{data.overview.total_students}</div>
                    </div>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>High (&ge;3.5)</div>
                        <div className={`${styles.metricVal} ${styles.green}`}>{data.overview.high_count}</div>
                    </div>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>Mid (2.5-3.49)</div>
                        <div className={`${styles.metricVal} ${styles.amber}`}>{data.overview.mid_count}</div>
                    </div>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>Low (&lt;2.5)</div>
                        <div className={`${styles.metricVal} ${styles.red}`}>{data.overview.low_count}</div>
                    </div>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>Avg SGPA</div>
                        <div className={`${styles.metricVal} ${styles.blue}`}>{data.overview.avg_previous_sgpa.toFixed(2)}</div>
                    </div>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>Avg study hrs</div>
                        <div className={styles.metricVal}>{data.overview.avg_study_hours.toFixed(1)} hrs</div>
                    </div>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>Avg attendance</div>
                        <div className={styles.metricVal}>{data.overview.avg_attendance}%</div>
                    </div>
                </div>

                <div className={styles.secTitle} style={{ marginBottom: "4px" }}>
                    Category distribution
                </div>
                <div className={styles.segBar}>
                    <div style={{ background: "#639922", width: `${highPercent}%`, transition: "width 0.6s" }} />
                    <div style={{ background: "#BA7517", width: `${midPercent}%`, transition: "width 0.6s" }} />
                    <div style={{ background: "#E24B4A", width: `${lowPercent}%`, transition: "width 0.6s" }} />
                </div>
                <div className={styles.leg}>
                    <span><span className={styles.dot} style={{ background: "#639922" }} />High — {data.overview.high_count} ({highPercent}%)</span>
                    <span><span className={styles.dot} style={{ background: "#BA7517" }} />Mid — {data.overview.mid_count} ({midPercent}%)</span>
                    <span><span className={styles.dot} style={{ background: "#E24B4A" }} />Low — {data.overview.low_count} ({lowPercent}%)</span>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.secTitle}>Student distribution by previous SGPA</div>
                <div className={styles.row2}>
                    <div className={styles.chartWrap} style={{ height: "240px" }}>
                        <canvas ref={catChartRef} role="img" aria-label="Bar chart showing student counts per SGPA category" />
                    </div>
                    <div>
                        <div className={styles.secTitle} style={{ marginBottom: "6px" }}>Avg SGPA by department</div>
                        <div style={{ fontSize: "12px" }}>
                            {data.departments.map((dept) => (
                                <div key={dept.department} style={{ marginBottom: "6px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "2px" }}>
                                        <span style={{ color: "var(--muted-foreground)" }}>{dept.department}</span>
                                        <span>{dept.avg_previous_sgpa.toFixed(2)}</span>
                                    </div>
                                    <div style={{ height: "5px", borderRadius: "999px", background: "var(--secondary)" }}>
                                        <div
                                            style={{
                                                height: "5px",
                                                borderRadius: "999px",
                                                background: "#3266ad",
                                                width: `${Math.round((dept.avg_previous_sgpa / 4) * 100)}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className={styles.secTitle} style={{ marginTop: "12px", marginBottom: "6px" }}>
                            Gender split
                        </div>
                        <div className={styles.chartWrap} style={{ height: "110px" }}>
                            <canvas ref={genderChartRef} role="img" aria-label="Doughnut chart of gender distribution" />
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.secTitle}>Prediction filters</div>
                <div className={styles.filterRow}>
                    <div className={styles.fieldGroup}>
                        <label>Department</label>
                        <select
                            value={filters.department}
                            onChange={(event) => setFilters((prev) => ({ ...prev, department: event.target.value }))}
                        >
                            <option value="">All</option>
                            {deptOptions.map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label>Category</label>
                        <select
                            value={filters.category}
                            onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                        >
                            <option value="">All</option>
                            <option value="High">High</option>
                            <option value="Mid">Mid</option>
                            <option value="Low">Low</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label>Parental support</label>
                        <select
                            value={filters.parental_support}
                            onChange={(event) => setFilters((prev) => ({ ...prev, parental_support: event.target.value }))}
                        >
                            <option value="">All</option>
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                            <option value="None">None</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label>Min study hrs</label>
                        <select
                            value={filters.min_study_hours}
                            onChange={(event) =>
                                setFilters((prev) => ({ ...prev, min_study_hours: Number(event.target.value) }))
                            }
                        >
                            <option value={0}>Any</option>
                            <option value={2}>&gt;=2 hrs</option>
                            <option value={4}>&gt;=4 hrs</option>
                            <option value={6}>&gt;=6 hrs</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroup}>
                        <label>Min attendance</label>
                        <select
                            value={filters.min_attendance}
                            onChange={(event) =>
                                setFilters((prev) => ({ ...prev, min_attendance: Number(event.target.value) }))
                            }
                        >
                            <option value={0}>Any</option>
                            <option value={60}>&gt;=60%</option>
                            <option value={75}>&gt;=75%</option>
                            <option value={85}>&gt;=85%</option>
                        </select>
                    </div>
                    <div className={styles.fieldGroup} style={{ justifyContent: "flex-end" }}>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={() => {
                                setPipelineStage(3);
                                loadDashboard(filters, forecastMode);
                            }}
                        >
                            Run prediction →
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.secTitle}>
                    Prediction results <span className={styles.infoPill}>{data.prediction_summary.filtered_count} students</span>
                </div>
                <div className={styles.metricGrid}>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>Filtered</div>
                        <div className={`${styles.metricVal} ${styles.blue}`}>{data.prediction_summary.filtered_count}</div>
                    </div>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>On-track (&gt;= 3.5)</div>
                        <div className={`${styles.metricVal} ${styles.green}`}>{data.prediction_summary.on_track}</div>
                    </div>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>At-risk (&lt; 3.5)</div>
                        <div className={`${styles.metricVal} ${styles.red}`}>{data.prediction_summary.at_risk}</div>
                    </div>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>Avg predicted</div>
                        <div className={styles.metricVal}>{data.prediction_summary.avg_predicted.toFixed(2)}</div>
                    </div>
                    <div className={styles.metric}>
                        <div className={styles.metricLabel}>Pass rate</div>
                        <div className={styles.metricVal}>{data.prediction_summary.pass_rate}%</div>
                    </div>
                </div>

                <div className={styles.row2} style={{ marginBottom: "1rem" }}>
                    <div className={styles.chartWrap} style={{ height: "200px" }}>
                        <canvas ref={predDistRef} role="img" aria-label="Predicted SGPA distribution" />
                    </div>
                    <div className={styles.chartWrap} style={{ height: "200px" }}>
                        <canvas ref={predScatterRef} role="img" aria-label="Previous vs predicted SGPA scatter" />
                    </div>
                </div>

                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>ID</th>
                                <th className={styles.th}>Name</th>
                                <th className={styles.th}>Dept</th>
                                <th className={styles.th}>Category</th>
                                <th className={styles.th}>Prev SGPA</th>
                                <th className={styles.th}>Study hrs</th>
                                <th className={styles.th}>Attendance</th>
                                <th className={styles.th}>Predicted</th>
                                <th className={styles.th}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.students.slice(0, 80).map((student) => (
                                <tr key={student.student_id} className={styles.rowHover}>
                                    <td className={styles.td} style={{ color: "var(--muted-foreground)" }}>
                                        {student.student_id}
                                    </td>
                                    <td className={styles.td} style={{ fontWeight: 600 }}>
                                        {student.name}
                                    </td>
                                    <td className={styles.td}>{student.department}</td>
                                    <td className={styles.td}>
                                        <span
                                            className={`${styles.badge} ${
                                                student.category === "High"
                                                    ? styles.badgeHigh
                                                    : student.category === "Mid"
                                                    ? styles.badgeMid
                                                    : styles.badgeLow
                                            }`}
                                        >
                                            {student.category}
                                        </span>
                                    </td>
                                    <td className={styles.td}>{student.previous_sgpa.toFixed(2)}</td>
                                    <td className={styles.td}>{student.study_hours_per_day} hrs</td>
                                    <td className={styles.td}>{student.attendance_rate}%</td>
                                    <td
                                        className={styles.td}
                                        style={{
                                            fontWeight: 600,
                                            color: student.predicted_sgpa >= 3.5 ? "#27500A" : "#A32D2D",
                                        }}
                                    >
                                        {student.predicted_sgpa.toFixed(2)}
                                    </td>
                                    <td className={styles.td}>
                                        {student.predicted_sgpa >= 3.5 ? (
                                            <span style={{ fontSize: "10px", color: "#27500A" }}>On track</span>
                                        ) : (
                                            <span style={{ fontSize: "10px", color: "#A32D2D" }}>At risk</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", color: "var(--muted-foreground)" }}>
                        {data.students.length > 80
                            ? `Showing 80 of ${data.students.length} rows`
                            : `${data.students.length} students`}
                    </span>
                    {data.prediction_summary.at_risk > 0 && (
                        <button
                            className={`${styles.btn} ${styles.btnOrange}`}
                            onClick={() => {
                                setPipelineStage(4);
                                setShowPrescriptions(true);
                            }}
                        >
                            Prescribe for at-risk →
                        </button>
                    )}
                </div>
            </div>

            {showPrescriptions && (
                <div className={styles.section}>
                    <div className={styles.secTitle}>
                        Prescription engine <span className={styles.dangerPill}>{data.prediction_summary.at_risk} students</span>
                    </div>
                    <div>
                        {data.prescriptions.slice(0, 40).map((rec) => (
                            <div key={rec.student_id} className={styles.recCard}>
                                <div className={styles.recHeader}>
                                    <div>
                                        <span className={styles.recName}>{rec.name}</span>{" "}
                                        <span className={styles.recSub}>
                                            {rec.department} · {rec.category}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: "11px", color: "#A32D2D", fontWeight: 600 }}>
                                        Predicted: {rec.predicted_sgpa.toFixed(2)}
                                    </span>
                                </div>
                                <div className={styles.recList}>
                                    <ul>
                                        {rec.recommendations.map((item) => (
                                            <li key={item}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                        {data.prescriptions.length > 40 && (
                            <p style={{ fontSize: "11px", color: "var(--muted-foreground)", marginTop: "4px" }}>
                                + {data.prescriptions.length - 40} more students omitted
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <div className={styles.secTitle}>CGPA forecast — future trend</div>
                <div className={styles.tabRow}>
                    <button
                        className={`${styles.tabBtn} ${forecastMode === "ma" ? styles.tabBtnActive : ""}`}
                        onClick={() => {
                            setForecastMode("ma");
                            setPipelineStage(5);
                            loadDashboard(filters, "ma");
                        }}
                    >
                        Moving average
                    </button>
                    <button
                        className={`${styles.tabBtn} ${forecastMode === "reg" ? styles.tabBtnActive : ""}`}
                        onClick={() => {
                            setForecastMode("reg");
                            setPipelineStage(5);
                            loadDashboard(filters, "reg");
                        }}
                    >
                        Regression
                    </button>
                </div>
                <div className={styles.chartWrap} style={{ height: "220px" }}>
                    <canvas ref={forecastChartRef} role="img" aria-label="Line chart of historical and forecasted CGPA" />
                </div>
                <div style={{ marginTop: "10px", fontSize: "13px" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>T+1:</span> <strong>{data.forecast.t1}</strong> &nbsp;
                    <span style={{ color: "var(--muted-foreground)" }}>T+2:</span> <strong>{data.forecast.t2}</strong> &nbsp;
                    <span style={{ color: "var(--muted-foreground)" }}>T+3:</span>{" "}
                    <strong style={{ color: data.forecast.t3 >= data.forecast.target ? "#27500A" : "#A32D2D" }}>
                        {data.forecast.t3}
                    </strong>
                    <span className={data.forecast.t3 >= data.forecast.target ? styles.successPill : styles.dangerPill}>
                        {data.forecast.t3 >= data.forecast.target ? "On forecast track" : "Below target — prescribe"}
                    </span>
                </div>
                <div style={{ marginTop: "8px" }}>
                    {data.forecast.cohort_plan && data.forecast.t3 < data.forecast.target ? (
                        <div
                            style={{
                                background: "var(--secondary)",
                                borderRadius: "12px",
                                padding: "10px 12px",
                                marginTop: "6px",
                                fontSize: "12px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "var(--muted-foreground)",
                                    marginBottom: "6px",
                                }}
                            >
                                Cohort-level improvement plan
                            </div>
                            <ul style={{ paddingLeft: "16px" }}>
                                {data.forecast.cohort_plan.map((item) => (
                                    <li key={item}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div style={{ fontSize: "12px", color: "var(--muted-foreground)", marginTop: "4px" }}>
                            Cohort is forecasted to stay on track. Continue monitoring each term.
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <div className={styles.secTitle}>Department performance breakdown</div>
                <div className={styles.chartWrap} style={{ height: "220px" }}>
                    <canvas ref={deptChartRef} role="img" aria-label="Department SGPA comparison" />
                </div>
            </div>
        </div>
    );
}
