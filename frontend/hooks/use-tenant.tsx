"use client";

import { createContext, useContext, ReactNode } from "react";
import { can, type Permission, type PlatformRole } from "@/lib/rbac";

export type TenantInfo = {
    slug: string;
    organizationId: string;
    organizationName: string;
    packageId: string | null;
    enabledModules: string[]; // module ids enabled for this org (from org_module)
    userRole: string; // user's role in this organization (owner, admin, mentor)
    platformRole: string; // user.role (super_admin, support, user, guest)
} | null;

const TenantContext = createContext<TenantInfo>(null);

interface TenantProviderProps {
    tenant: TenantInfo;
    children: ReactNode;
}

/**
 * Provider component for tenant context
 * Wrap your tenant pages/layouts with this to provide tenant info to client components
 */
export function TenantProvider({ tenant, children }: TenantProviderProps) {
    return (
        <TenantContext.Provider value={tenant}>
            {children}
        </TenantContext.Provider>
    );
}

/**
 * Hook to access current tenant in client components
 * Returns null if not in a tenant context
 */
export function useTenant(): TenantInfo {
    return useContext(TenantContext);
}

/**
 * Hook to check if current tenant has access to a specific module
 */
export function useModuleAccess(moduleId: string): boolean {
    const tenant = useTenant();
    if (!tenant) return false;
    return tenant.enabledModules.includes(moduleId);
}

/**
 * Hook to check a permission for the current user, combining their platform role
 * and organization role via the central RBAC matrix.
 */
export function useCan(perm: Permission): boolean {
    const tenant = useTenant();
    if (!tenant) return false;
    return can({ platformRole: tenant.platformRole as PlatformRole, orgRole: tenant.userRole }, perm);
}

/**
 * Hook that requires tenant context - throws if not available
 */
export function useRequiredTenant(): NonNullable<TenantInfo> {
    const tenant = useTenant();
    if (!tenant) {
        throw new Error("useRequiredTenant must be used within a tenant context");
    }
    return tenant;
}
