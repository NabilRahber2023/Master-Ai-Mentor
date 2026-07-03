"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Loader2, Wand2, Eye, EyeOff } from "lucide-react";

interface EmailLoginFormProps {
    redirectTo?: string;
    /** Credentials the "Auto Fill Credentials" button populates (role portal). */
    prefillEmail?: string;
    prefillPassword?: string;
    /** Fired after a successful sign-in, before the redirect (e.g. close a modal). */
    onSuccess?: () => void;
}

// Default demo account seeded in the local database (super-admin owner).
const DEMO_CREDENTIALS = {
    email: "oxford@gmail.com",
    password: "Admin@12345",
};

export default function EmailLoginForm({
    redirectTo = "/dashboard",
    prefillEmail,
    prefillPassword,
    onSuccess,
}: EmailLoginFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // When a role is selected we autofill that role's credentials; otherwise the
    // dev-only button fills the default demo account.
    const fill = prefillEmail && prefillPassword ? { email: prefillEmail, password: prefillPassword } : DEMO_CREDENTIALS;
    const showAutoFill = Boolean(prefillEmail) || process.env.NODE_ENV !== "production";

    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            setError(null);

            try {
                // Production auth pipeline — identical for every role.
                const result = await authClient.signIn.email({
                    email: value.email,
                    password: value.password,
                });

                if (result.error) {
                    throw new Error(result.error.message || "Invalid email or password");
                }

                // Set the platform-role cookie for the middleware's coarse admin gate.
                const platformRole = (result.data?.user as { role?: string } | undefined)?.role;
                if (platformRole) {
                    document.cookie = `platform-role=${platformRole}; path=/; max-age=${60 * 60 * 24 * 7}`;
                }

                toast.success("Signed in successfully");
                onSuccess?.();

                // Fetch user's organizations
                const orgsResult = await authClient.organization.list();

                if (orgsResult.data && orgsResult.data.length > 0) {
                    // User has at least one organization - redirect to it
                    const org = orgsResult.data[0];

                    // Set the org as active
                    await authClient.organization.setActive({
                        organizationId: org.id,
                    });

                    // Set cookie for middleware to read (active org slug)
                    document.cookie = `active-org-slug=${org.slug}; path=/; max-age=${60 * 60 * 24 * 7}`;

                    // Redirect to tenant path-based dashboard
                    router.push(`/${org.slug}/home`);
                    router.refresh();
                } else {
                    // No organization - redirect to specified page or dashboard
                    router.push(redirectTo);
                    router.refresh();
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Login failed";
                setError(message);
                toast.error(message);
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
            className="space-y-4"
        >
            {/* Auto Fill Credentials — fills the fields; login still goes through real auth. */}
            {showAutoFill && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        form.setFieldValue("email", fill.email);
                        form.setFieldValue("password", fill.password);
                        setError(null);
                    }}
                    className="w-full border-cyan-500/40 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
                >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Auto Fill Credentials
                </Button>
            )}

            {/* Email */}
            <form.Field name="email">
                {(field) => (
                    <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="bg-background/50 border-white/20"
                            autoComplete="email"
                        />
                    </div>
                )}
            </form.Field>

            {/* Password */}
            <form.Field name="password">
                {(field) => (
                    <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm">Password</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="bg-background/50 border-white/20 pr-10"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                )}
            </form.Field>

            {/* Error */}
            {error && (
                <div className="p-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Submit */}
            <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-[var(--app-text)] font-semibold"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                    </>
                ) : (
                    "Login"
                )}
            </Button>
        </form>
    );
}
