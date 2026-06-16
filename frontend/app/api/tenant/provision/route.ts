import { NextRequest, NextResponse } from "next/server";
import { createTenantDatabase } from "@/db/tenant-db-manager";
import { db } from "@/db/config";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * POST /api/tenant/provision
 * Creates a new tenant database and updates organization metadata
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { organizationId, slug } = body;

        if (!organizationId || !slug) {
            return NextResponse.json(
                { error: "organizationId and slug are required" },
                { status: 400 }
            );
        }

        // Create the tenant database
        const tenantDbName = await createTenantDatabase(slug);

        // Update organization metadata with database name
        const [org] = await db
            .select()
            .from(organization)
            .where(eq(organization.id, organizationId))
            .limit(1);

        if (!org) {
            return NextResponse.json(
                { error: "Organization not found" },
                { status: 404 }
            );
        }

        // Parse existing metadata and add dbName
        let metadata: Record<string, unknown> = {};
        if (org.metadata) {
            try {
                metadata = JSON.parse(org.metadata);
            } catch {
                // Invalid JSON, start fresh
            }
        }

        metadata.tenantDbName = tenantDbName;
        metadata.tenantDbCreatedAt = new Date().toISOString();

        // Update organization with new metadata
        await db
            .update(organization)
            .set({ metadata: JSON.stringify(metadata) })
            .where(eq(organization.id, organizationId));

        return NextResponse.json({
            success: true,
            tenantDbName,
            message: "Tenant database created successfully",
        });
    } catch (error) {
        console.error("Error provisioning tenant database:", error);
        return NextResponse.json(
            { error: "Failed to provision tenant database" },
            { status: 500 }
        );
    }
}
