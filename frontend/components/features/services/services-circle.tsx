"use client"

import type React from "react"
import { useEffect, useState } from "react"

import GradePrediction from "@/components/landing-page/icons/grade-prediction"
import CareerGuidance from "@/components/landing-page/icons/career-guidance"
import AIChatbot from "@/components/landing-page/icons/ai-chatbot"
import NineBox from "@/components/landing-page/icons/nine-box"

interface OrbitingItemProps {
    children: React.ReactNode
    initialAngle: number
    radius: number
    duration?: number
    counterRotate?: boolean
    rotationOffset?: number
    className?: string
}

function OrbitingItem({
    children,
    initialAngle,
    radius,
    duration = 25,
    counterRotate = true,
    rotationOffset = 0,
    className = "",
}: OrbitingItemProps) {
    const [angle, setAngle] = useState(initialAngle)

    useEffect(() => {
        const startTime = Date.now()
        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000
            const newAngle = initialAngle + (elapsed / duration) * 360
            setAngle(newAngle % 360)
            requestAnimationFrame(animate)
        }
        const frameId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frameId)
    }, [initialAngle, duration])

    const radians = (angle * Math.PI) / 180
    const x = Math.cos(radians) * radius
    const y = Math.sin(radians) * radius

    const rotation = counterRotate ? 0 : angle + rotationOffset

    return (
        <div
            className={`absolute ${className}`}
            style={{
                left: "50%",
                top: "50%",
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) rotate(${rotation}deg)`,
            }}
        >
            {children}
        </div>
    )
}

export default function ServicesCircle() {
    const orbitRadius = 180
    // const arrowRadius = 140
    const duration = 25

    // Card positions: Top (270°), Right (0°), Bottom (90°), Left (180°)
    // Arrow positions: Between each pair at 45° offsets (315°, 45°, 135°, 225°)

    return (
        <div
            className="flex-1 relative w-full h-full flex items-center justify-center mt-8 lg:mt-0 px-6 lg:px-0"
            style={{ color: "var(--ray-color)" }}
        >
            <div className="relative w-full max-w-[360px] md:max-w-[400px] lg:max-w-[580px] aspect-square">
                {/* Static concentric circles background */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                    <defs>
                        <linearGradient id="fadeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="white" stopOpacity="0" />
                            <stop offset="30%" stopColor="white" stopOpacity="0.3" />
                            <stop offset="60%" stopColor="white" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="white" stopOpacity="1" />
                        </linearGradient>
                        <mask id="circleMask">
                            <rect width="400" height="400" fill="url(#fadeGradient)" />
                        </mask>
                    </defs>
                    <circle cx="200" cy="200" r="200" fill="none" stroke="currentColor" strokeWidth="1" mask="url(#circleMask)" />
                    <circle cx="200" cy="200" r="170" fill="none" stroke="currentColor" strokeWidth="1" mask="url(#circleMask)" />
                    <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="1" mask="url(#circleMask)" />
                </svg>

                {/* Orbiting Cards - positioned at 90 degree intervals */}
                {/* Human-Centric BPO - starts at top (270 degrees) */}
                <OrbitingItem initialAngle={270} radius={orbitRadius} duration={duration} counterRotate={true}>
                    <div className="bg-gradient-to-br from-[#001a1a] to-[#003333] border-3 border-[#004747] rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center transition-all duration-300 transform hover:scale-105 w-[120px] h-[130px] md:w-[140px] md:h-[150px] lg:w-[164.41px] lg:h-[171.17px]">
                        <div className="mb-2 md:mb-3 flex items-center justify-center w-20 h-10 mt-4 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-35 lg:h-20 lg:mt-10 mx-auto">
                            <GradePrediction />
                        </div>
                        <p className="bg-gradient-to-r from-[#00ffff] to-[#00cccc] bg-clip-text text-transparent px-4 py-4 font-semibold text-xs md:text-[12px] text-[8px] relative z-10">
                            Grade <br /> Prediction
                        </p>
                    </div>
                </OrbitingItem>

                {/* Data-Driven Insights - starts at right (0 degrees) */}
                <OrbitingItem initialAngle={0} radius={orbitRadius} duration={duration} counterRotate={true}>
                    <div className="bg-gradient-to-br from-[#001a1a] to-[#003333] border-3 border-[#004747] rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center transition-all duration-300 transform hover:scale-105 w-[120px] h-[130px] md:w-[140px] md:h-[150px] lg:w-[164.41px] lg:h-[171.17px]">
                        <div className="mb-2 md:mb-3 flex items-center justify-center w-20 h-10 mt-4 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-35 lg:h-20 lg:mt-10 mx-auto">
                            <CareerGuidance />
                        </div>
                        <p className="bg-gradient-to-r from-[#00ffff] to-[#00cccc] bg-clip-text text-transparent px-4 py-4 font-semibold text-xs md:text-[11px] text-[8px] relative z-10">
                            Career Guidance
                        </p>
                    </div>
                </OrbitingItem>

                {/* Digital Automation - starts at bottom (90 degrees) */}
                <OrbitingItem initialAngle={90} radius={orbitRadius} duration={duration} counterRotate={true}>
                    <div className="bg-gradient-to-br from-[#001a1a] to-[#003333] border-3 border-[#004747] rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 w-[120px] h-[130px] md:w-[140px] md:h-[150px] lg:w-[164.41px] lg:h-[171.17px]">
                        <div className="mb-2 md:mb-3 flex items-center justify-center w-20 h-10 mt-4 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-35 lg:h-20 lg:mt-10 mx-auto">
                            <AIChatbot />
                        </div>
                        <p className="bg-gradient-to-r from-[#00ffff] to-[#00cccc] bg-clip-text text-transparent px-4 py-4 font-semibold text-xs md:text-[11px] text-[8px] -mt-1 relative z-10">
                            AI Chatbot Mentor
                        </p>
                    </div>
                </OrbitingItem>

                {/* Strategic Consulting - starts at left (180 degrees) */}
                <OrbitingItem initialAngle={180} radius={orbitRadius} duration={duration} counterRotate={true}>
                    <div className="bg-gradient-to-br from-[#001a1a] to-[#003333] border-3 border-[#004747] rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center transition-all duration-300 hover:scale-105 w-[120px] h-[130px] md:w-[140px] md:h-[150px] lg:w-[164.41px] lg:h-[171.17px]">
                        <div className="mb-2 md:mb-3 flex items-center justify-center w-20 h-10 mt-4 sm:w-16 sm:h-16 md:w-24 md:h-24 lg:w-35 lg:h-20 lg:mt-10 mx-auto">
                            <NineBox />
                        </div>
                        <p className="bg-gradient-to-r from-[#00ffff] to-[#00cccc] bg-clip-text text-transparent px-4 py-4 font-semibold text-xs md:text-[11px] text-[8px] relative z-10">
                            9-Box Evaluation
                        </p>
                    </div>
                </OrbitingItem>
            </div>
        </div>
    )
}
