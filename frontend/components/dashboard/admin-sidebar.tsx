"use client";

import {
    LayoutDashboardIcon,
    TruckIcon,
    DollarSign
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
];

export function AdminSidebar(props: React.ComponentProps<typeof Sidebar>) {
    return <BaseSidebar navItems={adminNavLinks} {...props} />;
}
