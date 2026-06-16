import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/config";
import { organization } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * API route to get current tenant info based on subdomain
 * This is useful for client-side tenant context initialization
 */
export async function GET(request: NextRequest) {
    const subdomain = request.headers.get("x-tenant-subdomain");

    if (!subdomain) {
        return NextResponse.json({ tenant: null });
    }

    try {
        const [org] = await db
            .select()
            .from(organization)
            .where(eq(organization.slug, subdomain))
            .limit(1);

        if (!org) {
            return NextResponse.json({ tenant: null, error: "Organization not found" }, { status: 404 });
        }

        // Parse metadata
        let metadata: { packageId?: string; enabledModules?: string[] } = {};
        if (org.metadata) {
            try {
                metadata = JSON.parse(org.metadata);
            } catch {
                // Invalid JSON
            }
        }

        return NextResponse.json({
            tenant: {
                subdomain,
                organizationId: org.id,
                organizationName: org.name,
                packageId: metadata.packageId || null,
                enabledModules: metadata.enabledModules || [],
            },
        });
    } catch (error) {
        console.error("Error fetching tenant:", error);
        return NextResponse.json({ tenant: null, error: "Internal error" }, { status: 500 });
    }
}
