import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin as adminRole, superAdmin, support, user as userRole, guest } from "@/lib/permissions";

export const authClient = createAuthClient({
    plugins: [
        adminClient({
            ac,
            roles: {
                guest,
                user: userRole,
                support,
                super_admin: superAdmin,
                admin: adminRole,
            },
        }),
        organizationClient(),
    ],
});
