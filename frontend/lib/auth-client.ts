import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { ac, admin as adminRole, guest } from "@/lib/permissions";

export const authClient = createAuthClient({
    plugins: [
        adminClient({
            ac,
            roles: {
                guest,
                admin: adminRole,
            },
        }),
        organizationClient(),
    ],
});
