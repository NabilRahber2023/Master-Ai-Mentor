'use client';

import { cn } from "@/lib/utils";
import GradePrediction from '@/components/landing-page/icons/grade-prediction';
import CareerGuidance from '@/components/landing-page/icons/career-guidance';
import AIChatbot from '@/components/landing-page/icons/ai-chatbot';
import NineBox from '@/components/landing-page/icons/nine-box';
import BrainConnectionsCyan from '@/components/landing-page/icons/brain-connections-cyan';
import React from "react";

// Service Card Component with Enhanced Gradients (Cyan/Teal Theme)
const ServiceCard = React.forwardRef<HTMLDivElement, {
    title: string;
    description: string;
    icon: React.ReactNode;
    className?: string;
    gradientDirection?: string;
    tags?: string[];
}>(({ title, description, icon, className, gradientDirection = "bg-gradient-to-br", tags }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "relative flex flex-col w-full max-w-lg h-[340px] md:h-[360px] lg:h-[380px] overflow-hidden rounded-[2rem] border border-cyan-500/30 p-6",
                "bg-gradient-to-br from-cyan-950/30 via-gray-950/80 to-gray-950",
                "group hover:border-cyan-400/60 transition-all duration-500",
                className
            )}
            style={{ "--ray-color": "#00ffff" } as React.CSSProperties}
        >
            {/* Inner Gradient Overlay - Dynamic based on position */}
            <div className={cn(
                "absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none",
                gradientDirection,
                "from-cyan-500/40 via-cyan-500/10 to-transparent"
            )} />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-100 mb-4 tracking-tight group-hover:text-cyan-100 transition-colors">
                    {title}
                </h3>
                <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-[90%] group-hover:text-gray-300 transition-colors mb-4">
                    {description}
                </p>

                {/* Icon Container - Positioned at bottom center */}
                <div className="mt-auto flex items-end justify-center w-full h-48 md:h-56 lg:h-60 relative text-cyan-400">
                    <div className="absolute bottom-[-20px] w-full flex justify-center scale-125 md:scale-140 lg:scale-150 transition-transform duration-500 group-hover:scale-[1.6] drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                        {icon}
                    </div>
                </div>
            </div>

            {/* Fading Sub-text at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent pointer-events-none z-20" />
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-3 z-30">
                <div className="text-xs text-gray-500 space-y-1">
                    {tags && tags.map((tag, index) => (
                        <div key={index} className="flex items-start gap-1.5">
                            <span className="text-cyan-500/60 mt-0.5">•</span>
                            <span className="leading-tight">{tag}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});

ServiceCard.displayName = 'ServiceCard';

export default function ServicesSection() {
    return (
        <section className="py-24 px-4 md:px-8 bg-[#020402] relative overflow-hidden min-h-screen flex items-center justify-center">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-24">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-950/30 border border-cyan-500/30 mb-8 backdrop-blur-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm font-medium text-cyan-100">Elevate with AI</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            A-Mentor
                        </span> Features Hub
                    </h2>
                    <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
                        Unleashing cutting-edge intelligence to redefine your academic journey.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-x-60 md:gap-y-36 max-w-7xl mx-auto">

                    {/* Brain Connections Background (Desktop Only) */}
                    <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-0">
                        {/* Scale the SVG to fit the gap and connect cards */}
                        <div className="w-[140%] h-full max-h-[600px] flex items-center justify-center opacity-80">
                            <BrainConnectionsCyan />
                        </div>
                    </div>

                    {/* Card 1: Top Left - Grade Prediction */}
                    <div className="flex justify-center md:justify-end relative z-10">
                        <ServiceCard
                            title="Grade Prediction"
                            description="Leverage advanced machine learning with XGBoost and LightGBM to analyze your academic trajectory. Get precise predictions of future grades based on historical performance, study habits, and exam patterns."
                            icon={<GradePrediction />}
                            gradientDirection="bg-gradient-to-tl"
                            tags={[
                                "Historical data analysis",
                                "Study pattern recognition",
                                "Performance forecasting"
                            ]}
                        />
                    </div>

                    {/* Card 2: Top Right - Career Guidance */}
                    <div className="flex justify-center md:justify-start relative z-10">
                        <ServiceCard
                            title="Career Guidance"
                            description="Discover your optimal career path through intelligent analysis of your strengths, interests, and academic performance. Receive data-driven subject recommendations and a personalized roadmap to achieve your professional goals."
                            icon={<CareerGuidance />}
                            gradientDirection="bg-gradient-to-tr"
                            tags={[
                                "Strength & interest analysis",
                                "Subject recommendations",
                                "Career roadmap generation"
                            ]}
                        />
                    </div>

                    {/* Card 3: Bottom Left - AI Chatbot */}
                    <div className="flex justify-center md:justify-end relative z-10">
                        <ServiceCard
                            title="AI Chatbot Mentor"
                            description="Your round-the-clock academic companion powered by state-of-the-art LLaMA language models. Get instant answers, detailed explanations of complex concepts, and personalized study strategies tailored to your learning style."
                            icon={<AIChatbot />}
                            gradientDirection="bg-gradient-to-bl"
                            tags={[
                                "Instant question answering",
                                "Complex concept explanations",
                                "Personalized study guidance"
                            ]}
                        />
                    </div>

                    {/* Card 4: Bottom Right - 9-Box */}
                    <div className="flex justify-center md:justify-start relative z-10">
                        <ServiceCard
                            title="Growth Potential Analysis"
                            description="Gain deep insights into your academic standing with a comprehensive 9-box performance matrix. Identify your strengths, areas for improvement, and receive actionable recommendations to maximize your potential and accelerate growth."
                            icon={<NineBox />}
                            gradientDirection="bg-gradient-to-br"
                            tags={[
                                "Performance matrix analysis",
                                "High-potential identification",
                                "Actionable growth insights"
                            ]}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
