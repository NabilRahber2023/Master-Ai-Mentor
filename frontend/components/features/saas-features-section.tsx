'use client';

import React from 'react';
import { cn } from "@/lib/utils";
import ScalabilityIcon from "@/components/landing-page/icons/scalability-icon";
import AccessibilityIcon from "@/components/landing-page/icons/accessibility-icon";
import InnovationIcon from "@/components/landing-page/icons/innovation-icon";
import SecurityIcon from "@/components/landing-page/icons/security-icon";

const FeatureCard = React.forwardRef<HTMLDivElement, {
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    benefits: string[];
    className?: string;
}>(({ title, subtitle, description, icon, benefits, className }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl border border-cyan-500/20 p-8",
                "bg-gradient-to-br from-cyan-950/20 via-gray-950/60 to-gray-950",
                "group hover:border-cyan-400/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
                className
            )}
        >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Icon */}
                <div className="w-24 h-24 md:w-28 md:h-28 lg:w-32 lg:h-32 mb-6 text-cyan-400 transition-transform duration-500 group-hover:scale-110">
                    {icon}
                </div>

                {/* Title */}
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight group-hover:text-cyan-100 transition-colors">
                    {title}
                </h3>

                {/* Subtitle */}
                <p className="text-cyan-400 text-sm md:text-base font-semibold mb-4 tracking-wide uppercase">
                    {subtitle}
                </p>

                {/* Description */}
                <p className="text-gray-400 text-base md:text-lg leading-relaxed mb-6 group-hover:text-gray-300 transition-colors">
                    {description}
                </p>

                {/* Benefits List */}
                <div className="mt-auto space-y-3">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center mt-0.5">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 6L5 9L10 3" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="text-gray-300 text-sm md:text-base leading-tight">{benefit}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
});

FeatureCard.displayName = 'FeatureCard';

export default function SaaSFeaturesSection() {
    const features = [
        {
            title: "Infinite Scale",
            subtitle: "Grow Without Limits",
            description: "Built on cloud infrastructure that expands with your institution. Whether you're serving 100 students or 100,000, A-Mentor scales effortlessly to meet demand—no infrastructure headaches, no performance degradation.",
            icon: <ScalabilityIcon />,
            benefits: [
                "Elastic infrastructure that grows with your needs",
                "Support unlimited students and institutions",
                "Zero downtime during peak enrollment periods"
            ]
        },
        {
            title: "Always Available",
            subtitle: "24/7 Global Access",
            description: "Access powerful AI mentorship from anywhere, at any time. Whether it's 2 AM before an exam or during office hours, A-Mentor is always ready to provide guidance, predictions, and support across all devices.",
            icon: <AccessibilityIcon />,
            benefits: [
                "Round-the-clock AI assistance and analytics",
                "Multi-device support (desktop, tablet, mobile)",
                "Guaranteed 99.9% uptime for uninterrupted service"
            ]
        },
        {
            title: "Continuous Evolution",
            subtitle: "Always Up-to-Date",
            description: "Get automatic access to the latest AI models, features, and improvements without lifting a finger. We constantly enhance prediction accuracy, add new capabilities, and integrate cutting-edge research—all delivered seamlessly.",
            icon: <InnovationIcon />,
            benefits: [
                "Automatic model updates and accuracy improvements",
                "New features released regularly at no extra cost",
                "Latest AI research integrated into your platform"
            ]
        },
        {
            title: "Enterprise Security",
            subtitle: "Bank-Level Protection",
            description: "Your student data is protected by military-grade encryption and compliance with international standards (GDPR, FERPA). Multi-tenant architecture ensures complete data isolation between institutions with full audit trails.",
            icon: <SecurityIcon />,
            benefits: [
                "End-to-end encryption for all student data",
                "GDPR & FERPA compliance built-in",
                "Complete data isolation with audit logs"
            ]
        }
    ];

    return (
        <section className="py-20 md:py-24 lg:py-32 px-4 md:px-8 bg-[#020402] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-[15%] left-[10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[15%] right-[10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-7xl mx-auto w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-16 md:mb-20">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-950/30 border border-cyan-500/30 mb-8 backdrop-blur-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" fill="currentColor" />
                        </svg>
                        <span className="text-sm font-medium text-cyan-100">Platform Advantages</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                        Built for{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Modern Education
                        </span>
                    </h2>
                    <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Experience the power of cloud-native AI mentorship. Our platform delivers enterprise-grade capabilities
                        designed to transform how institutions support student success.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <FeatureCard
                            key={index}
                            {...feature}
                        />
                    ))}
                </div>

                {/* Bottom CTA Section */}
                <div className="mt-16 md:mt-20 text-center">
                    <div className="inline-block p-8 md:p-10 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-gray-950/50 to-gray-950 border border-cyan-500/20">
                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                            Ready to Transform Your Institution?
                        </h3>
                        <p className="text-gray-400 text-base md:text-lg mb-6 max-w-2xl mx-auto">
                            Join forward-thinking universities leveraging AI to unlock student potential
                        </p>
                        <button className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50">
                            <span className="text-white font-semibold text-base md:text-lg">Get Started Today</span>
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white group-hover:translate-x-1 transition-transform">
                                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
