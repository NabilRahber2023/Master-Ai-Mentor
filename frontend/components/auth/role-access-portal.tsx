"use client";

import { useState } from "react";
import {
    Crown,
    ShieldCheck,
    LifeBuoy,
    User as UserIcon,
    UserMinus,
    Building2,
    ShieldHalf,
    BarChart3,
    GraduationCap,
    Eye,
    type LucideIcon,
} from "lucide-react";
import EmailLoginForm from "@/components/auth/email-login-form";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface RoleCard {
    key: string;
    name: string;
    desc: string;
    email: string;
    password: string;
    Icon: LucideIcon;
}

// Each card maps to a REAL system account. Clicking opens the login modal, which
// authenticates through the normal production flow — no bypass, no impersonation.
// Owner = the super-admin oxford account; Org Owner = the daffodil owner account;
// the remaining roles are seeded by `seed-role-accounts.mjs` (password Demo@123)
// with their real platform + organization roles in the "daffodil" org.
const ROLE_CARDS: RoleCard[] = [
    { key: "owner", name: "Owner", desc: "Full platform owner with complete access.", email: "oxford@gmail.com", password: "Admin@12345", Icon: Crown },
    { key: "super_admin", name: "Super Admin", desc: "Manage all organizations, modules & users.", email: "superadmin@system.com", password: "Demo@123", Icon: ShieldCheck },
    { key: "support", name: "Support", desc: "Read-only across orgs with impersonation.", email: "support@system.com", password: "Demo@123", Icon: LifeBuoy },
    { key: "user", name: "User", desc: "Standard end-user; rights come from org role.", email: "user@system.com", password: "Demo@123", Icon: UserIcon },
    { key: "guest", name: "Guest", desc: "Pending access — awaiting approval.", email: "guest@system.com", password: "Demo@123", Icon: UserMinus },
    { key: "org_owner", name: "Org Owner", desc: "Owns the organization and its billing.", email: "owner@daffodil.com", password: "Owner@12345", Icon: Building2 },
    { key: "org_admin", name: "Org Admin", desc: "Manages members, dataset & settings.", email: "orgadmin@system.com", password: "Demo@123", Icon: ShieldHalf },
    { key: "analyst", name: "Analyst", desc: "Runs all predictions, batch & uploads.", email: "analyst@system.com", password: "Demo@123", Icon: BarChart3 },
    { key: "mentor", name: "Mentor", desc: "Runs single predictions & the chatbot.", email: "mentor@system.com", password: "Demo@123", Icon: GraduationCap },
    { key: "viewer", name: "Viewer", desc: "Read-only dashboards & results.", email: "viewer@system.com", password: "Demo@123", Icon: Eye },
];

export default function RoleAccessPortal() {
    const [selected, setSelected] = useState<RoleCard | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                {ROLE_CARDS.map((role) => {
                    const { Icon } = role;
                    return (
                        <button
                            key={role.key}
                            type="button"
                            onClick={() => setSelected(role)}
                            aria-label={`Sign in as ${role.name}`}
                            className="group flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-background/40 p-4 text-left transition-all hover:border-cyan-400/50 hover:bg-cyan-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
                        >
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300 transition-colors group-hover:bg-cyan-500/20">
                                <Icon className="h-5 w-5" />
                            </span>
                            <span className="text-sm font-semibold text-foreground">{role.name}</span>
                            <span className="text-[11px] leading-snug text-muted-foreground">{role.desc}</span>
                        </button>
                    );
                })}
            </div>

            <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="sm:max-w-md backdrop-blur-xl bg-background/80 border-white/10">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <selected.Icon className="h-5 w-5 text-cyan-300" />
                                    Sign in as {selected.name}
                                </DialogTitle>
                                <DialogDescription>
                                    {selected.desc} Authenticates through the normal login — your access
                                    is exactly what this role&apos;s permissions allow.
                                </DialogDescription>
                            </DialogHeader>
                            <EmailLoginForm
                                key={selected.key}
                                prefillEmail={selected.email}
                                prefillPassword={selected.password}
                                onSuccess={() => setSelected(null)}
                            />
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
