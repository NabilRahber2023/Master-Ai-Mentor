"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Loader2, Wand2 } from "lucide-react";

interface EmailLoginFormProps {
    redirectTo?: string;
}

// Demo account seeded in the local database (see "We have done.md")
const DEMO_CREDENTIALS = {
    email: "oxford@gmail.com",
    password: "@oxford123#",
};

export default function EmailLoginForm({ redirectTo = "/dashboard" }: EmailLoginFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            setError(null);

            try {
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
                setError(err instanceof Error ? err.message : "Login failed");
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
            {/* Quick fill demo credentials — development only */}
            {process.env.NODE_ENV !== "production" && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        form.setFieldValue("email", DEMO_CREDENTIALS.email);
                        form.setFieldValue("password", DEMO_CREDENTIALS.password);
                        setError(null);
                    }}
                    className="w-full border-cyan-500/40 bg-cyan-500/5 text-cyan-300 hover:bg-cyan-500/10 hover:text-cyan-200"
                >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Fill demo credentials
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
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={field.state.value}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="bg-background/50 border-white/20"
                            autoComplete="current-password"
                        />
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
                    "Sign In"
                )}
            </Button>
        </form>
    );
}
