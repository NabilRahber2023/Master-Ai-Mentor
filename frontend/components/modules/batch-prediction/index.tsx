"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    ReferenceLine,
    ResponsiveContainer,
    Scatter,
    ScatterChart,
    Tooltip,
    XAxis,
    YAxis,
    ZAxis,
} from "recharts";
import {
    AlertTriangle,
    BarChart3,
    CalendarDays,
    ChevronDown,
    Loader2,
    Radar,
    Sparkles,
    Stethoscope,
    TrendingUp,
    Zap,
} from "lucide-react";
import {
    DEFAULT_FILTERS,
    fetchForecast,
    fetchOverview,
    fetchPrescriptions,
    runBatchPrediction,
    type BatchFilters,
    type ForecastResponse,
    type OverviewResponse,
    type PredictResponse,
    type PrescriptionResponse,
} from "@/lib/api/batch";
import { ApiError } from "@/lib/api/client";

const CYAN = "#00e5ff";
const MID = "#49d8ea";
const ERR = "#ffb4ab";

const STUDY_OPTIONS = [
    { label: "Any", value: 0 },
    { label: "1 hr", value: 1 },
    { label: "2 hrs", value: 2 },
    { label: "3 hrs", value: 3 },
    { label: "4 hrs", value: 4 },
    { label: "5 hrs", value: 5 },
    { label: "6 hrs", value: 6 },
];
const ATT_OPTIONS = [0, 50, 60, 70, 80, 90];

function catColor(category: string) {
    if (category === "High") return "text-cyan-300 border-cyan-400/30 bg-cyan-400/5";
    if (category === "Mid") return "text-sky-300 border-sky-300/30 bg-sky-300/5";
    return "text-red-300 border-red-300/30 bg-red-300/5";
}

