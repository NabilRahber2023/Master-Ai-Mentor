import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Custom statements for B2B e-commerce
 * Extends default admin plugin statements with custom resources
 */
export const statement = {
  ...defaultStatements,
  packages: ["create", "read", "update", "delete", "list"],
  modules : ["read", "list"],
} as const;

export const ac = createAccessControl(statement);

/**
 * Guest role - newly registered users, pending approval
 * Limited access - can only view their profile
 */
export const guest = ac.newRole({
  packages: [],
  modules: [],
});

/**
 * Customer role - approved accounts
 * Can place orders, view products
 */

/**
 * Admin role - full access
 * Can manage users, approve guests, manage all resources
 */
export const admin = ac.newRole({
  packages: ["create", "read", "update", "delete", "list"],
  modules: ["read", "list"],
  ...adminAc.statements,
});
