"use client";

import { createContext, useContext, ReactNode } from "react";

export type TenantInfo = {
    slug: string;
    organizationId: string;
    organizationName: string;
    packageId: string | null;
    enabledModules: string[];
    userRole: string; // user's role in this organization (owner, admin, member)
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
 * Hook that requires tenant context - throws if not available
 */
export function useRequiredTenant(): NonNullable<TenantInfo> {
    const tenant = useTenant();
    if (!tenant) {
        throw new Error("useRequiredTenant must be used within a tenant context");
    }
    return tenant;
}
