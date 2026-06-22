"use client"
import LightRays from "@/components/LightRays";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import ServicesCircle from "@/components/features/services/services-circle";

export default function Hero() {
    const isMobile = useIsMobile()
    return (
        <section className="relative min-h-screen w-full overflow-hidden">
            {/* Background Effect Layer */}
            <div className="absolute inset-0 z-0">
                <LightRays
                    raysOrigin={isMobile ? "top-left" : "left"}
                    raysColor="#00ffff"
                    raysSpeed={1}
                    lightSpread={0.8}
                    rayLength={isMobile ? 10 : 1.2}
                    followMouse={false}
                    mouseInfluence={0.1}
                    noiseAmount={0.1}
                    distortion={0.05}
                    className="custom-rays w-full h-full"
                />
            </div>

            {/* Content Layer - In Normal Flow */}
            <div className="relative z-10 w-full min-h-screen flex items-center justify-center px-6 md:px-8 lg:px-12">
                <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-12 lg:gap-16 py-20">
                    {/* Text Content - Takes 40% on desktop */}
                    <div className="w-full md:w-[45%] lg:w-[40%] space-y-6 md:space-y-7">
                        <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[var(--app-text)] drop-shadow-lg leading-tight">
                            Your Personal <span className="bg-gradient-to-r from-[#00ffff] to-[#00cccc] bg-clip-text text-transparent">AI Mentor</span> for Academic Success
                        </h1>
                        <p className="text-lg sm:text-xl md:text-lg lg:text-xl text-gray-300 leading-relaxed">
                            Unlock your true potential with AI-driven insights that predict your success, guide your career path, and mentor you 24/7. Because every student deserves a personalized roadmap to excellence.
                        </p>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <RainbowButton size="lg">GET STARTED</RainbowButton>
                            <Button variant="outline" size="hero">
                                Book a call
                            </Button>
                        </div>
                    </div>
                    <ServicesCircle />
                </div>
            </div>

        </section>
    )
}
