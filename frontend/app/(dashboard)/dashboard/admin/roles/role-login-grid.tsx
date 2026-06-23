"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X, LogIn, ShieldCheck, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import {
    ALL_PERMISSIONS,
    PERMISSION_LABELS,
    type Permission,
    type PlatformRole,
    type OrgRole,
} from "@/lib/rbac";
import { DEMO_ORG_SLUG } from "@/lib/role-catalog";

export interface RoleCard {
    key: string;
    label: string;
    plane: "Platform" | "Organization";
    platformRole: PlatformRole;
    orgRole: Exclude<OrgRole, null>;
    landing: string;
    blurb: string;
    accent: string;
    email: string;
    userId: string | null;
    permissions: Permission[];
}

const ACCENTS: Record<string, string> = {
    violet: "from-violet-500/20 to-violet-500/5 ring-violet-400/30 text-violet-300",
    sky: "from-sky-500/20 to-sky-500/5 ring-sky-400/30 text-sky-300",
    slate: "from-slate-500/20 to-slate-500/5 ring-slate-400/30 text-slate-300",
    zinc: "from-zinc-500/20 to-zinc-500/5 ring-zinc-400/30 text-zinc-300",
    amber: "from-amber-500/20 to-amber-500/5 ring-amber-400/30 text-amber-300",
    emerald: "from-emerald-500/20 to-emerald-500/5 ring-emerald-400/30 text-emerald-300",
    teal: "from-teal-500/20 to-teal-500/5 ring-teal-400/30 text-teal-300",
    cyan: "from-cyan-500/20 to-cyan-500/5 ring-cyan-400/30 text-cyan-300",
    rose: "from-rose-500/20 to-rose-500/5 ring-rose-400/30 text-rose-300",
};

export function RoleLoginGrid({ cards }: { cards: RoleCard[] }) {
    const router = useRouter();
    const [pending, setPending] = useState<string | null>(null);

    const loginAs = async (card: RoleCard) => {
        setPending(card.key);

        // Super Admin / admin: better-auth (by design) won't let an admin
        // impersonate another admin. You ARE the Super Admin, so just go to your
        // own admin console — that already demonstrates the super_admin role.
        if (card.platformRole === "super_admin" || card.platformRole === "admin") {
            document.cookie = `platform-role=${card.platformRole}; path=/; max-age=${60 * 60 * 24}`;
            toast.success("You are the Super Admin");
            router.push(card.landing.replace("{slug}", DEMO_ORG_SLUG));
            router.refresh();
            return;
        }

        if (!card.userId) {
            toast.error(`Demo user missing for ${card.label}. Run create-rbac-demo-users.mjs.`);
            setPending(null);
            return;
        }
        try {
            const { error } = await authClient.admin.impersonateUser({ userId: card.userId });
            if (error) throw new Error(error.message || "Impersonation failed");

            // Set cookies so middleware + tenant routing reflect the impersonated role.
            document.cookie = `platform-role=${card.platformRole}; path=/; max-age=${60 * 60 * 24}`;
            document.cookie = `active-org-slug=${DEMO_ORG_SLUG}; path=/; max-age=${60 * 60 * 24}`;

            const dest = card.landing.replace("{slug}", DEMO_ORG_SLUG);
            toast.success(`Logged in as ${card.label}`);
            router.push(dest);
            router.refresh();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not log in as this role");
            setPending(null);
        }
    };

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => {
                const accent = ACCENTS[card.accent] ?? ACCENTS.slate;
                const granted = new Set(card.permissions);
                return (
                    <div
                        key={card.key}
                        className={`flex flex-col rounded-2xl bg-gradient-to-b p-5 ring-1 ${accent.replace(/text-[a-z]+-300/, "")}`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className={`h-4 w-4 ${accent.match(/text-[a-z]+-300/)?.[0] ?? ""}`} />
                                    <h3 className="text-lg font-semibold text-[var(--app-text)]">{card.label}</h3>
                                </div>
                                <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-500">
                                    {card.plane} · platform: {card.platformRole} · org: {card.orgRole}
                                </p>
                            </div>
                        </div>

                        <p className="mt-3 text-sm text-slate-400">{card.blurb}</p>

                        <div className="mt-4 space-y-1.5">
                            {ALL_PERMISSIONS.map((perm) => {
                                const ok = granted.has(perm);
                                return (
                                    <div key={perm} className="flex items-center gap-2 text-xs">
                                        {ok ? (
                                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                        ) : (
                                            <X className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                                        )}
                                        <span className={ok ? "text-slate-300" : "text-slate-600 line-through"}>
                                            {PERMISSION_LABELS[perm]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={() => loginAs(card)}
                            disabled={pending !== null}
                            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-[var(--app-text)] ring-1 ring-white/15 transition hover:bg-white/20 disabled:opacity-50"
                        >
                            {pending === card.key ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogIn className="h-4 w-4" />
                            )}
                            {pending === card.key ? "Switching…" : `Login as ${card.label}`}
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
