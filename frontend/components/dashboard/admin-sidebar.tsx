"use client";

import {
    LayoutDashboardIcon,
    TruckIcon,
    DollarSign,
    ToggleRight,
    UserCog
} from "lucide-react";
import {BaseSidebar, type NavItem} from "@/components/dashboard/base-sidebar";
import type {Sidebar} from "@/components/ui/sidebar";
import {ADMIN_BASE} from "@/lib/routes";

const adminNavLinks: NavItem[] = [
    {
        title: "Dashboard",
        url: ADMIN_BASE,
        icon: LayoutDashboardIcon,
    },
    {
        title: "Packages",
        url: `${ADMIN_BASE}/packages`,
        icon: TruckIcon,
    },
    {
        title: "Pricing",
        url: `${ADMIN_BASE}/pricing`,
        icon: DollarSign,
    },
    {
        title: "Modules",
        url: `${ADMIN_BASE}/modules`,
        icon: ToggleRight,
    },
    {
        title: "Role Based Login",
        url: `${ADMIN_BASE}/roles`,
        icon: UserCog,
    },
];

export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
    return <BaseSidebar navItems={adminNavLinks} {...props} />;
}
