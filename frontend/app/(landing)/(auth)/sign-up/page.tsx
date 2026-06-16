import Link from "next/link"
import AuthBackground from "@/components/auth/auth-background"
import GoogleSignInButton from "@/components/auth/google-sign-in-button"

export default function SignUpPage() {
    return (
        <AuthBackground>
            {/* Logo & Header */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-block mb-6">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                        AI Mentor
                    </h1>
                </Link>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                    Start Your Journey
                </h2>
                <p className="text-muted-foreground text-sm">
                    Create an account to unlock AI-powered learning
                </p>
            </div>

            {/* Google Sign Up Button */}
            <GoogleSignInButton />

            {/* Features Preview */}
            <div className="mt-8 space-y-3">
                <p className="text-xs text-muted-foreground text-center uppercase tracking-wider mb-4">
                    What you&apos;ll get
                </p>
                <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <span>AI-Powered Learning Insights</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <span>Career Path Predictions</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground/80">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                    </div>
                    <span>24/7 AI Mentorship</span>
                </div>
            </div>

            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                </div>
            </div>

            {/* Info Text */}
            <p className="text-center text-xs text-muted-foreground">
                By signing up, you agree to our{" "}
                <Link href="/terms" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                    Privacy Policy
                </Link>
            </p>

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
    )
}