import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Platform-level access control (Better Auth `admin` plugin).
 * These statements/roles govern the SaaS platform plane (staff). Organization-level
 * roles (owner/admin/mentor) are plain strings on `member.role` and enforced by the
 * matrix in `lib/rbac.ts`.
 */
export const statement = {
  ...defaultStatements,
  packages: ["create", "read", "update", "delete", "list"],
  modules: ["read", "list", "toggle"], // toggle = Super Admin module on/off
  org: ["create", "read", "update", "delete", "manageMembers", "billing"],
  audit: ["read"],
} as const;

export const ac = createAccessControl(statement);

/** guest — newly registered / pending; no powers. */
export const guest = ac.newRole({
  packages: [],
  modules: [],
  org: [],
  audit: [],
});

/** user — normal end-user; platform powers come from their organization role. */
export const user = ac.newRole({
  packages: ["read", "list"],
  modules: ["read", "list"],
  org: [],
  audit: [],
});

/** support — read-all across the platform + impersonate; no destructive actions. */
export const support = ac.newRole({
  packages: ["read", "list"],
  modules: ["read", "list"],
  org: ["read"],
  audit: ["read"],
  ...adminAc.statements,
});

/** super_admin — full control of the whole platform, incl. module on/off. */
export const superAdmin = ac.newRole({
  packages: ["create", "read", "update", "delete", "list"],
  modules: ["read", "list", "toggle"],
  org: ["create", "read", "update", "delete", "manageMembers", "billing"],
  audit: ["read"],
  ...adminAc.statements,
});

/** Back-compat alias: the old `admin` platform role maps to super_admin. */
export const admin = superAdmin;
