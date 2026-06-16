"use server";

import { db } from "@/db/config";
import {
    durationDiscounts,
    volumeDiscounts,
    type NewDurationDiscount,
    type DurationDiscount,
    type NewVolumeDiscount,
    type VolumeDiscount,
} from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actionts/auth/checkAuth";

// ==================== Duration Discounts ====================

// Get all duration discounts
export async function getDurationDiscounts(): Promise<DurationDiscount[]> {
    return db.query.durationDiscounts.findMany({
        orderBy: [asc(durationDiscounts.months)],
    });
}

// Get active duration discounts (for calculator)
export async function getActiveDurationDiscounts(): Promise<DurationDiscount[]> {
    return db.query.durationDiscounts.findMany({
        where: eq(durationDiscounts.isActive, true),
        orderBy: [asc(durationDiscounts.months)],
    });
}

// Create duration discount
export async function createDurationDiscount(
    data: Omit<NewDurationDiscount, "id" | "createdAt" | "updatedAt">
): Promise<DurationDiscount> {
    await requireAdmin();

    const [newDiscount] = await db.insert(durationDiscounts).values(data).returning();

    revalidatePath("/dashboard/admin/pricing");
    revalidatePath("/pricing");

    return newDiscount;
}

// Update duration discount
export async function updateDurationDiscount(
    id: string,
    data: Partial<Omit<NewDurationDiscount, "id" | "createdAt" | "updatedAt">>
): Promise<DurationDiscount> {
    await requireAdmin();

    const [updated] = await db
        .update(durationDiscounts)
        .set(data)
        .where(eq(durationDiscounts.id, id))
        .returning();

    revalidatePath("/dashboard/admin/pricing");
    revalidatePath("/pricing");

    return updated;
}

// Delete duration discount
export async function deleteDurationDiscount(id: string): Promise<void> {
    await requireAdmin();

    await db.delete(durationDiscounts).where(eq(durationDiscounts.id, id));

    revalidatePath("/dashboard/admin/pricing");
    revalidatePath("/pricing");
}

// ==================== Volume Discounts ====================

// Get all volume discounts
export async function getVolumeDiscounts(): Promise<VolumeDiscount[]> {
    return db.query.volumeDiscounts.findMany({
        orderBy: [asc(volumeDiscounts.minUsers)],
    });
}

// Get active volume discounts (for calculator)
export async function getActiveVolumeDiscounts(): Promise<VolumeDiscount[]> {
    return db.query.volumeDiscounts.findMany({
        where: eq(volumeDiscounts.isActive, true),
        orderBy: [asc(volumeDiscounts.minUsers)],
    });
}

// Create volume discount
export async function createVolumeDiscount(
    data: Omit<NewVolumeDiscount, "id" | "createdAt" | "updatedAt">
): Promise<VolumeDiscount> {
    await requireAdmin();

    const [newDiscount] = await db.insert(volumeDiscounts).values(data).returning();

    revalidatePath("/dashboard/admin/pricing");
    revalidatePath("/pricing");

    return newDiscount;
}

// Update volume discount
export async function updateVolumeDiscount(
    id: string,
    data: Partial<Omit<NewVolumeDiscount, "id" | "createdAt" | "updatedAt">>
): Promise<VolumeDiscount> {
    await requireAdmin();

    const [updated] = await db
        .update(volumeDiscounts)
        .set(data)
        .where(eq(volumeDiscounts.id, id))
        .returning();

    revalidatePath("/dashboard/admin/pricing");
    revalidatePath("/pricing");

    return updated;
}

// Delete volume discount
export async function deleteVolumeDiscount(id: string): Promise<void> {
    await requireAdmin();

    await db.delete(volumeDiscounts).where(eq(volumeDiscounts.id, id));

    revalidatePath("/dashboard/admin/pricing");
    revalidatePath("/pricing");
}

// Seed default discounts if none exist
export async function seedDefaultDiscounts(): Promise<void> {
    await requireAdmin();

    // Check if duration discounts exist
    const existingDuration = await db.query.durationDiscounts.findMany();
    if (existingDuration.length === 0) {
        await db.insert(durationDiscounts).values([
            { months: 1, discountPercent: 0, label: "Monthly", isActive: true },
            { months: 3, discountPercent: 5, label: "3 Months", isActive: true },
            { months: 6, discountPercent: 10, label: "6 Months", isActive: true },
            { months: 12, discountPercent: 20, label: "Annual", isActive: true },
        ]);
    }

    // Check if volume discounts exist
    const existingVolume = await db.query.volumeDiscounts.findMany();
    if (existingVolume.length === 0) {
        await db.insert(volumeDiscounts).values([
            { minUsers: 1, maxUsers: 100, discountPercent: 0, label: "Starter", isActive: true },
            { minUsers: 101, maxUsers: 250, discountPercent: 5, label: "Growing", isActive: true },
            { minUsers: 251, maxUsers: 500, discountPercent: 10, label: "Business", isActive: true },
            { minUsers: 501, maxUsers: null, discountPercent: 15, label: "Enterprise", isActive: true },
        ]);
    }

    revalidatePath("/dashboard/admin/pricing");
    revalidatePath("/pricing");
}
