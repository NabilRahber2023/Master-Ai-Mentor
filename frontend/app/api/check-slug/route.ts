import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/config";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
        return NextResponse.json({ available: false, error: "Slug required" }, { status: 400 });
    }

    try {
        // Check if organization with this slug exists
        // The organization table is created by Better Auth organization plugin
        const result = await db.execute(
            sql`SELECT id FROM organization WHERE slug = ${slug} LIMIT 1`
        );

        return NextResponse.json({
            available: result.rows.length === 0,
            slug,
        });
    } catch (error) {
        // If table doesn't exist yet, slug is available
        console.error("Error checking slug:", error);
        return NextResponse.json({
            available: true,
            slug,
        });
    }
}
