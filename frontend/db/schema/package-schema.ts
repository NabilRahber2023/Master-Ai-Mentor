import { relations } from "drizzle-orm";
import {
    boolean,
    index,
    integer,
    json,
    pgEnum,
    pgTable,
    text,
    timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

// Enum for package tiers
export const packageTierEnum = pgEnum("package_tier", [
    "silver",
    "gold",
    "platinum",
    "custom",
]);

// Enum for subscription status
export const subscriptionStatusEnum = pgEnum("subscription_status", [
    "active",
    "suspended",
    "expired",
    "cancelled",
]);

// Enum for discount type
export const discountTypeEnum = pgEnum("discount_type", [
    "percentage",
    "fixed",
]);

// Module types that can be included in packages
export type ModuleType =
    | "grade-prediction"
    | "career-guidance"
    | "ai-chatbot"
    | "growth-potential";

// Packages table
export const packages = pgTable(
    "packages",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        name: text("name").notNull(),
        displayName: text("display_name").notNull(),
        description: text("description"),

        // Modules included in this package (array of service types)
        modules: json("modules").$type<ModuleType[]>().notNull().default([]),

        // Features list for display
        features: json("features").$type<string[]>().notNull().default([]),

        // Package tier
        tier: packageTierEnum("tier").notNull().default("custom"),

        // Pricing
        basePrice: integer("base_price").notNull().default(0),
        currency: text("currency").notNull().default("BDT"),

        // Loyalty points earned on purchase
        loyaltyPoints: integer("loyalty_points").notNull().default(0),

        // Usage limit description
        usageLimit: text("usage_limit"),

        // Visibility and display
        isVisible: boolean("is_visible").notNull().default(false),
        isPopular: boolean("is_popular").notNull().default(false),
        badge: text("badge"),
        sortOrder: integer("sort_order").notNull().default(0),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("packages_tier_idx").on(table.tier),
        index("packages_visible_idx").on(table.isVisible),
    ]
);

// Promotions table
export const promotions = pgTable(
    "promotions",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        name: text("name").notNull(),
        description: text("description"),

        // Promotion type and value
        discountType: discountTypeEnum("discount_type").notNull(),
        discountValue: integer("discount_value").notNull(), // percentage (0-100) or fixed amount

        // Optional: link to specific package (null = applies to all)
        packageId: text("package_id").references(() => packages.id, { onDelete: "cascade" }),

        // Promo code (optional)
        promoCode: text("promo_code"),

        // Validity period
        startDate: timestamp("start_date").notNull(),
        endDate: timestamp("end_date").notNull(),

        // Usage limits
        maxUses: integer("max_uses"), // null = unlimited
        usedCount: integer("used_count").notNull().default(0),

        // Status
        isActive: boolean("is_active").notNull().default(true),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("promotions_package_idx").on(table.packageId),
        index("promotions_active_idx").on(table.isActive),
        index("promotions_dates_idx").on(table.startDate, table.endDate),
    ]
);

// Loyalty redemption rules table
export const loyaltyRedemptionRules = pgTable(
    "loyalty_redemption_rules",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        name: text("name").notNull(),
        description: text("description"),

        // Points required to redeem
        pointsRequired: integer("points_required").notNull(),

        // Discount given
        discountType: discountTypeEnum("discount_type").notNull(),
        discountValue: integer("discount_value").notNull(),

        // Status
        isActive: boolean("is_active").notNull().default(true),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("loyalty_rules_active_idx").on(table.isActive),
    ]
);

// Subscriptions table
export const subscriptions = pgTable(
    "subscriptions",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        // User reference
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),

        // Package reference
        packageId: text("package_id")
            .notNull()
            .references(() => packages.id, { onDelete: "cascade" }),

        // Subscription status
        status: subscriptionStatusEnum("status").notNull().default("active"),

        // Promotion used (optional)
        promotionId: text("promotion_id").references(() => promotions.id),

        // Loyalty points earned from this subscription
        loyaltyPointsEarned: integer("loyalty_points_earned").notNull().default(0),

        // Dates
        startDate: timestamp("start_date").defaultNow().notNull(),
        expiresAt: timestamp("expires_at"),
        suspendedAt: timestamp("suspended_at"),

        // Auto renewal
        autoRenew: boolean("auto_renew").notNull().default(false),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("subscriptions_user_idx").on(table.userId),
        index("subscriptions_package_idx").on(table.packageId),
        index("subscriptions_status_idx").on(table.status),
    ]
);

// Relations
export const packagesRelations = relations(packages, ({ many }) => ({
    subscriptions: many(subscriptions),
    promotions: many(promotions),
}));

export const promotionsRelations = relations(promotions, ({ one, many }) => ({
    package: one(packages, {
        fields: [promotions.packageId],
        references: [packages.id],
    }),
    subscriptions: many(subscriptions),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    user: one(user, {
        fields: [subscriptions.userId],
        references: [user.id],
    }),
    package: one(packages, {
        fields: [subscriptions.packageId],
        references: [packages.id],
    }),
    promotion: one(promotions, {
        fields: [subscriptions.promotionId],
        references: [promotions.id],
    }),
}));

// Duration-based discounts (1, 3, 6, 12 months etc.)
export const durationDiscounts = pgTable(
    "duration_discounts",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        // Duration in months
        months: integer("months").notNull().unique(),

        // Discount percentage (0-100)
        discountPercent: integer("discount_percent").notNull().default(0),

        // Label for display
        label: text("label"), // e.g., "3 Months", "Quarterly"

        // Status
        isActive: boolean("is_active").notNull().default(true),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("duration_discounts_months_idx").on(table.months),
    ]
);

// Volume-based discounts (based on user count)
export const volumeDiscounts = pgTable(
    "volume_discounts",
    {
        id: text("id")
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),

        // User count range
        minUsers: integer("min_users").notNull(),
        maxUsers: integer("max_users"), // null = unlimited

        // Discount percentage (0-100)
        discountPercent: integer("discount_percent").notNull().default(0),

        // Label for display
        label: text("label"), // e.g., "Small Team", "Enterprise"

        // Status
        isActive: boolean("is_active").notNull().default(true),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("volume_discounts_range_idx").on(table.minUsers, table.maxUsers),
    ]
);

// Type exports
export type Package = typeof packages.$inferSelect;
export type NewPackage = typeof packages.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
export type LoyaltyRedemptionRule = typeof loyaltyRedemptionRules.$inferSelect;
export type NewLoyaltyRedemptionRule = typeof loyaltyRedemptionRules.$inferInsert;
export type DurationDiscount = typeof durationDiscounts.$inferSelect;
export type NewDurationDiscount = typeof durationDiscounts.$inferInsert;
export type VolumeDiscount = typeof volumeDiscounts.$inferSelect;
export type NewVolumeDiscount = typeof volumeDiscounts.$inferInsert;