/* ════════════════════════════ Root ════════════════════════════ */
export function BatchPredictionDashboard() {
    const [overview, setOverview] = useState<OverviewResponse | null>(null);
    const [overviewError, setOverviewError] = useState<string | null>(null);

    const [filters, setFilters] = useState<BatchFilters>(DEFAULT_FILTERS);

    // Section visibility
    const [showPrediction, setShowPrediction] = useState(false);
    const [showForecast, setShowForecast] = useState(false);

    // Data per section
    const [predict, setPredict] = useState<PredictResponse | null>(null);
    const [predicting, setPredicting] = useState(false);
    const [predictError, setPredictError] = useState<string | null>(null);

    const [forecast, setForecast] = useState<ForecastResponse | null>(null);
    const [forecasting, setForecasting] = useState(false);

    // Prescription engine
    const [rxOpen, setRxOpen] = useState(false);
    const [rxTarget, setRxTarget] = useState<"At risk" | "Mid">("At risk");
    const [rxSearch, setRxSearch] = useState("");
    const [rx, setRx] = useState<PrescriptionResponse | null>(null);
    const [rxLoading, setRxLoading] = useState(false);

    useEffect(() => {
        fetchOverview()
            .then(setOverview)
            .catch((e) => setOverviewError(e instanceof Error ? e.message : "Failed to load overview"));
    }, []);

    const doPredict = useCallback(async (f: BatchFilters) => {
        setPredicting(true);
        setPredictError(null);
        try {
            setPredict(await runBatchPrediction(f));
        } catch (e) {
            setPredictError(e instanceof ApiError ? e.message : "Prediction failed");
        } finally {
            setPredicting(false);
        }
    }, []);

    const doForecast = useCallback(async (f: BatchFilters) => {
        setForecasting(true);
        try {
            setForecast(await fetchForecast(f));
        } finally {
            setForecasting(false);
        }
    }, []);

    const doPrescriptions = useCallback(
        async (f: BatchFilters, target: "At risk" | "Mid", search: string) => {
            setRxLoading(true);
            try {
                setRx(await fetchPrescriptions(f, target, search));
            } finally {
                setRxLoading(false);
            }
        },
        [],
    );

    /* ── Top action buttons ── */
    const onPrediction = () => {
        setShowPrediction(true);
        if (!predict) doPredict(filters);
        setTimeout(() => document.getElementById("bp-prediction")?.scrollIntoView({ behavior: "smooth" }), 50);
    };
    const onPrescribe = () => {
        setShowPrediction(true);
        if (!predict) doPredict(filters);
        setRxTarget("At risk");
        setRxOpen(true);
        doPrescriptions(filters, "At risk", "");
        setTimeout(() => document.getElementById("bp-rx")?.scrollIntoView({ behavior: "smooth" }), 80);
    };
    const onForecasting = () => {
        setShowForecast(true);
        if (!forecast) doForecast(filters);
        setTimeout(() => document.getElementById("bp-forecast")?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    /* ── RUN PREDICTION (filters) ── */
    const runWithFilters = () => {
        doPredict(filters);
        if (rxOpen) doPrescriptions(filters, rxTarget, rxSearch);
        if (showForecast) doForecast(filters);
    };

    const openRx = (target: "At risk" | "Mid") => {
        setRxTarget(target);
        setRxOpen(true);
        setRxSearch("");
        doPrescriptions(filters, target, "");
        setTimeout(() => document.getElementById("bp-rx")?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    /* ── Click the gender card to filter the cohort (All → Male → Female) ── */
    const selectGender = (g: "All" | "Male" | "Female") => {
        const next = { ...filters, gender: g };
        setFilters(next);
        setShowPrediction(true);
        doPredict(next);
        if (rxOpen) doPrescriptions(next, rxTarget, rxSearch);
        if (showForecast) doForecast(next);
        setTimeout(() => document.getElementById("bp-prediction")?.scrollIntoView({ behavior: "smooth" }), 80);
    };

    return (
        <div className="space-y-8">
            {overviewError && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
                    {overviewError}
                </div>
            )}

            {/* PAGE 1 — Dataset overview */}
            <DatasetOverview overview={overview} selectedGender={filters.gender} onSelectGender={selectGender} />

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-4">
                <ActionButton icon={BarChart3} label="Prediction" onClick={onPrediction} active={showPrediction} />
                <ActionButton icon={Stethoscope} label="Prescribe" onClick={onPrescribe} active={rxOpen} />
                <ActionButton icon={TrendingUp} label="Forecasting" onClick={onForecasting} active={showForecast} />
            </div>

            {/* PAGE 3 — Forecast (rendered above prediction, matching the demo order) */}
            {showForecast && (
                <section id="bp-forecast">
                    <ForecastView data={forecast} loading={forecasting} />
                </section>
            )}

            {/* PAGE 2 — Prediction */}
            {showPrediction && (
                <section id="bp-prediction" className="space-y-8">
                    <FilterBar
                        filters={filters}
                        setFilters={setFilters}
                        departments={overview?.department_avgs.map((d) => d.department) ?? []}
                        onRun={runWithFilters}
                        loading={predicting}
                    />
                    {predictError && (
                        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-300">
                            {predictError}
                        </div>
                    )}
                    <PredictionResults data={predict} loading={predicting} onOpenRx={openRx} />
                </section>
            )}

            {/* Prescription engine */}
            {rxOpen && (
                <section id="bp-rx">
                    <PrescriptionEngine
                        data={rx}
                        loading={rxLoading}
                        target={rxTarget}
                        search={rxSearch}
                        setSearch={setRxSearch}
                        onSearch={() => doPrescriptions(filters, rxTarget, rxSearch)}
                        onClose={() => setRxOpen(false)}
                    />
                </section>
            )}
        </div>
    );
}

/* ════════════════════════════ Action button ════════════════════════════ */
function ActionButton({
    icon: Icon,
    label,
    onClick,
    active,
}: {
    icon: typeof BarChart3;
    label: string;
    onClick: () => void;
    active: boolean;
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 rounded-lg px-10 py-3 text-xs font-extrabold uppercase tracking-[0.2em] transition-all hover:scale-105 ${
                active
                    ? "bg-gradient-to-br from-cyan-400 to-teal-600 text-[#00363d] shadow-[0_0_20px_rgba(0,229,255,0.4)]"
                    : "border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
            }`}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}

/* ════════════════════════════ Overview ════════════════════════════ */
function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
    return (
        <div className="rounded-lg border border-cyan-400/15 bg-[#151d1e]/60 p-4 backdrop-blur">
            <div className="mb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</div>
            <div className={`text-3xl font-extrabold leading-tight ${accent ?? "text-[var(--app-text)]"}`}>{value}</div>
        </div>
    );
}

function DatasetOverview({
    overview,
    selectedGender,
    onSelectGender,
}: {
    overview: OverviewResponse | null;
    selectedGender: string;
    onSelectGender: (g: "All" | "Male" | "Female") => void;
}) {
    if (!overview) {
        return (
            <div className="flex h-40 items-center justify-center rounded-xl border border-white/10 bg-[#151d1e]/40">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
        );
    }
    const o = overview;
    const maxDept = Math.max(...o.department_avgs.map((d) => d.avg_sgpa), 4);

    return (
        <div className="space-y-8">
            <h2 className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">
                Dataset Overview — {o.total_students.toLocaleString()} Students
            </h2>

            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-7">
                <Kpi label="Total students" value={o.total_students.toLocaleString()} />
                <Kpi label="High (≥3.5)" value={String(o.high)} accent="text-cyan-300" />
                <Kpi label="Mid (2.5–3.49)" value={String(o.mid)} accent="text-sky-300" />
                <Kpi label="Low (<2.5)" value={String(o.low)} accent="text-red-300" />
                <Kpi label="Avg SGPA" value={o.avg_sgpa.toFixed(2)} accent="text-cyan-200" />
                <Kpi label="Avg study hrs" value={`${o.avg_study_hours}h`} />
                <Kpi label="Avg attendance" value={`${Math.round(o.avg_attendance)}%`} />
            </div>

            {/* Category distribution */}
            <div>
                <h3 className="mb-4 text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
                    Category Distribution
                </h3>
                <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full bg-cyan-400" style={{ width: `${o.high_pct}%` }} />
                    <div className="h-full bg-sky-300" style={{ width: `${o.mid_pct}%` }} />
                    <div className="h-full bg-red-300" style={{ width: `${o.low_pct}%` }} />
                </div>
                <div className="flex flex-wrap gap-6 text-sm">
                    <Legend2 color="bg-cyan-400" label={`High — ${o.high_pct}%`} />
                    <Legend2 color="bg-sky-300" label={`Mid — ${o.mid_pct}%`} />
                    <Legend2 color="bg-red-300" label={`Low — ${o.low_pct}%`} />
                </div>
            </div>

            {/* Dept averages + gender donut */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
                <div className="rounded-xl border border-cyan-400/15 bg-[#151d1e]/60 p-6 lg:col-span-6">
                    <h3 className="mb-6 text-xs font-extrabold uppercase tracking-widest text-slate-400">
                        Avg SGPA by Department
                    </h3>
                    <div className="flex flex-col gap-4">
                        {o.department_avgs.map((d) => (
                            <div key={d.department} className="flex items-center gap-4">
                                <span className="w-32 truncate text-xs font-bold text-slate-200">{d.department}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                                    <div
                                        className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(0,229,255,0.4)]"
                                        style={{ width: `${(d.avg_sgpa / maxDept) * 100}%` }}
                                    />
                                </div>
                                <span className="w-10 text-right text-xs font-bold text-[var(--app-text)]">
                                    {d.avg_sgpa.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center rounded-xl border border-cyan-400/15 bg-[#151d1e]/60 p-6 lg:col-span-4">
                    <GenderDonut gender={o.gender} selected={selectedGender} onSelect={onSelectGender} />
                </div>
            </div>
        </div>
    );
}

function Legend2({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${color}`} />
            <span className="font-medium text-slate-300">{label}</span>
        </div>
    );
}

function GenderDonut({
    gender,
    selected,
    onSelect,
}: {
    gender: OverviewResponse["gender"];
    selected: string;
    onSelect: (g: "All" | "Male" | "Female") => void;
}) {
    const total = gender.total || 1;
    const C = 2 * Math.PI * 40;
    const MALE = CYAN;            // blue/cyan — the page's primary accent
    const FEMALE = "#f472b6";    // soft neon pink that pairs with the cyan

    const maleFrac = gender.male / total;
    const femaleFrac = gender.female / total;

    // Both colours always render; the active selection is bright, the other dims.
    const maleOn = selected !== "Female";
    const femaleOn = selected !== "Male";

    const centerCount = selected === "Male" ? gender.male : selected === "Female" ? gender.female : total;
    const centerLabel = selected === "Male" || selected === "Female" ? selected : "Total";
    const centerColor = selected === "Female" ? "text-pink-300" : "text-cyan-300";

    const cycleNext = () => onSelect(selected === "All" ? "Male" : selected === "Male" ? "Female" : "All");

    const Btn = ({ value, dot, ring, children }: { value: "All" | "Male" | "Female"; dot: string; ring: string; children: React.ReactNode }) => (
        <button
            type="button"
            onClick={() => onSelect(value)}
            className={`flex items-center gap-2 rounded-full px-2.5 py-1 transition-colors ${
                selected === value ? `${ring} ring-1` : "text-slate-300 hover:text-[var(--app-text)]"
            }`}
        >
            <span className={`h-2 w-2 rounded-full ${dot}`} /> {children}
        </button>
    );

    return (
        <>
            <button
                type="button"
                onClick={cycleNext}
                title="Click to cycle All → Male → Female"
                className="relative h-28 w-28 rounded-full transition-transform hover:scale-105"
            >
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    {/* unfilled track */}
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--app-border)" strokeWidth="10" />
                    {/* male arc (blue) */}
                    <circle
                        cx="50" cy="50" r="40" fill="transparent" stroke={MALE} strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${maleFrac * C} ${C}`}
                        opacity={maleOn ? 1 : 0.2}
                        className="transition-all duration-300"
                        style={{ filter: maleOn ? "drop-shadow(0 0 5px rgba(0,229,255,0.6))" : "none" }}
                    />
                    {/* female arc (pink) — starts where the male arc ends */}
                    <circle
                        cx="50" cy="50" r="40" fill="transparent" stroke={FEMALE} strokeWidth="10" strokeLinecap="round"
                        strokeDasharray={`${femaleFrac * C} ${C}`}
                        strokeDashoffset={`${-maleFrac * C}`}
                        opacity={femaleOn ? 1 : 0.2}
                        className="transition-all duration-300"
                        style={{ filter: femaleOn ? "drop-shadow(0 0 5px rgba(244,114,182,0.6))" : "none" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-extrabold text-[var(--app-text)]">{centerCount.toLocaleString()}</span>
                    <span className={`mt-1 text-[8px] font-extrabold uppercase tracking-widest ${centerColor}`}>{centerLabel}</span>
                </div>
            </button>
            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                <Btn value="All" dot="bg-gradient-to-r from-cyan-400 to-pink-400" ring="bg-white/5 text-[var(--app-text)] ring-white/20">All {total.toLocaleString()}</Btn>
                <Btn value="Male" dot="bg-cyan-400" ring="bg-cyan-400/15 text-cyan-200 ring-cyan-400/40">Male {gender.male}</Btn>
                <Btn value="Female" dot="bg-pink-400" ring="bg-pink-400/15 text-pink-200 ring-pink-400/40">Female {gender.female}</Btn>
            </div>
            <p className="mt-2 text-[9px] text-slate-400">Click a segment to filter the cohort</p>
        </>
    );
}

/* ════════════════════════════ Filter bar ════════════════════════════ */
function FilterBar({
    filters,
    setFilters,
    departments,
    onRun,
    loading,
}: {
    filters: BatchFilters;
    setFilters: (f: BatchFilters) => void;
    departments: string[];
    onRun: () => void;
    loading: boolean;
}) {
    const sel = "h-12 rounded-lg border border-white/10 bg-[#080f11]/80 px-4 text-sm text-slate-200 outline-none focus:border-cyan-400";
    return (
        <div className="rounded-xl border border-cyan-400/15 bg-[#151d1e]/60 p-6">
            <h2 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-cyan-200">Prediction Filters</h2>
            <div className="flex flex-wrap items-end gap-6">
                <Field label="Department">
                    <select
                        className={sel}
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    >
                        <option value="All">All Departments</option>
                        {departments.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Category">
                    <select
                        className={sel}
                        value={filters.category}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    >
                        <option value="All">All Categories</option>
                        <option value="High">High</option>
                        <option value="Mid">Mid</option>
                        <option value="Low">Low</option>
                    </select>
                </Field>
                <Field label="Gender">
                    <select
                        className={sel}
                        value={filters.gender}
                        onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                    >
                        <option value="All">All</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </Field>
                <Field label="Min Study Hrs">
                    <select
                        className={sel}
                        value={filters.min_study_hours}
                        onChange={(e) => setFilters({ ...filters, min_study_hours: Number(e.target.value) })}
                    >
                        {STUDY_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Min Attendance">
                    <select
                        className={sel}
                        value={filters.min_attendance}
                        onChange={(e) => setFilters({ ...filters, min_attendance: Number(e.target.value) })}
                    >
                        {ATT_OPTIONS.map((a) => (
                            <option key={a} value={a}>
                                {a === 0 ? ">0%" : `>${a}%`}
                            </option>
                        ))}
                    </select>
                </Field>
                <button
                    onClick={onRun}
                    disabled={loading}
                    className="flex h-12 items-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-br from-cyan-400 to-teal-600 px-8 text-xs font-bold uppercase tracking-wider text-[#00363d] shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all hover:scale-105 disabled:opacity-60"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Run Prediction
                </button>
            </div>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex min-w-[160px] flex-1 flex-col gap-2">
            <label className="text-xs font-medium text-slate-400">{label}</label>
            {children}
        </div>
    );
}

/* ════════════════════════════ Prediction results ════════════════════════════ */
function PredictionResults({
    data,
    loading,
    onOpenRx,
}: {
    data: PredictResponse | null;
    loading: boolean;
    onOpenRx: (t: "At risk" | "Mid") => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
    if (loading && !data) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
        );
    }
    if (!data) return null;
    const k = data.kpis;
    const barData = data.distribution_bins.map((b, i) => ({ bin: b, count: data.distribution_counts[i] }));
    const atRisk = data.scatter.filter((s) => s.status === "At risk").map((s) => ({ x: s.prev_sgpa, y: 1.5 }));
    const onTrack = data.scatter.filter((s) => s.status === "On track").map((s) => ({ x: s.prev_sgpa, y: 3.5 }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-[var(--app-text)]">Prediction Results</h2>
                <span className="rounded-full border border-cyan-400/20 bg-white/5 px-3 py-1 text-xs font-bold text-cyan-200">
                    {data.total.toLocaleString()} Students
                </span>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                <KpiCard label="Filtered" value={k.filtered.toLocaleString()} border="border-l-slate-500" />
                <KpiCard label="On-track" value={k.on_track.toLocaleString()} border="border-l-sky-400" accent="text-sky-300" />
                <KpiCard label="At-risk" value={k.at_risk.toLocaleString()} border="border-l-red-400" accent="text-red-300" />
                <KpiCard label="Avg predicted" value={k.avg_predicted.toFixed(2)} border="border-l-cyan-400" />
                <KpiCard label="Pass rate" value={`${k.pass_rate}%`} border="border-l-cyan-200" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard title="Predicted SGPA Distribution">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={barData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="bin" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ background: "#080f11", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 8 }}
                                labelStyle={{ color: "#fff" }}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {barData.map((_, i) => (
                                    <Cell key={i} fill={i < 3 ? ERR : i < 5 ? MID : CYAN} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Prev vs Predicted SGPA">
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                type="number"
                                dataKey="x"
                                name="Prev SGPA"
                                domain={[1, 4]}
                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                            />
                            <YAxis
                                type="number"
                                dataKey="y"
                                domain={[0, 5]}
                                ticks={[1.5, 3.5]}
                                tickFormatter={(v) => (v === 1.5 ? "AT RISK" : v === 3.5 ? "ON TRACK" : "")}
                                tick={{ fill: "#fff", fontSize: 11, fontWeight: 700 }}
                                width={70}
                            />
                            <ZAxis range={[40, 40]} />
                            <Tooltip
                                cursor={{ strokeDasharray: "3 3" }}
                                contentStyle={{ background: "#080f11", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 8 }}
                            />
                            <Legend />
                            <Scatter name="At risk" data={atRisk} fill={ERR} />
                            <Scatter name="On track" data={onTrack} fill={CYAN} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Student table */}
            <div className="overflow-hidden rounded-xl border border-cyan-400/15 bg-[#151d1e]/60">
                <div className="flex items-center justify-between border-b border-white/10 bg-[#080f11]/60 px-6 py-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-200">Student Data Stream</h3>
                    <div className="flex gap-6 text-xs">
                        <Legend2 color="bg-cyan-400" label="High" />
                        <Legend2 color="bg-sky-300" label="Mid" />
                        <Legend2 color="bg-red-300" label="Low" />
                    </div>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-[#151d1e]">
                            <tr className="text-[11px] uppercase tracking-wider text-slate-400">
                                <th className="px-6 py-3">ID</th>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Dept</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3 text-right">Prev. SGPA</th>
                                <th className="px-6 py-3 text-right">Study Hrs</th>
                                <th className="px-6 py-3 text-right">Attendance</th>
                                <th className="px-6 py-3 text-right">Predicted</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {data.students.map((s) => (
                                <tr key={s.id} className="group transition-colors hover:bg-cyan-400/5">
                                    <td className="px-6 py-3 font-mono text-[13px] text-slate-400">{s.id}</td>
                                    <td className="px-6 py-3 font-bold text-[var(--app-text)] group-hover:text-cyan-300">{s.name}</td>
                                    <td className="px-6 py-3 text-slate-300">{s.dept}</td>
                                    <td className="px-6 py-3">
                                        <span className={`rounded border px-3 py-1 text-[10px] font-black uppercase ${catColor(s.category)}`}>
                                            {s.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right font-mono text-[13px] text-[var(--app-text)]">{s.prev_sgpa.toFixed(2)}</td>
                                    <td className="px-6 py-3 text-right font-mono text-[13px] text-slate-300">{s.study_hrs}h</td>
                                    <td className="px-6 py-3 text-right font-mono text-[13px] text-slate-300">{s.attendance}%</td>
                                    <td className="px-6 py-3 text-right font-mono text-[13px] font-black text-cyan-300">
                                        {s.predicted.toFixed(2)}
                                    </td>
                                    <td
                                        className={`px-6 py-3 text-xs font-bold uppercase tracking-wider ${
                                            s.status === "At risk" ? "text-red-300" : "text-sky-300"
                                        }`}
                                    >
                                        {s.status}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 bg-[#080f11]/60 px-6 py-4">
                    <p className="text-xs text-slate-400">
                        Showing {data.showing} of {data.total.toLocaleString()} rows
                    </p>
                    <div className="relative">
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            className="flex items-center gap-2 rounded-full bg-white px-8 py-2 text-xs font-bold text-black transition-all hover:bg-cyan-300"
                        >
                            <Sparkles className="h-4 w-4" /> Predict With AI <ChevronDown className="h-4 w-4" />
                        </button>
                        {menuOpen && (
                            <div className="absolute bottom-full right-0 mb-2 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#242b2d] shadow-2xl">
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onOpenRx("Mid");
                                    }}
                                    className="block w-full px-6 py-3 text-left text-sm font-bold uppercase tracking-wider text-slate-200 hover:bg-cyan-400 hover:text-black"
                                >
                                    Predict for mid level
                                </button>
                                <button
                                    onClick={() => {
                                        setMenuOpen(false);
                                        onOpenRx("At risk");
                                    }}
                                    className="block w-full px-6 py-3 text-left text-sm font-bold uppercase tracking-wider text-slate-200 hover:bg-cyan-400 hover:text-black"
                                >
                                    Predict for at-risk
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ label, value, border, accent }: { label: string; value: string; border: string; accent?: string }) {
    return (
        <div className={`rounded-xl border border-white/10 border-l-4 ${border} bg-[#151d1e]/60 p-6`}>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-400">{label}</p>
            <p className={`text-3xl font-bold ${accent ?? "text-[var(--app-text)]"}`}>{value}</p>
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-cyan-400/15 bg-[#151d1e]/60 p-6">
            <h3 className="mb-6 border-b border-white/10 pb-3 text-xs font-bold uppercase tracking-wider text-[var(--app-text)]">
                {title}
            </h3>
            {children}
        </div>
    );
}

/* ════════════════════════════ Prescription engine ════════════════════════════ */
function PrescriptionEngine({
    data,
    loading,
    target,
    search,
    setSearch,
    onSearch,
    onClose,
}: {
    data: PrescriptionResponse | null;
    loading: boolean;
    target: string;
    search: string;
    setSearch: (s: string) => void;
    onSearch: () => void;
    onClose: () => void;
}) {
    return (
        <div className="overflow-hidden rounded-xl border border-cyan-400/15 bg-[#151d1e]/60">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#242b2d]/60 px-6 py-4">
                <div className="flex items-center gap-4">
                    <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                        <Radar className="h-4 w-4" /> AI Prescription Engine — {target} Students
                    </h2>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-xs font-bold text-slate-300">
                        {data?.count ?? 0} Students
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && onSearch()}
                        placeholder="Search by Name or ID..."
                        className="h-10 w-64 rounded-lg border border-white/10 bg-[#080f11]/80 px-4 text-[13px] text-slate-200 outline-none focus:border-cyan-400"
                    />
                    <button
                        onClick={onSearch}
                        className="flex h-10 items-center gap-1 rounded-lg bg-gradient-to-br from-cyan-400 to-teal-600 px-6 text-xs font-bold uppercase text-[#00363d]"
                    >
                        Run <Zap className="h-4 w-4" />
                    </button>
                    <button onClick={onClose} className="text-xs font-bold uppercase text-slate-400 hover:text-[var(--app-text)]">
                        Close
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-1 gap-6 p-8 lg:grid-cols-2">
                {loading && (
                    <div className="col-span-full flex h-32 items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
                    </div>
                )}
                {!loading && data?.cards.length === 0 && (
                    <p className="col-span-full py-12 text-center text-sm uppercase tracking-widest text-slate-500">
                        No matching telemetry found.
                    </p>
                )}
                {!loading &&
                    data?.cards.map((c) => {
                        const isRisk = c.status === "At risk";
                        return (
                            <div
                                key={c.id}
                                className="relative overflow-hidden rounded-xl border border-white/10 bg-[#080f11]/60 p-6 transition-all hover:border-cyan-400/50"
                            >
                                <div className="mb-6 flex items-start justify-between">
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight text-[var(--app-text)]">{c.name}</h3>
                                        <p className="mt-1 font-mono text-sm uppercase text-cyan-300">
                                            {c.id} // {c.dept}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="mb-1 block text-xs font-bold uppercase tracking-tighter text-slate-400">
                                            Probability Score
                                        </span>
                                        <span className={`text-2xl font-black ${isRisk ? "text-red-300" : "text-cyan-300"}`}>
                                            {c.predicted.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {c.recommendations.map((r, i) => (
                                        <div
                                            key={i}
                                            className={`flex items-start gap-3 rounded-lg border-l-2 bg-black/40 p-3 ${
                                                isRisk ? "border-l-red-300" : "border-l-cyan-400"
                                            }`}
                                        >
                                            <Radar className={`mt-0.5 h-4 w-4 shrink-0 ${isRisk ? "text-red-300" : "text-cyan-300"}`} />
                                            <p className="text-sm leading-relaxed text-slate-300">{r}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}

/* ════════════════════════════ Forecast ════════════════════════════ */
function ForecastView({ data, loading }: { data: ForecastResponse | null; loading: boolean }) {
    const deptData = useMemo(
        () =>
            data?.department_breakdown.map((d) => ({
                dept: d.department,
                Current: d.current_avg,
                Predicted: d.predicted_avg,
            })) ?? [],
        [data],
    );

    if (loading && !data) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
            </div>
        );
    }
    if (!data) return null;

    const trendData = data.trend.map((t) => ({
        term: t.term,
        historical: t.type === "historical" ? t.value : null,
        forecast: t.type === "forecast" ? t.value : null,
    }));
    // Bridge the line: the current point should also seed the forecast line.
    const currentIdx = data.trend.findIndex((t) => t.term === "Current");
    if (currentIdx >= 0) trendData[currentIdx].forecast = data.trend[currentIdx].value;

    return (
        <div className="space-y-6">
            <header className="text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-[var(--app-text)]">
                    CGPA Forecast <span className="text-cyan-300">—</span> Future Trend
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                    Predictive analysis of student performance across departments based on current trajectories.
                </p>
            </header>

            {/* Trend chart */}
            <div className="rounded-xl border border-cyan-400/15 bg-[#151d1e]/60 p-8">
                <div className="mb-6 flex flex-wrap items-center justify-end gap-6 text-xs">
                    <Legend2 color="bg-cyan-400" label="Historical" />
                    <Legend2 color="bg-red-300" label="Forecast" />
                </div>
                <ResponsiveContainer width="100%" height={360}>
                    <LineChart data={trendData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="term" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis domain={[2, 4]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip
                            contentStyle={{ background: "#080f11", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 8 }}
                            labelStyle={{ color: "#fff" }}
                        />
                        <ReferenceLine y={data.target} stroke={MID} strokeDasharray="8 4" label={{ value: `TARGET ${data.target}`, fill: MID, fontSize: 10, position: "right" }} />
                        <Line type="monotone" dataKey="historical" stroke={CYAN} strokeWidth={3} dot={{ r: 4, fill: CYAN }} connectNulls />
                        <Line type="monotone" dataKey="forecast" stroke={ERR} strokeWidth={3} strokeDasharray="8 5" dot={{ r: 4, fill: ERR }} connectNulls />
                    </LineChart>
                </ResponsiveContainer>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-white/10 pt-8">
                    <div className="flex gap-12">
                        <ForecastStat label="Forecast T+1" value={data.forecast_t1} />
                        <ForecastStat label="Forecast T+2" value={data.forecast_t2} />
                        <ForecastStat label="Forecast T+3" value={data.forecast_t3} />
                    </div>
                    {data.below_target && (
                        <div className="flex items-center gap-3 rounded-lg border border-red-300/20 bg-red-500/10 px-6 py-3 text-red-300 shadow-[0_0_20px_rgba(147,0,10,0.2)]">
                            <AlertTriangle className="h-5 w-5" />
                            <span className="text-xs font-bold uppercase tracking-wider">
                                Projected Decline: Below target threshold
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Calendared improvement plan */}
            <div className="rounded-xl border border-white/10 bg-[#151d1e]/60 p-8">
                <div className="flex items-start gap-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cyan-400/20">
                        <CalendarDays className="h-7 w-7 text-cyan-300" />
                    </div>
                    <div>
                        <h3 className="mb-2 text-lg font-semibold uppercase tracking-wide text-[var(--app-text)]">
                            Calendared Improvement Plan
                        </h3>
                        <p className="text-slate-400">
                            Automated scheduling of remedial sessions and academic counseling initiated for students in
                            the T+1 forecast risk zone. Targeted intervention expected to offset predicted decline by
                            0.15 points.
                        </p>
                    </div>
                </div>
            </div>

            {/* Department breakdown */}
            <div className="rounded-xl border border-cyan-400/15 bg-[#151d1e]/60 p-8">
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold uppercase tracking-tight text-[var(--app-text)]">
                        Department Performance Breakdown
                    </h2>
                    <div className="flex gap-6 text-xs">
                        <Legend2 color="bg-cyan-400" label="Current" />
                        <Legend2 color="bg-teal-500" label="Predicted" />
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={deptData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="dept" tick={{ fill: "#dce4e5", fontSize: 11 }} />
                        <YAxis domain={[2, 4]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <Tooltip
                            contentStyle={{ background: "#080f11", border: "1px solid rgba(0,229,255,0.3)", borderRadius: 8 }}
                            labelStyle={{ color: "#fff" }}
                            cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        />
                        <Legend />
                        <Bar dataKey="Current" fill={CYAN} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Predicted" fill="#00b7c8" radius={[2, 2, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function ForecastStat({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex flex-col">
            <span className="mb-1 text-xs uppercase tracking-widest text-slate-400">{label}</span>
            <span className="text-3xl font-bold text-[var(--app-text)]">{value.toFixed(2)}</span>
        </div>
    );
}
