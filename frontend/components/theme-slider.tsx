"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

/**
 * Fixed light/dark theme slider, pinned to the top-right corner of every page.
 * Flipping it switches the whole system between light and dark instantly.
 */
export function ThemeSlider() {
    const { resolvedTheme, theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    // Until mounted, the theme isn't known on the client (and the server can't
    // know it either), so render a theme-neutral state that matches the SSR
    // output. After mount we switch to the real resolved theme. This avoids a
    // hydration mismatch on the icon colors / switch state.
    const isDark = mounted && (resolvedTheme ?? theme) === "dark";

    return (
        <div className="fixed top-3 right-3 z-[60] flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1.5 shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Sun className={`h-4 w-4 ${mounted && !isDark ? "text-amber-500" : "text-muted-foreground"}`} />
            <Switch
                checked={isDark}
                onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                aria-label="Toggle light or dark mode"
            />
            <Moon className={`h-4 w-4 ${isDark ? "text-cyan-400" : "text-muted-foreground"}`} />
        </div>
    );
}
