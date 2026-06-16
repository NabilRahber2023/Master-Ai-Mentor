"use server";

import { db } from "@/db/config";
import { packages, type NewPackage, type Package } from "@/db/schema";
import { eq, asc, } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actionts/auth/checkAuth";

// Get all packages (admin view)
export async function getPackages(): Promise<Package[]> {
    await requireAdmin();
    return db.query.packages.findMany({
        orderBy: [asc(packages.sortOrder), asc(packages.name)],
    });
}

// Get visible packages only (for landing page)
export async function getVisiblePackages(): Promise<Package[]> {
    return db.query.packages.findMany({
        where: eq(packages.isVisible, true),
        orderBy: [asc(packages.sortOrder), asc(packages.name)],
    });
}

// Get package by ID
export async function getPackageById(id: string): Promise<Package | undefined> {
    await requireAdmin();
    return db.query.packages.findFirst({
        where: eq(packages.id, id),
    });
}

// Create package
export async function createPackage(
    data: Omit<NewPackage, "id" | "createdAt" | "updatedAt">
): Promise<Package> {
    await requireAdmin();

    const [newPackage] = await db.insert(packages).values(data).returning();

    revalidatePath("/dashboard/admin/packages");
    revalidatePath("/pricing");

    return newPackage;
}

// Update package
export async function updatePackage(
    id: string,
    data: Partial<Omit<NewPackage, "id" | "createdAt" | "updatedAt">>
): Promise<Package> {
    await requireAdmin();

    const [updated] = await db
        .update(packages)
        .set(data)
        .where(eq(packages.id, id))
        .returning();

    revalidatePath("/dashboard/admin/packages");
    revalidatePath("/pricing");

    return updated;
}

// Delete package
export async function deletePackage(id: string): Promise<void> {
    await requireAdmin();

    await db.delete(packages).where(eq(packages.id, id));

    revalidatePath("/dashboard/admin/packages");
    revalidatePath("/pricing");
}

// Toggle package visibility
export async function togglePackageVisibility(
    id: string
): Promise<Package> {
    await requireAdmin();

    const existingPackage = await db.query.packages.findFirst({
        where: eq(packages.id, id),
    });

    if (!existingPackage) {
        throw new Error("Package not found");
    }

    const [updated] = await db
        .update(packages)
        .set({ isVisible: !existingPackage.isVisible })
        .where(eq(packages.id, id))
        .returning();

    revalidatePath("/dashboard/admin/packages");
    revalidatePath("/pricing");

    return updated;
}

// Toggle popular status
export async function togglePackagePopular(
    id: string
): Promise<Package> {
    await requireAdmin();

    const existingPackage = await db.query.packages.findFirst({
        where: eq(packages.id, id),
    });

    if (!existingPackage) {
        throw new Error("Package not found");
    }

    const [updated] = await db
        .update(packages)
        .set({ isPopular: !existingPackage.isPopular })
        .where(eq(packages.id, id))
        .returning();

    revalidatePath("/dashboard/admin/packages");
    revalidatePath("/pricing");

    return updated;
}

// Reorder packages
export async function reorderPackages(
    orderedIds: string[]
): Promise<void> {
    await requireAdmin();

    await Promise.all(
        orderedIds.map((id, index) =>
            db.update(packages).set({ sortOrder: index }).where(eq(packages.id, id))
        )
    );

    revalidatePath("/dashboard/admin/packages");
    revalidatePath("/pricing");
}
