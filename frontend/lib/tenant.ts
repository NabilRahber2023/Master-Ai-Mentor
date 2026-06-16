import { cache } from "react";
import { db } from "@/db/config";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";

export type TenantContext = {
    slug: string;
    organizationId: string;
    organizationName: string;
    packageId: string | null;
    enabledModules: string[];
} | null;

/**
 * Get tenant context by slug (server-side, cached per request).
 * Call this from server components/pages that receive the slug from params.
 */
export const getTenantContext = cache(async (slug: string): Promise<TenantContext> => {
    if (!slug) {
        return null;
    }

    try {
        // Lookup organization by slug
        const [org] = await db
            .select()
            .from(organization)
            .where(eq(organization.slug, slug))
            .limit(1);

        if (!org) {
            console.warn(`Organization not found for slug: ${slug}`);
            return null;
        }

        // Parse metadata if exists
        let metadata: { packageId?: string; enabledModules?: string[] } = {};
        if (org.metadata) {
            try {
                metadata = JSON.parse(org.metadata);
            } catch {
                // Invalid JSON, ignore
            }
        }

        return {
            slug,
            organizationId: org.id,
            organizationName: org.name,
            packageId: metadata.packageId || null,
            enabledModules: metadata.enabledModules || [],
        };
    } catch (error) {
        console.error("Error fetching tenant context:", error);
        return null;
    }
});

/**
 * Check if a specific module is enabled for a given tenant slug
 */
export async function isModuleEnabled(slug: string, moduleId: string): Promise<boolean> {
    const tenant = await getTenantContext(slug);
    if (!tenant) return false;
    return tenant.enabledModules.includes(moduleId);
}
