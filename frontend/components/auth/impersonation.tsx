"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { UserCog, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { DEMO_ORG_SLUG } from "@/lib/role-catalog";

/**
 * Detect whether the current session is an impersonation session and expose a
 * `returnToSelf` action. Used by the banner and the sidebar logout button so
 * "log out" while impersonating returns to the original (Super Admin) account.
 */
export function useImpersonation() {
    const router = useRouter();
    const { data } = authClient.useSession();
    const [busy, setBusy] = useState(false);

    // better-auth stores impersonatedBy on the session sub-object.
    const impersonatedBy =
        (data?.session as { impersonatedBy?: string | null } | undefined)?.impersonatedBy ?? null;
    const isImpersonating = Boolean(impersonatedBy);

    const returnToSelf = async () => {
        setBusy(true);
        try {
            await authClient.admin.stopImpersonating();
            // Restore the original Super Admin's cookies.
            document.cookie = `platform-role=super_admin; path=/; max-age=${60 * 60 * 24 * 7}`;
            document.cookie = `active-org-slug=${DEMO_ORG_SLUG}; path=/; max-age=${60 * 60 * 24 * 7}`;
            toast.success("Returned to your account");
            router.push("/dashboard/admin/roles");
            router.refresh();
        } catch {
            toast.error("Could not return to your account");
        } finally {
            setBusy(false);
        }
    };

    return { isImpersonating, returnToSelf, busy, session: data };
}

/**
 * App-wide banner shown whenever the user is impersonating a demo role. Gives a
 * one-click way back to the original account from anywhere in the app.
 */
export function ImpersonationBanner() {
    const { isImpersonating, returnToSelf, busy, session } = useImpersonation();
    if (!isImpersonating) return null;

    const name = session?.user?.name ?? session?.user?.email ?? "demo role";
    const role = (session?.user as { role?: string } | undefined)?.role;

    return (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-3 border-b border-amber-400/30 bg-amber-500/15 px-4 py-2 text-sm text-amber-200 backdrop-blur">
            <UserCog className="h-4 w-4 shrink-0" />
            <span className="truncate">
                Viewing as <strong>{name}</strong>
                {role ? <span className="opacity-80"> · platform role: {role}</span> : null}
            </span>
            <button
                onClick={returnToSelf}
                disabled={busy}
                className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-100 ring-1 ring-amber-300/40 transition hover:bg-amber-400/30 disabled:opacity-50"
            >
                <LogOut className="h-3.5 w-3.5" />
                {busy ? "Returning…" : "Return to my account"}
            </button>
        </div>
    );
}
