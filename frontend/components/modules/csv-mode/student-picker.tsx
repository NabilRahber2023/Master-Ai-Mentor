"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, User, X } from "lucide-react";
import { listStudents, type StudentBrief } from "@/lib/api/csv-mode";

/**
 * Searchable student picker for CSV mode. Queries the uploaded dataset
 * (`students` table) by name / id and reports the selected student up.
 */
export function StudentPicker({
    selected,
    onSelect,
}: {
    selected: StudentBrief | null;
    onSelect: (s: StudentBrief | null) => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<StudentBrief[]>([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState<number | null>(null);
    const boxRef = useRef<HTMLDivElement>(null);

    // Debounced search.
    useEffect(() => {
        let active = true;
        setLoading(true);
        const t = setTimeout(async () => {
            try {
                const res = await listStudents(query, 25);
                if (active) {
                    setResults(res.students);
                    setTotal(res.total);
                }
            } catch {
                if (active) setResults([]);
            } finally {
                if (active) setLoading(false);
            }
        }, 250);
        return () => {
            active = false;
            clearTimeout(t);
        };
    }, [query]);

    // Close on outside click.
    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    return (
        <div ref={boxRef} className="relative w-full">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--app-border)]/30 bg-[var(--app-card)] px-3 py-2 focus-within:border-cyan-400 transition-colors">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                    }}
                    onFocus={() => setOpen(true)}
                    placeholder={
                        selected ? `${selected.name} · ${selected.student_id}` : "Search a student by name or ID…"
                    }
                    className="w-full bg-transparent text-sm text-[var(--app-text)] outline-none placeholder:text-slate-500"
                />
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                ) : selected ? (
                    <button
                        onClick={() => {
                            onSelect(null);
                            setQuery("");
                        }}
                        className="text-slate-400 hover:text-red-400"
                    >
                        <X className="h-4 w-4" />
                    </button>
                ) : null}
            </div>

            {open && (
                <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border border-[var(--app-border)]/30 bg-[var(--app-card2)] shadow-2xl">
                    {total !== null && (
                        <div className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-slate-500 border-b border-[var(--app-border)]/20">
                            {total.toLocaleString()} students in dataset
                        </div>
                    )}
                    {results.length === 0 && !loading ? (
                        <div className="px-3 py-3 text-xs text-slate-500">No matching students.</div>
                    ) : (
                        results.map((s) => (
                            <button
                                key={s.student_id}
                                onClick={() => {
                                    onSelect(s);
                                    setOpen(false);
                                    setQuery("");
                                }}
                                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-cyan-500/10 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--app-surface)]">
                                        <User className="h-3.5 w-3.5 text-slate-300" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-[var(--app-text)]">{s.name}</div>
                                        <div className="text-[10px] text-slate-400">
                                            {s.student_id}
                                            {s.department ? ` · ${s.department}` : ""}
                                        </div>
                                    </div>
                                </div>
                                {s.current_sgpa !== null && (
                                    <span className="font-mono text-[10px] text-cyan-300">SGPA {s.current_sgpa}</span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
