"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { NavMain } from "@/components/dashboard/nav-main";
import { NavUser } from "@/components/dashboard/nav-user";
import UserNavSkeleton from "@/components/dashboard/user-nav-skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import type { ReactNode } from "react";

export type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  badge?: string | number;
};

export type NavGroup = {
  label?: string;
  items: NavItem[];
};

export type SidebarHeaderConfig = {
  /** Logo/icon element */
  logo?: ReactNode;
  /** Title text */
  title: string;
  /** Subtitle text (e.g., plan name, role) */
  subtitle?: string;
  /** Link URL for the header */
  href?: string;
};

type BaseSidebarProps = React.ComponentProps<typeof Sidebar> & {
  /** Navigation items - can be flat array or grouped */
  navItems: NavItem[] | NavGroup[];
  /** Header configuration */
  header?: SidebarHeaderConfig;
  /** Custom header component (overrides header config) */
  customHeader?: ReactNode;
  /** Custom footer component (replaces user nav) */
  customFooter?: ReactNode;
  /** Show user nav in footer */
  showUserNav?: boolean;
};

function isNavGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

export function BaseSidebar({
  navItems,
  header,
  customHeader,
  customFooter,
  showUserNav = true,
  ...props
}: BaseSidebarProps) {
  const { data, isPending } = authClient.useSession();

  // Convert navItems to flat array if needed
  const flatNavItems: NavItem[] = navItems.length > 0 && isNavGroup(navItems[0])
    ? (navItems as NavGroup[]).flatMap(group => group.items)
    : (navItems as NavItem[]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Header */}
      <SidebarHeader>
        {customHeader ? (
          customHeader
        ) : header ? (
          <div className="px-2 py-2">
            <Link
              href={header.href || "/"}
              className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent transition-colors"
            >
              {header.logo && (
                <div className="flex-shrink-0">
                  {header.logo}
                </div>
              )}
              <div className="flex flex-col min-w-0 flex-1">
                <span
                  className="font-semibold text-sm truncate"
                  title={header.title}
                >
                  {header.title}
                </span>
                {header.subtitle && (
                  <span className="text-xs text-muted-foreground truncate">
                    {header.subtitle}
                  </span>
                )}
              </div>
            </Link>
          </div>
        ) : (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
              >
                <Link href="/">
                  <p className="text-2xl font-bold">Ai Mentor</p>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <NavMain items={flatNavItems} />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        {customFooter ? (
          customFooter
        ) : showUserNav ? (
          isPending || !data ? <UserNavSkeleton /> : <NavUser session={data} />
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}
