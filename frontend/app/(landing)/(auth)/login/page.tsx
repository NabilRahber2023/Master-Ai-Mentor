import Link from "next/link"
import AuthBackground from "@/components/auth/auth-background"
import RoleAccessPortal from "@/components/auth/role-access-portal"
import GoogleSignInButton from "@/components/auth/google-sign-in-button"
import { LogoThemeToggle } from "@/components/logo-theme-toggle"

export default function LoginPage() {
    return (
        <AuthBackground maxWidth="max-w-5xl">
            {/* Theme toggle (logo) */}
            <div className="fixed top-4 right-4 z-50">
                <LogoThemeToggle />
            </div>
            {/* Logo & Header */}
            <div className="text-center mb-6">
                <Link href="/" className="inline-block mb-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                        Intellector
                    </h1>
                </Link>
                <h2 className="text-xl font-semibold text-foreground mb-1">
                    Role Access Portal
                </h2>
                <p className="text-muted-foreground text-sm">
                    Choose a role to sign in — each card opens the standard login.
                </p>
            </div>

            {/* Role cards → login modal (real authentication) */}
            <RoleAccessPortal />

            {/* Divider */}
            <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            {/* Google Sign In Button */}
            <div className="mx-auto max-w-md">
                <GoogleSignInButton />
            </div>

            {/* Sign Up Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/sign-up"
                        className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                    >
                        Sign up
                    </Link>
                </p>
            </div>
        </AuthBackground>
    )
}