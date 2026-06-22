"use server";

import { db } from "@/db/config";
import { organization, moduleRegistry, orgModule, auditLog } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireSuperAdmin } from "@/actionts/auth/checkAuth";
import { revalidatePath } from "next/cache";

export interface ModuleMatrixRow {
    orgId: string;
    orgName: string;
    slug: string | null;
    enabled: Record<string, boolean>; // moduleId -> enabled
}

export interface ModuleMatrix {
    modules: { id: string; name: string; globalEnabled: boolean }[];
    orgs: ModuleMatrixRow[];
}

/** Load the org × module entitlement matrix (Super Admin only). */
export async function getModuleMatrix(): Promise<ModuleMatrix> {
    await requireSuperAdmin();

    const modules = await db
        .select({ id: moduleRegistry.id, name: moduleRegistry.name, globalEnabled: moduleRegistry.globalEnabled })
        .from(moduleRegistry)
        .orderBy(moduleRegistry.sortOrder);

    const orgs = await db.select().from(organization);
    const rows = await db.select().from(orgModule);

    const byOrg = new Map<string, Record<string, boolean>>();
    for (const r of rows) {
        const m = byOrg.get(r.organizationId) ?? {};
        m[r.moduleId] = r.enabled;
        byOrg.set(r.organizationId, m);
    }

    return {
        modules,
        orgs: orgs.map((o) => ({
            orgId: o.id,
            orgName: o.name,
            slug: o.slug,
            enabled: byOrg.get(o.id) ?? {},
        })),
    };
}

/** Toggle a module on/off for an organization (Super Admin only). Audited. */
export async function toggleOrgModule(orgId: string, moduleId: string, enabled: boolean) {
    const session = await requireSuperAdmin();

    const existing = await db
        .select()
        .from(orgModule)
        .where(and(eq(orgModule.organizationId, orgId), eq(orgModule.moduleId, moduleId)))
        .limit(1);

    if (existing.length) {
        await db
            .update(orgModule)
            .set({ enabled, updatedBy: session.user.id, updatedAt: new Date() })
            .where(and(eq(orgModule.organizationId, orgId), eq(orgModule.moduleId, moduleId)));
    } else {
        await db.insert(orgModule).values({
            organizationId: orgId,
            moduleId,
            enabled,
            updatedBy: session.user.id,
        });
    }

    await db.insert(auditLog).values({
        actorUserId: session.user.id,
        organizationId: orgId,
        action: "module.toggle",
        detail: { moduleId, enabled },
    });

    revalidatePath("/dashboard/admin/modules");
    return { success: true };
}

/** Global kill-switch for a module across all orgs (Super Admin only). */
export async function setModuleGlobal(moduleId: string, globalEnabled: boolean) {
    const session = await requireSuperAdmin();
    await db.update(moduleRegistry).set({ globalEnabled }).where(eq(moduleRegistry.id, moduleId));
    await db.insert(auditLog).values({
        actorUserId: session.user.id,
        action: "module.global_toggle",
        detail: { moduleId, globalEnabled },
    });
    revalidatePath("/dashboard/admin/modules");
    return { success: true };
}
