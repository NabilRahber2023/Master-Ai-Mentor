"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * The AI Mentor logo mark, which doubles as a light/dark theme switch.
 * Click the logo → the whole system flips between dark and light mode.
 * On hover it reveals a sun/moon hint so users discover the toggle.
 */
export function LogoThemeToggle({ label = "AI", className = "" }: { label?: string; className?: string }) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const isDark = (resolvedTheme ?? theme) === "dark";

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title="Toggle light / dark mode"
            aria-label="Toggle light or dark mode"
            className={`group relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-[var(--app-text)] shadow-sm transition-transform hover:scale-105 ${className}`}
        >
            <span className="text-xs font-bold transition-opacity group-hover:opacity-0">
                {label.charAt(0).toUpperCase()}
            </span>
            {mounted && (
                <span className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </span>
            )}
        </button>
    );
}
