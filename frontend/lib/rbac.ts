/**
 * Central RBAC matrix + helpers (framework-agnostic).
 *
 * Two role planes:
 *  - platformRole  → user.role        (super_admin | support | user | guest; legacy 'admin' == super_admin)
 *  - orgRole       → member.role       (owner | admin | mentor; legacy 'member' == mentor)
 *
 * A permission is granted if the platform role OR the organization role grants it.
 * `super_admin` is allowed everything. Module usage additionally requires the org to
 * be entitled to that module (org_module.enabled) — checked separately by callers.
 *
 * The FastAPI backend mirrors this matrix in backend/app/auth/matrix.py — keep them in sync.
 */

export const MODULES = [
  "grade-prediction",
  "career-guidance",
  "subject-prediction",
  "growth-potential",
  "ai-chatbot",
  "batch-prediction",
] as const;
export type ModuleId = (typeof MODULES)[number];

export type Permission =
  // platform
  | "platform:packages"
  | "platform:orgs"
  | "platform:users"
  | "platform:impersonate"
  | "modules:toggle"
  | "audit:read"
  // organization
  | "org:manageMembers"
  | "org:settings"
  | "org:billing"
  // data & intelligence
  | "dataset:upload"
  | "predict:single"
  | "predict:batch"
  | "chatbot:use"
  | "dashboard:view";

export type PlatformRole = "super_admin" | "support" | "user" | "guest" | "admin";
export type OrgRole =
  | "owner" | "admin" | "analyst" | "mentor" | "viewer" | "member" | "guest"
  | string | null;

export interface Principal {
  userId?: string;
  platformRole: PlatformRole;
  orgRole?: OrgRole;
}

const PLATFORM_PERMS: Record<string, Permission[]> = {
  super_admin: [
    "platform:packages", "platform:orgs", "platform:users", "platform:impersonate",
    "modules:toggle", "audit:read",
    "org:manageMembers", "org:settings", "org:billing",
    "dataset:upload", "predict:single", "predict:batch", "chatbot:use", "dashboard:view",
  ],
  admin: [ // legacy platform admin == super_admin
    "platform:packages", "platform:orgs", "platform:users", "platform:impersonate",
    "modules:toggle", "audit:read",
    "org:manageMembers", "org:settings", "org:billing",
    "dataset:upload", "predict:single", "predict:batch", "chatbot:use", "dashboard:view",
  ],
  support: ["platform:impersonate", "audit:read", "dashboard:view", "predict:single", "chatbot:use"],
  user: [],
  guest: [],
};

const ORG_PERMS: Record<string, Permission[]> = {
  owner: [
    "org:manageMembers", "org:settings", "org:billing",
    "dataset:upload", "predict:single", "predict:batch", "chatbot:use", "dashboard:view",
  ],
  admin: [
    "org:manageMembers", "org:settings",
    "dataset:upload", "predict:single", "predict:batch", "chatbot:use", "dashboard:view",
  ],
  // analyst — power analyst: run everything (single + batch) + upload, no member mgmt.
  analyst: [
    "dataset:upload", "predict:single", "predict:batch", "chatbot:use", "dashboard:view",
  ],
  mentor: ["predict:single", "chatbot:use", "dashboard:view"],
  member: ["predict:single", "chatbot:use", "dashboard:view"], // legacy alias of mentor
  // viewer — read-only stakeholder: dashboards only, cannot run/upload.
  viewer: ["dashboard:view"],
  // guest — pending/unapproved: no powers.
  guest: [],
};

export function isSuperAdmin(platformRole?: string | null): boolean {
  return platformRole === "super_admin" || platformRole === "admin";
}

export function isPlatformStaff(platformRole?: string | null): boolean {
  return isSuperAdmin(platformRole) || platformRole === "support";
}

/** Does this principal have the given permission (platform OR org grant)? */
export function can(p: Principal | null | undefined, perm: Permission): boolean {
  if (!p) return false;
  if (isSuperAdmin(p.platformRole)) return true;
  if ((PLATFORM_PERMS[p.platformRole] ?? []).includes(perm)) return true;
  if (p.orgRole && (ORG_PERMS[p.orgRole] ?? []).includes(perm)) return true;
  return false;
}

/** Map a module id to the permission required to *run* it. */
export function modulePermission(moduleId: string): Permission {
  return moduleId === "batch-prediction" ? "predict:batch" : "predict:single";
}

/** Every permission in the matrix, in display order. */
export const ALL_PERMISSIONS: Permission[] = [
  "platform:packages", "platform:orgs", "platform:users", "platform:impersonate",
  "modules:toggle", "audit:read",
  "org:manageMembers", "org:settings", "org:billing",
  "dataset:upload", "predict:single", "predict:batch", "chatbot:use", "dashboard:view",
];

/** Human-readable labels for permissions (for the RBAC visualization page). */
export const PERMISSION_LABELS: Record<Permission, string> = {
  "platform:packages": "Manage packages & pricing",
  "platform:orgs": "Create / suspend organizations",
  "platform:users": "Manage any user / ban",
  "platform:impersonate": "Impersonate users",
  "modules:toggle": "Toggle modules per org",
  "audit:read": "View audit log",
  "org:manageMembers": "Manage members & invites",
  "org:settings": "Edit org settings",
  "org:billing": "View billing / subscription",
  "dataset:upload": "Upload / replace dataset",
  "predict:single": "Run single prediction",
  "predict:batch": "Run batch / cohort prediction",
  "chatbot:use": "Use AI chatbot",
  "dashboard:view": "View dashboards / results",
};

/**
 * Effective permission set for a (platformRole, orgRole) pair — the union of
 * both planes (super_admin gets everything). Used by the Role-Based Login page.
 */
export function effectivePermissions(
  platformRole: PlatformRole,
  orgRole?: OrgRole,
): Permission[] {
  if (isSuperAdmin(platformRole)) return [...ALL_PERMISSIONS];
  const set = new Set<Permission>();
  for (const p of PLATFORM_PERMS[platformRole] ?? []) set.add(p);
  if (orgRole) for (const p of ORG_PERMS[orgRole] ?? []) set.add(p);
  return ALL_PERMISSIONS.filter((p) => set.has(p));
}

/** Which permission backs each FastAPI endpoint group (mirrored on backend). */
export const ENDPOINT_PERMISSIONS: { test: RegExp; perm: Permission; module?: ModuleId }[] = [
  { test: /\/admin\/upload-csv/, perm: "dataset:upload" },
  { test: /\/prediction\/csv\/[^/]+\/batch/, perm: "predict:batch" },
  { test: /\/prediction\/batch\//, perm: "predict:batch", module: "batch-prediction" },
  { test: /\/prediction\//, perm: "predict:single" },
  { test: /\/chat(\/|$)/, perm: "chatbot:use", module: "ai-chatbot" },
];
