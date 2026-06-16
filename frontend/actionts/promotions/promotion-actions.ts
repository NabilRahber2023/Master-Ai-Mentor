"use server";

import { db } from "@/db/config";
import { promotions, type NewPromotion, type Promotion } from "@/db/schema";
import { eq, and, lte, gte, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actionts/auth/checkAuth";

// Get all promotions (admin view)
export async function getPromotions(): Promise<Promotion[]> {
    await requireAdmin();
    return db.query.promotions.findMany({
        orderBy: [asc(promotions.startDate)],
        with: {
            package: true,
        },
    });
}

// Get active promotions (for checkout)
export async function getActivePromotions(packageId?: string): Promise<Promotion[]> {
    const now = new Date();

    const conditions = [
        eq(promotions.isActive, true),
        lte(promotions.startDate, now),
        gte(promotions.endDate, now),
    ];

    if (packageId) {
        // Get promotions for specific package or global promotions
        return db.query.promotions.findMany({
            where: and(
                ...conditions,
                // Either package-specific or global (no packageId)
            ),
        });
    }

    return db.query.promotions.findMany({
        where: and(...conditions),
    });
}

// Get promotion by ID
export async function getPromotionById(id: string): Promise<Promotion | undefined> {
    await requireAdmin();
    return db.query.promotions.findFirst({
        where: eq(promotions.id, id),
        with: {
            package: true,
        },
    });
}

// Create promotion
export async function createPromotion(
    data: Omit<NewPromotion, "id" | "createdAt" | "updatedAt" | "usedCount">
): Promise<Promotion> {
    await requireAdmin();

    const [newPromotion] = await db.insert(promotions).values(data).returning();

    revalidatePath("/dashboard/admin/pricing");

    return newPromotion;
}

// Update promotion
export async function updatePromotion(
    id: string,
    data: Partial<Omit<NewPromotion, "id" | "createdAt" | "updatedAt">>
): Promise<Promotion> {
    await requireAdmin();

    const [updated] = await db
        .update(promotions)
        .set(data)
        .where(eq(promotions.id, id))
        .returning();

    revalidatePath("/dashboard/admin/pricing");

    return updated;
}

// Delete promotion
export async function deletePromotion(id: string): Promise<void> {
    await requireAdmin();

    await db.delete(promotions).where(eq(promotions.id, id));

    revalidatePath("/dashboard/admin/pricing");
}

// Toggle promotion active status
export async function togglePromotionActive(id: string): Promise<Promotion> {
    await requireAdmin();

    const existing = await db.query.promotions.findFirst({
        where: eq(promotions.id, id),
    });

    if (!existing) {
        throw new Error("Promotion not found");
    }

    const [updated] = await db
        .update(promotions)
        .set({ isActive: !existing.isActive })
        .where(eq(promotions.id, id))
        .returning();

    revalidatePath("/dashboard/admin/pricing");

    return updated;
}

// Increment promotion used count
export async function incrementPromotionUsedCount(id: string): Promise<void> {
    const existing = await db.query.promotions.findFirst({
        where: eq(promotions.id, id),
    });

    if (!existing) {
        throw new Error("Promotion not found");
    }

    await db
        .update(promotions)
        .set({ usedCount: existing.usedCount + 1 })
        .where(eq(promotions.id, id));
}

// Validate promo code
export async function validatePromoCode(
    code: string,
    packageId?: string
): Promise<Promotion | null> {
    const now = new Date();

    const promotion = await db.query.promotions.findFirst({
        where: and(
            eq(promotions.promoCode, code),
            eq(promotions.isActive, true),
            lte(promotions.startDate, now),
            gte(promotions.endDate, now),
        ),
    });

    if (!promotion) {
        return null;
    }

    // Check if maxUses reached
    if (promotion.maxUses && promotion.usedCount >= promotion.maxUses) {
        return null;
    }

    // Check if package-specific and matches
    if (promotion.packageId && packageId && promotion.packageId !== packageId) {
        return null;
    }

    return promotion;
}
