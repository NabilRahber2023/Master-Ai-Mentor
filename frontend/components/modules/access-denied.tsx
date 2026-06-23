import Link from "next/link";
import { ShieldX } from "lucide-react";

/**
 * Server-rendered "no access" panel shown by the tenant layout when a user lands
 * on a module page their org isn't entitled to, or their role can't use.
 */
export function ModuleAccessDenied({
    title,
    reason,
    homeHref,
}: {
    title: string;
    reason: string;
    homeHref: string;
}) {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/30">
                <ShieldX className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--app-text)]">{title}</h1>
            <p className="max-w-md text-sm text-slate-400">{reason}</p>
            <Link
                href={homeHref}
                className="mt-2 rounded-lg bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-300 ring-1 ring-cyan-400/30 transition hover:bg-cyan-500/25"
            >
                ← Back to dashboard
            </Link>
        </div>
    );
}
