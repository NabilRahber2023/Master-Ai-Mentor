"use client"

import { useIsMobile } from "@/hooks/use-mobile"
import LightRays from "@/components/LightRays"

interface AuthBackgroundProps {
    children: React.ReactNode
    maxWidth?: string
}

export default function AuthBackground({ children, maxWidth = "max-w-md" }: AuthBackgroundProps) {
    const isMobile = useIsMobile()

    return (
        <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
            {/* Background Effect Layer */}
            <div className="absolute inset-0 z-0">
                <LightRays
                    raysOrigin={isMobile ? "top-left" : "top-center"}
                    raysColor="#00ffff"
                    raysSpeed={0.8}
                    lightSpread={0.6}
                    rayLength={isMobile ? 8 : 1}
                    followMouse={false}
                    mouseInfluence={0.05}
                    noiseAmount={0.08}
                    distortion={0.03}
                    className="custom-rays w-full h-full"
                />
            </div>

            {/* Content */}
            <div className={`relative z-10 w-full ${maxWidth} mx-4`}>
                <div className="backdrop-blur-xl bg-background/30 border border-white/10 rounded-2xl p-8 shadow-2xl shadow-cyan-500/5">
                    {children}
                </div>

                {/* Decorative Elements */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
            </div>
        </section>
    )
}
