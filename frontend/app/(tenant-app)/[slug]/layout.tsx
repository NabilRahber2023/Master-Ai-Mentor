import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db/config";
import { member, organization, orgModule, moduleRegistry } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { TenantProvider, type TenantInfo } from "@/hooks/use-tenant";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TenantSidebar } from "@/components/dashboard/tenant-sidebar";
import { FloatingChatbot } from "@/components/chatbot/floating-chatbot";
import { ThemeSlider } from "@/components/theme-slider";
import { can, type Permission, type PlatformRole } from "@/lib/rbac";
import { ModuleAccessDenied } from "@/components/modules/access-denied";
import { ImpersonationBanner } from "@/components/auth/impersonation";

/**
 * Per-route → required (module entitlement, permission) map. This is the single
 * server-side authorization gate for every tenant module page: the page UI only
 * renders if the org is entitled to the module AND the user's role permits the
 * action. (Backend re-checks on every API call; this just stops the UI showing.)
 */
const MODULE_ROUTES: { seg: string; moduleId: string; perm: Permission }[] = [
    { seg: "/modules/grade-prediction", moduleId: "grade-prediction", perm: "predict:single" },
    { seg: "/modules/batch-prediction", moduleId: "batch-prediction", perm: "predict:batch" },
    { seg: "/modules/career-guidance", moduleId: "career-guidance", perm: "predict:single" },
    { seg: "/modules/ai-chatbot", moduleId: "ai-chatbot", perm: "chatbot:use" },
    { seg: "/modules/growth-potential", moduleId: "growth-potential", perm: "predict:single" },
    { seg: "/subject-prediction", moduleId: "subject-prediction", perm: "predict:single" },
];

/**
 * Tenant Layout - Wraps all tenant path-based routes (/:slug/*)
 *
 * This layout:
 * 1. Reads the org slug from the URL segment (params.slug)
 * 2. Verifies the user is authenticated
 * 3. Checks the user is a member of the organization
 * 4. Provides tenant context to all child pages
 * 5. Renders the tenant sidebar
 */
export default async function TenantLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const headersList = await headers();

    // Get the current session
    const session = await auth.api.getSession({
        headers: headersList,
    });

    // If not authenticated, redirect to login
    if (!session?.user) {
        redirect(`/login`);
    }

    // Find the organization by slug
    const [org] = await db
        .select()
        .from(organization)
        .where(eq(organization.slug, slug))
        .limit(1);

    if (!org) {
        // Organization not found — redirect to main site
        redirect("/");
    }

    // Check membership
    const [membership] = await db
        .select()
        .from(member)
        .where(
            and(
                eq(member.organizationId, org.id),
                eq(member.userId, session.user.id)
            )
        )
        .limit(1);

    if (!membership) {
        // User is not a member of this org — try to redirect to their own org
        const [userMembership] = await db
            .select({ orgId: member.organizationId })
            .from(member)
            .where(eq(member.userId, session.user.id))
            .limit(1);

        if (userMembership) {
            const [userOrg] = await db
                .select()
                .from(organization)
                .where(eq(organization.id, userMembership.orgId))
                .limit(1);

            if (userOrg?.slug) {
                redirect(`/${userOrg.slug}/home`);
            }
        }

        // No org found for user at all
        redirect("/");
    }

    // packageId still comes from metadata; module entitlements now come from org_module.
    let packageId = "gold";
    if (org.metadata) {
        try {
            packageId = JSON.parse(org.metadata).packageId || "gold";
        } catch {
            // Invalid metadata
        }
    }

    // Enabled modules = org_module rows that are enabled AND globally enabled.
    const moduleRows = await db
        .select({ id: orgModule.moduleId, enabled: orgModule.enabled, global: moduleRegistry.globalEnabled })
        .from(orgModule)
        .innerJoin(moduleRegistry, eq(orgModule.moduleId, moduleRegistry.id))
        .where(eq(orgModule.organizationId, org.id));
    const enabledModules = moduleRows.filter((m) => m.enabled && m.global).map((m) => m.id);

    const platformRole = (session.user as { role?: string }).role ?? "user";

    // Build tenant info for context
    const tenant: TenantInfo = {
        slug,
        organizationId: org.id,
        organizationName: org.name,
        packageId,
        enabledModules,
        userRole: membership.role,
        platformRole,
    };

    // === PER-ROUTE AUTHORIZATION GUARD ===
    // If the request targets a module page, enforce module entitlement + role
    // permission server-side before rendering the page UI.
    const pathname = headersList.get("x-pathname") ?? "";
    const route = MODULE_ROUTES.find((r) => pathname.includes(r.seg));
    let denied: { title: string; reason: string } | null = null;
    if (route) {
        const principal = { platformRole: platformRole as PlatformRole, orgRole: membership.role };
        if (!enabledModules.includes(route.moduleId)) {
            denied = {
                title: "Module disabled",
                reason: `The "${route.moduleId}" module is not enabled for ${org.name}. Ask a Super Admin to turn it on.`,
            };
        } else if (!can(principal, route.perm)) {
            denied = {
                title: "Insufficient permissions",
                reason: `Your role (${membership.role}) cannot ${route.perm.replace(":", " ")}. Contact an organization admin.`,
            };
        }
    }

    return (
        <TenantProvider tenant={tenant}>
            <ThemeSlider />
            <ImpersonationBanner />
            <SidebarProvider>
                <TenantSidebar />
                <SidebarInset>
                    <main className="flex-1">
                        {denied ? (
                            <ModuleAccessDenied title={denied.title} reason={denied.reason} homeHref={`/${slug}/home`} />
                        ) : (
                            children
                        )}
                    </main>
                    <FloatingChatbot />
                </SidebarInset>
            </SidebarProvider>
        </TenantProvider>
    );
}
