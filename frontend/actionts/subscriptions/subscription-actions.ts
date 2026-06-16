"use server";

import { db } from "@/db/config";
import {
    subscriptions,
    type NewSubscription,
    type Subscription,
} from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/actionts/auth/checkAuth";

// Get all subscriptions (admin view)
export async function getSubscriptions(): Promise<Subscription[]> {
    await requireAdmin();
    return db.query.subscriptions.findMany({
        with: {
            user: true,
            package: true,
        },
        orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
    });
}

// Get subscription by ID
export async function getSubscriptionById(
    id: string
): Promise<Subscription | undefined> {
    await requireAdmin();
    return db.query.subscriptions.findFirst({
        where: eq(subscriptions.id, id),
        with: {
            user: true,
            package: true,
        },
    });
}

// Get user's active subscription
export async function getUserSubscription(
    userId: string
): Promise<Subscription | undefined> {
    return db.query.subscriptions.findFirst({
        where: and(
            eq(subscriptions.userId, userId),
            eq(subscriptions.status, "active")
        ),
        with: {
            package: true,
        },
    });
}

// Activate/create subscription
export async function activateSubscription(
    data: Omit<NewSubscription, "id" | "createdAt" | "updatedAt" | "status">
): Promise<Subscription> {
    await requireAdmin();

    // Check if user already has an active subscription
    const existing = await db.query.subscriptions.findFirst({
        where: and(
            eq(subscriptions.userId, data.userId),
            eq(subscriptions.status, "active")
        ),
    });

    if (existing) {
        // Deactivate existing subscription
        await db
            .update(subscriptions)
            .set({ status: "cancelled" })
            .where(eq(subscriptions.id, existing.id));
    }

    const [newSubscription] = await db
        .insert(subscriptions)
        .values({
            ...data,
            status: "active",
            startDate: new Date(),
        })
        .returning();

    revalidatePath("/dashboard/admin/subscriptions");

    return newSubscription;
}

// Suspend subscription
export async function suspendSubscription(id: string): Promise<Subscription> {
    await requireAdmin();

    const [updated] = await db
        .update(subscriptions)
        .set({
            status: "suspended",
            suspendedAt: new Date(),
        })
        .where(eq(subscriptions.id, id))
        .returning();

    revalidatePath("/dashboard/admin/subscriptions");

    return updated;
}

// Reactivate suspended subscription
export async function reactivateSubscription(
    id: string
): Promise<Subscription> {
    await requireAdmin();

    const [updated] = await db
        .update(subscriptions)
        .set({
            status: "active",
            suspendedAt: null,
        })
        .where(eq(subscriptions.id, id))
        .returning();

    revalidatePath("/dashboard/admin/subscriptions");

    return updated;
}

// Cancel subscription
export async function cancelSubscription(id: string): Promise<Subscription> {
    await requireAdmin();

    const [updated] = await db
        .update(subscriptions)
        .set({ status: "cancelled" })
        .where(eq(subscriptions.id, id))
        .returning();

    revalidatePath("/dashboard/admin/subscriptions");

    return updated;
}

// Check and mark expired subscriptions
export async function checkExpiredSubscriptions(): Promise<number> {
    await requireAdmin();

    const now = new Date();

    const result = await db
        .update(subscriptions)
        .set({ status: "expired" })
        .where(
            and(
                eq(subscriptions.status, "active"),
                lt(subscriptions.expiresAt, now)
            )
        )
        .returning();

    if (result.length > 0) {
        revalidatePath("/dashboard/admin/subscriptions");
    }

    return result.length;
}

// Update subscription expiry date
export async function updateSubscriptionExpiry(
    id: string,
    expiresAt: Date
): Promise<Subscription> {
    await requireAdmin();

    const [updated] = await db
        .update(subscriptions)
        .set({ expiresAt })
        .where(eq(subscriptions.id, id))
        .returning();

    revalidatePath("/dashboard/admin/subscriptions");

    return updated;
}
