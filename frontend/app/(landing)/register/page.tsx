"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AuthBackground from "@/components/auth/auth-background";
import RegisterForm from "@/components/auth/register-form";
import Link from "next/link";

function RegisterContent() {
    const searchParams = useSearchParams();
    const selectedPackage = searchParams.get("package") || "gold";

    return (
        <AuthBackground maxWidth="max-w-lg">
            {/* Logo & Header */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-block mb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                        AI Mentor
                    </h1>
                </Link>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Register Your Organization
                </h2>
                <p className="text-muted-foreground text-sm">
                    Create your workspace and start empowering students with AI
                </p>
            </div>

            {/* Registration Form */}
            <RegisterForm initialPackage={selectedPackage} />

            {/* Login Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </AuthBackground>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
            <RegisterContent />
        </Suspense>
    );
}
