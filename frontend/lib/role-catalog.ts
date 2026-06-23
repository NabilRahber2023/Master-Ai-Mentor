import type { PlatformRole, OrgRole } from "@/lib/rbac";

/**
 * The canonical set of demo roles surfaced on the "Role Based Login" page.
 * Each entry maps to a seeded demo user (email = `rbac-<key>@demo.local`) created
 * by `create-rbac-demo-users.mjs`. Clicking a role impersonates that user.
 *
 * Keep `key`/`platformRole`/`orgRole`/email convention in sync with the seed script.
 */
export interface RoleSpec {
    key: string;
    label: string;
    plane: "Platform" | "Organization";
    platformRole: PlatformRole;
    orgRole: Exclude<OrgRole, null>;
    /** Where impersonating this role should land. `{slug}` is replaced at runtime. */
    landing: string;
    blurb: string;
    accent: string; // tailwind ring/text accent
}

export const DEMO_ORG_SLUG = "oxford";
export const DEMO_PASSWORD = "Demo@12345#";
export const demoEmail = (key: string) => `rbac-${key}@demo.local`;

export const ROLE_CATALOG: RoleSpec[] = [
    {
        key: "super_admin",
        label: "Super Admin",
        plane: "Platform",
        platformRole: "super_admin",
        orgRole: "owner",
        landing: "/dashboard/admin",
        blurb: "Full control of the platform: every org, packages, module toggles, users, impersonation, audit.",
        accent: "violet",
    },
    {
        key: "support",
        label: "Support",
        plane: "Platform",
        platformRole: "support",
        orgRole: "mentor",
        landing: "/{slug}/home",
        blurb: "Read-only across orgs + impersonate to reproduce issues. No destructive actions or toggles.",
        accent: "sky",
    },
    {
        key: "user",
        label: "User",
        plane: "Platform",
        platformRole: "user",
        orgRole: "member",
        landing: "/{slug}/home",
        blurb: "Normal end-user. No platform powers; effective rights come from the organization role.",
        accent: "slate",
    },
    {
        key: "guest",
        label: "Guest",
        plane: "Platform",
        platformRole: "guest",
        orgRole: "guest",
        landing: "/{slug}/home",
        blurb: "Pending / unapproved. No access — sees an 'awaiting approval' style empty state.",
        accent: "zinc",
    },
    {
        key: "owner",
        label: "Org Owner",
        plane: "Organization",
        platformRole: "user",
        orgRole: "owner",
        landing: "/{slug}/home",
        blurb: "Everything an org admin can do plus billing and deleting the org.",
        accent: "amber",
    },
    {
        key: "admin",
        label: "Org Admin",
        plane: "Organization",
        platformRole: "user",
        orgRole: "admin",
        landing: "/{slug}/home",
        blurb: "Manage members, upload datasets, change settings, use all enabled modules.",
        accent: "emerald",
    },
    {
        key: "analyst",
        label: "Analyst",
        plane: "Organization",
        platformRole: "user",
        orgRole: "analyst",
        landing: "/{slug}/home",
        blurb: "Run every prediction (single + batch), use chatbot, upload datasets. No member management.",
        accent: "teal",
    },
    {
        key: "mentor",
        label: "Mentor",
        plane: "Organization",
        platformRole: "user",
        orgRole: "mentor",
        landing: "/{slug}/home",
        blurb: "Run single-student predictions + chatbot. No dataset upload, no batch.",
        accent: "cyan",
    },
    {
        key: "viewer",
        label: "Viewer",
        plane: "Organization",
        platformRole: "user",
        orgRole: "viewer",
        landing: "/{slug}/home",
        blurb: "Read-only stakeholder. View dashboards/results; cannot run predictions or upload.",
        accent: "rose",
    },
];
