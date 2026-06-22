import Link from "next/link"
import AuthBackground from "@/components/auth/auth-background"
import GoogleSignInButton from "@/components/auth/google-sign-in-button"
import EmailLoginForm from "@/components/auth/email-login-form"
import { LogoThemeToggle } from "@/components/logo-theme-toggle"

export default function LoginPage() {
    return (
        <AuthBackground>
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
                    Welcome Back
                </h2>
                <p className="text-muted-foreground text-sm">
                    Sign in to your account
                </p>
            </div>

            {/* Email/Password Form */}
            <EmailLoginForm />

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
            <GoogleSignInButton />

            {/* Terms */}
            <p className="text-center text-xs text-muted-foreground mt-4">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    Privacy Policy
                </Link>
            </p>

            {/* Sign Up Link */}
            <div className="mt-4 text-center">
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