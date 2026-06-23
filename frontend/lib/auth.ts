import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { db } from "@/db/config";
import * as schema from "@/db/schema";
import { ac, superAdmin, support, user as userRole, guest } from "@/lib/permissions";
import { admin, organization } from "better-auth/plugins";

const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    // Path-based multi-tenancy: all tenants are on the same domain
    trustedOrigins: [
        // Development
        "http://localhost:3000",
        // Production
        "https://intellector.daffodilglobal.ai",
        // Dynamic: always trust the configured base URL
        ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ],
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        admin({
            ac,
            roles: {
                guest,
                user: userRole,
                support,
                super_admin: superAdmin,
                admin: superAdmin, // back-compat: legacy 'admin' == super_admin
            },
            defaultRole: "user",
            // Which platform roles are treated as administrators by the admin
            // plugin (gating impersonation, user management, etc.). Without this
            // a 'super_admin' user would not be recognised as an admin.
            adminRoles: ["admin", "super_admin"],
        }),
        organization({
            allowUserToCreateOrganization: true,
        }),
    ],
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
    },
    advanced: {
        defaultCookieAttributes: {
            // Standard 'lax' for same-domain path-based routing
            sameSite: isProduction ? "lax" : "lax",
        },
        useSecureCookies: isProduction,
    },
    hooks: {
        after: createAuthMiddleware(async (ctx) => {
            // Set organization slug cookie after sign-in
            if (ctx.path.startsWith("/sign-in") || ctx.path.startsWith("/sign-up")) {
                const newSession = ctx.context.newSession;
                if (newSession) {
                    // Try to get the user's active organization
                    // This will be set by the client after organization selection
                }
            }

            // Clear org + platform-role cookies on sign-out
            if (ctx.path.startsWith("/sign-out")) {
                for (const name of ["active-org-slug", "platform-role"]) {
                    ctx.setCookie(name, "", {
                        path: "/",
                        maxAge: 0,
                        sameSite: "lax",
                        secure: isProduction,
                    });
                }
            }
        }),
    },
});

export type Session = typeof auth.$Infer.Session;
