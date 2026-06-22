'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from "@/lib/utils";
import partnersLogoImg from "@/public/images/partners_logo.png";

interface PartnershipCardProps {
    title: string;
    benefits: string[];
    buttonText: string;
    className?: string;
}

const PartnershipCard: React.FC<PartnershipCardProps> = ({ title, benefits, buttonText, className }) => {
    return (
        <div
            className={cn(
                "relative flex flex-col overflow-hidden rounded-3xl border border-cyan-500/20 p-8 md:p-10",
                "bg-gradient-to-br from-cyan-950/20 via-gray-950/60 to-gray-950",
                "group hover:border-cyan-400/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
                className
            )}
        >
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-[var(--app-text)] mb-6 md:mb-8 tracking-tight text-center">
                    {title}
                </h3>

                {/* Benefits List */}
                <div className="flex-1 space-y-4 mb-8">
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

                {/* Button */}
                <button className="group/btn w-full px-6 py-3.5 rounded-full border-2 border-cyan-500/30 bg-transparent hover:bg-cyan-500/10 transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                    <span className="text-cyan-100 font-semibold text-base md:text-lg group-hover/btn:text-cyan-50 transition-colors">
                        {buttonText}
                    </span>
                </button>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
};

export default function Partner() {
    const partnerships = [
        {
            title: "Corporate Partnerships",
            benefits: [
                "Research collaboration",
                "Talent pipeline development",
                "Infrastructure sponsorship",
                "Technology transfer"
            ],
            buttonText: "Become a Partner"
        },
        {
            title: "Individual Donations",
            benefits: [
                "Scholarship funds",
                "Research grants",
                "Infrastructure development",
                "Endowment opportunities"
            ],
            buttonText: "Make a Donation"
        },
        {
            title: "Institutional Collaboration",
            benefits: [
                "Joint program development",
                "Faculty exchange",
                "Capacity building",
                "Policy research"
            ],
            buttonText: "Collaborate"
        }
    ];

    return (
        <section className="py-20 md:py-24 lg:py-32 px-4 md:px-8 bg-[#020402] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-[20%] left-[10%] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px]" />
            </div>

            <div className="max-w-7xl mx-auto w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-16 md:mb-20">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-950/30 border border-cyan-500/30 mb-8 backdrop-blur-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm font-medium text-cyan-100">Partnership Opportunities</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--app-text)] mb-6 tracking-tight">
                        Partnership{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Opportunities
                        </span>
                    </h2>
                    <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Join us in shaping the future of education through strategic collaboration.
                    </p>
                </div>

                {/* Partnership Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {partnerships.map((partnership, index) => (
                        <PartnershipCard
                            key={index}
                            {...partnership}
                        />
                    ))}
                </div>

                {/* Partner Logos Section */}
                <div className="mt-20 md:mt-24">
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center mb-12">
                        Our{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Partners
                        </span>
                    </h3>

                    <div className="relative rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/10 via-gray-950/40 to-gray-950 p-8 md:p-12 overflow-hidden">
                        {/* Subtle gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

                        {/* Logo container */}
                        <div className="relative z-10 flex justify-center items-center">
                            <Image
                                src={partnersLogoImg}
                                alt="Our Partners Logos"
                                width={1200}
                                height={200}
                                className="w-full max-w-6xl h-auto object-contain opacity-90 hover:opacity-100 transition-opacity duration-300"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
