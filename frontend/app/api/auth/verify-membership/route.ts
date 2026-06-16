import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db/config";
import { member, organization } from "@/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/auth/verify-membership
 * Verifies that the current user is a member of the organization
 * specified by the x-tenant-subdomain header
 */
export async function GET(request: NextRequest) {
    try {
        // Get the session
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { authorized: false, reason: "not_authenticated" },
                { status: 401 }
            );
        }

        // Get subdomain from header
        const subdomain = request.headers.get("x-tenant-subdomain");

        if (!subdomain) {
            return NextResponse.json(
                { authorized: false, reason: "no_subdomain" },
                { status: 400 }
            );
        }

        // Find the organization by slug
        const [org] = await db
            .select()
            .from(organization)
            .where(eq(organization.slug, subdomain))
            .limit(1);

        if (!org) {
            return NextResponse.json(
                { authorized: false, reason: "org_not_found" },
                { status: 404 }
            );
        }

        // Check if user is a member of this organization
        const [membership] = await db
            .select()
            .from(member)
            .where(
                and(
                    eq(member.organizationId, org.id),
                    eq(member.userId, session.user.id)
                )
            )
            .limit(1);

        if (!membership) {
            return NextResponse.json(
                { authorized: false, reason: "not_a_member" },
                { status: 403 }
            );
        }

        return NextResponse.json({
            authorized: true,
            organization: {
                id: org.id,
                name: org.name,
                slug: org.slug,
            },
            membership: {
                role: membership.role,
            },
        });
    } catch (error) {
        console.error("Error verifying membership:", error);
        return NextResponse.json(
            { authorized: false, reason: "server_error" },
            { status: 500 }
        );
    }
}
