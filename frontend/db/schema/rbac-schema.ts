import { relations } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";

/**
 * RBAC: module registry, per-org module entitlements, and an audit log.
 * The Super Admin toggles `org_module.enabled`; a module is usable only when its
 * org_module row is enabled AND `module_registry.global_enabled` is true.
 */

// Catalog of platform modules (seeded). global_enabled = platform kill-switch.
export const moduleRegistry = pgTable("module_registry", {
  id: text("id").primaryKey(), // module key, e.g. "career-guidance"
  name: text("name").notNull(),
  description: text("description"),
  globalEnabled: boolean("global_enabled").notNull().default(true),
  sortOrder: text("sort_order"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Per-organization module entitlement — the Super Admin's on/off switch.
export const orgModule = pgTable(
  "org_module",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    moduleId: text("module_id")
      .notNull()
      .references(() => moduleRegistry.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    updatedBy: text("updated_by"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [
    unique("org_module_unique").on(t.organizationId, t.moduleId),
    index("org_module_org_idx").on(t.organizationId),
  ],
);

// Append-only audit trail of sensitive actions.
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    actorUserId: text("actor_user_id"),
    organizationId: text("organization_id"),
    action: text("action").notNull(), // e.g. "module.toggle", "csv.upload"
    detail: jsonb("detail"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("audit_actor_idx").on(t.actorUserId),
    index("audit_org_idx").on(t.organizationId),
    index("audit_created_idx").on(t.createdAt),
  ],
);

export const orgModuleRelations = relations(orgModule, ({ one }) => ({
  organization: one(organization, {
    fields: [orgModule.organizationId],
    references: [organization.id],
  }),
  module: one(moduleRegistry, {
    fields: [orgModule.moduleId],
    references: [moduleRegistry.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(user, { fields: [auditLog.actorUserId], references: [user.id] }),
}));

export type ModuleRegistry = typeof moduleRegistry.$inferSelect;
export type OrgModule = typeof orgModule.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;
