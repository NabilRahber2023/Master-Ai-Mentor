"use server";

import { db } from "@/db/config";
import { loyaltyRedemptionRules, type NewLoyaltyRedemptionRule, type LoyaltyRedemptionRule } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actionts/auth/checkAuth";

// Get all loyalty redemption rules (admin view)
export async function getLoyaltyRules(): Promise<LoyaltyRedemptionRule[]> {
    await requireAdmin();
    return db.query.loyaltyRedemptionRules.findMany({
        orderBy: [asc(loyaltyRedemptionRules.pointsRequired)],
    });
}

// Get active loyalty rules (for redemption)
export async function getActiveLoyaltyRules(): Promise<LoyaltyRedemptionRule[]> {
    return db.query.loyaltyRedemptionRules.findMany({
        where: eq(loyaltyRedemptionRules.isActive, true),
        orderBy: [asc(loyaltyRedemptionRules.pointsRequired)],
    });
}

// Get loyalty rule by ID
export async function getLoyaltyRuleById(id: string): Promise<LoyaltyRedemptionRule | undefined> {
    await requireAdmin();
    return db.query.loyaltyRedemptionRules.findFirst({
        where: eq(loyaltyRedemptionRules.id, id),
    });
}

// Create loyalty rule
export async function createLoyaltyRule(
    data: Omit<NewLoyaltyRedemptionRule, "id" | "createdAt" | "updatedAt">
): Promise<LoyaltyRedemptionRule> {
    await requireAdmin();

    const [newRule] = await db.insert(loyaltyRedemptionRules).values(data).returning();

    revalidatePath("/dashboard/admin/pricing");

    return newRule;
}

// Update loyalty rule
export async function updateLoyaltyRule(
    id: string,
    data: Partial<Omit<NewLoyaltyRedemptionRule, "id" | "createdAt" | "updatedAt">>
): Promise<LoyaltyRedemptionRule> {
    await requireAdmin();

    const [updated] = await db
        .update(loyaltyRedemptionRules)
        .set(data)
        .where(eq(loyaltyRedemptionRules.id, id))
        .returning();

    revalidatePath("/dashboard/admin/pricing");

    return updated;
}

// Delete loyalty rule
export async function deleteLoyaltyRule(id: string): Promise<void> {
    await requireAdmin();

    await db.delete(loyaltyRedemptionRules).where(eq(loyaltyRedemptionRules.id, id));

    revalidatePath("/dashboard/admin/pricing");
}

// Toggle loyalty rule active status
export async function toggleLoyaltyRuleActive(id: string): Promise<LoyaltyRedemptionRule> {
    await requireAdmin();

    const existing = await db.query.loyaltyRedemptionRules.findFirst({
        where: eq(loyaltyRedemptionRules.id, id),
    });

    if (!existing) {
        throw new Error("Loyalty rule not found");
    }

    const [updated] = await db
        .update(loyaltyRedemptionRules)
        .set({ isActive: !existing.isActive })
        .where(eq(loyaltyRedemptionRules.id, id))
        .returning();

    revalidatePath("/dashboard/admin/pricing");

    return updated;
}
