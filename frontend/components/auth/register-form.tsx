"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

// Generate slug from organization name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 50);
}

interface RegisterFormProps {
    initialPackage?: string | null;
}

// Package display info
const packageInfo: Record<string, { name: string; price: number; color: string; modules: string[] }> = {
    silver: { name: "Silver", price: 299, color: "text-gray-300", modules: ["Grade Prediction"] },
    gold: { name: "Gold", price: 599, color: "text-yellow-400", modules: ["Grade Prediction", "Career Guidance"] },
    platinum: { name: "Platinum", price: 999, color: "text-cyan-400", modules: ["All Services"] },
};

export default function RegisterForm({ initialPackage }: RegisterFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
    const [slugChecking, setSlugChecking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedPkg = packageInfo[initialPackage || "gold"] || packageInfo.gold;

    const form = useForm({
        defaultValues: {
            organizationName: "",
            slug: "",
            adminName: "",
            adminEmail: "",
            adminPassword: "",
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            setError(null);

            try {
                const signUpResult = await authClient.signUp.email({
                    email: value.adminEmail,
                    password: value.adminPassword,
                    name: value.adminName,
                });

                if (signUpResult.error) {
                    throw new Error(signUpResult.error.message || "Failed to create account");
                }

                const orgResult = await authClient.organization.create({
                    name: value.organizationName,
                    slug: value.slug,
                    metadata: {
                        packageId: initialPackage || "gold",
                        enabledModules: getModulesForPackage(initialPackage || "gold"),
                    },
                });

                if (orgResult.error) {
                    throw new Error(orgResult.error.message || "Failed to create organization");
                }

                // Provision tenant database
                const provisionResponse = await fetch("/api/tenant/provision", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        organizationId: orgResult.data?.id,
                        slug: value.slug,
                    }),
                });

                if (!provisionResponse.ok) {
                    console.error("Failed to provision tenant database");
                    // Continue anyway - database can be provisioned later
                }

                await authClient.organization.setActive({
                    organizationId: orgResult.data?.id,
                });

                // Set cookie for middleware to read
                document.cookie = `active-org-slug=${value.slug}; path=/; max-age=${60 * 60 * 24 * 7}`;

                // Redirect to tenant path-based home
                router.push(`/${value.slug}/home`);
                router.refresh();
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    const checkSlugAvailability = useCallback(async (slug: string) => {
        if (slug.length < 3) {
            setSlugAvailable(null);
            return;
        }
        setSlugChecking(true);
        try {
            const response = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`);
            const data = await response.json();
            setSlugAvailable(data.available);
        } catch {
            setSlugAvailable(null);
        } finally {
            setSlugChecking(false);
        }
    }, []);

    useEffect(() => {
        const slug = form.state.values.slug;
        if (!slug) return;
        const timer = setTimeout(() => checkSlugAvailability(slug), 500);
        return () => clearTimeout(timer);
    }, [form.state.values.slug, checkSlugAvailability]);

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
            className="space-y-5"
        >
            {/* Selected Package - Compact */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20">
                <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full",
                        initialPackage === "silver" && "bg-gray-400",
                        initialPackage === "gold" && "bg-yellow-400",
                        initialPackage === "platinum" && "bg-cyan-400",
                        !initialPackage && "bg-yellow-400"
                    )} />
                    <span className={cn("font-semibold", selectedPkg.color)}>{selectedPkg.name} Plan</span>
                </div>
                <span className="text-white font-bold">৳{selectedPkg.price}<span className="text-xs text-muted-foreground">/mo</span></span>
            </div>

            {/* Organization Section */}
            <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Organization</div>

                {/* Organization Name */}
                <form.Field name="organizationName">
                    {(field) => (
                        <div className="space-y-1.5">
                            <Label htmlFor="organizationName" className="text-sm">University / Organization Name</Label>
                            <Input
                                id="organizationName"
                                placeholder="e.g., Daffodil International University"
                                value={field.state.value}
                                onChange={(e) => {
                                    field.handleChange(e.target.value);
                                    form.setFieldValue("slug", generateSlug(e.target.value));
                                }}
                                className="bg-background/50 border-white/20"
                            />
                        </div>
                    )}
                </form.Field>

                {/* URL Prefix */}
                <form.Field name="slug">
                    {(field) => (
                        <div className="space-y-1.5">
                            <Label htmlFor="slug" className="text-sm">Your URL Prefix</Label>
                            <div className="flex items-center">
                                <span className="px-3 py-2 bg-muted/50 border border-r-0 border-white/20 rounded-l-md text-sm text-muted-foreground whitespace-nowrap">
                                    intellector.daffodilglobal.ai/
                                </span>
                                <Input
                                    id="slug"
                                    placeholder="your-org"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                                    className="bg-background/50 border-white/20 rounded-l-none"
                                />
                            </div>
                            {field.state.value && (
                                <p className="text-xs">
                                    {slugChecking ? (
                                        <span className="text-muted-foreground">Checking...</span>
                                    ) : slugAvailable === true ? (
                                        <span className="text-green-400">✓ Available</span>
                                    ) : slugAvailable === false ? (
                                        <span className="text-red-400">✗ Taken</span>
                                    ) : null}
                                </p>
                            )}
                        </div>
                    )}
                </form.Field>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Admin Account Section */}
            <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Admin Account</div>

                {/* Two Column Layout for Name and Email */}
                <div className="grid grid-cols-2 gap-3">
                    <form.Field name="adminName">
                        {(field) => (
                            <div className="space-y-1.5">
                                <Label htmlFor="adminName" className="text-sm">Full Name</Label>
                                <Input
                                    id="adminName"
                                    placeholder="John Doe"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="bg-background/50 border-white/20"
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="adminEmail">
                        {(field) => (
                            <div className="space-y-1.5">
                                <Label htmlFor="adminEmail" className="text-sm">Email</Label>
                                <Input
                                    id="adminEmail"
                                    type="email"
                                    placeholder="admin@university.edu"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    className="bg-background/50 border-white/20"
                                />
                            </div>
                        )}
                    </form.Field>
                </div>

                {/* Password */}
                <form.Field name="adminPassword">
                    {(field) => (
                        <div className="space-y-1.5">
                            <Label htmlFor="adminPassword" className="text-sm">Password</Label>
                            <Input
                                id="adminPassword"
                                type="password"
                                placeholder="Minimum 8 characters"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="bg-background/50 border-white/20"
                            />
                        </div>
                    )}
                </form.Field>
            </div>

            {/* Error */}
            {error && (
                <div className="p-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Submit */}
            <Button
                type="submit"
                disabled={isSubmitting || slugAvailable === false}
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white font-semibold"
            >
                {isSubmitting ? "Creating..." : "Create Workspace"}
            </Button>

            {/* Terms - inline */}
            <p className="text-center text-[11px] text-muted-foreground">
                By registering, you agree to our{" "}
                <a href="/terms" className="text-cyan-400 hover:underline">Terms</a> and{" "}
                <a href="/privacy" className="text-cyan-400 hover:underline">Privacy Policy</a>
            </p>
        </form>
    );
}

function getModulesForPackage(packageId: string): string[] {
    switch (packageId) {
        case "silver": return ["grade-prediction"];
        case "gold": return ["grade-prediction", "career-guidance"];
        case "platinum": return ["grade-prediction", "career-guidance", "ai-chatbot", "growth-potential"];
        default: return ["grade-prediction", "career-guidance"];
    }
}
