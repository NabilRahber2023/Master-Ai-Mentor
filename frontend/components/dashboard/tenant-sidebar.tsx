"use client";

import {
    GraduationCap,
    Compass,
    Bot,
    TrendingUp,
    Users,
    Settings,
    LayoutDashboard,
    Brain,
} from "lucide-react";
import { BaseSidebar, type NavItem } from "@/components/dashboard/base-sidebar";
import type { Sidebar } from "@/components/ui/sidebar";
import { useTenant } from "@/hooks/use-tenant";

// Tenant navigation items — all hrefs prefixed with /{slug}
const getTenantNavItems = (slug: string, enabledModules: string[]): NavItem[] => {
    const allNavItems: NavItem[] = [
        {
            title: "Dashboard",
            url: `/${slug}/home`,
            icon: LayoutDashboard,
        },
        {
            title: "Grade Prediction",
            url: `/${slug}/modules/grade-prediction`,
            icon: GraduationCap,
        },
        {
            title: "Career Guidance",
            url: `/${slug}/modules/career-guidance`,
            icon: Compass,
        },
        {
            title: "AI Chatbot",
            url: `/${slug}/modules/ai-chatbot`,
            icon: Bot,
        },
        {
            title: "Growth Potential",
            url: `/${slug}/modules/growth-potential`,
            icon: TrendingUp,
        },
    ];

    // Filter modules based on what's enabled
    // Dashboard is always visible
    return allNavItems.filter(item => {
        if (item.url === `/${slug}/home`) return true;

        // Extract module ID from URL
        const moduleId = item.url.replace(`/${slug}/modules/`, "");
        return enabledModules.includes(moduleId);
    });
};

// Management navigation items — built dynamically with slug prefix
const getManagementNavItems = (slug: string): NavItem[] => [
    {
        title: "Subject Prediction",
        url: `/${slug}/subject-prediction`,
        icon: Brain,
    },
    {
        title: "Settings",
        url: `/${slug}/settings`,
        icon: Settings,
    },
];

export function TenantSidebar(props: React.ComponentProps<typeof Sidebar>) {
    const tenant = useTenant();

    if (!tenant) {
        return null;
    }

    // Get enabled modules from tenant context
    const moduleNavItems = getTenantNavItems(tenant.slug, tenant.enabledModules);

    // Combine with management items
    const allNavItems = [...moduleNavItems, ...getManagementNavItems(tenant.slug)];

    return (
        <BaseSidebar
            navItems={allNavItems}
            header={{
                logo: (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                            {tenant.organizationName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                ),
                title: tenant.organizationName,
                subtitle: `${tenant.packageId?.charAt(0).toUpperCase()}${tenant.packageId?.slice(1)} Plan`,
                href: `/${tenant.slug}/home`,
            }}
            {...props}
        />
    );
}
