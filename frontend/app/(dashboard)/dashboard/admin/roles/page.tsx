import { like } from "drizzle-orm";
import { requireSuperAdmin } from "@/actionts/auth/checkAuth";
import { db } from "@/db/config";
import { user as userTable } from "@/db/schema";
import { ROLE_CATALOG, demoEmail } from "@/lib/role-catalog";
import { RoleLoginGrid, type RoleCard } from "./role-login-grid";
import { effectivePermissions } from "@/lib/rbac";

/**
 * "Role Based Login" — a Super-Admin-only console that visualizes every RBAC role
 * and lets you one-click impersonate a seeded demo user for that role. Returning
 * (or logging out) restores the original Super Admin account.
 */
export default async function RoleBasedLoginPage() {
    await requireSuperAdmin();

    // Load the seeded demo users so we can map each role → its userId.
    const rows = await db
        .select({ id: userTable.id, email: userTable.email })
        .from(userTable)
        .where(like(userTable.email, "rbac-%@demo.local"));
    const idByEmail = new Map(rows.map((r) => [r.email, r.id]));

    const cards: RoleCard[] = ROLE_CATALOG.map((spec) => ({
        ...spec,
        email: demoEmail(spec.key),
        userId: idByEmail.get(demoEmail(spec.key)) ?? null,
        permissions: effectivePermissions(spec.platformRole, spec.orgRole),
    }));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-[var(--app-text)]">Role Based Login</h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-400">
                    Every role in the RBAC system, visualized. Click <strong>Login as</strong> to
                    impersonate a demo user with that role — the whole app (frontend + backend) will
                    enforce exactly that role&apos;s permissions. Use <strong>Return to my account</strong>{" "}
                    (banner) or log out to come back as yourself.
                </p>
            </div>
            <RoleLoginGrid cards={cards} />
        </div>
    );
}
