'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from "@/lib/utils";
import { PricingTierData } from './pricing-types';

interface PricingCardProps {
    tier: PricingTierData;
    className?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({ tier, className }) => {
    const router = useRouter();

    const handleGetStarted = () => {
        router.push(`/register?package=${tier.id}`);
    };
    const getGradientColors = (tierId: string) => {
        switch (tierId) {
            case 'silver':
                return 'from-gray-400 via-gray-300 to-gray-400';
            case 'gold':
                return 'from-yellow-400 via-amber-300 to-yellow-400';
            case 'platinum':
                return 'from-cyan-400 via-teal-300 to-cyan-400';
            default:
                return 'from-cyan-400 to-teal-400';
        }
    };

    const getBorderGlow = (tierId: string) => {
        switch (tierId) {
            case 'silver':
                return 'hover:shadow-[0_0_30px_rgba(156,163,175,0.2)]';
            case 'gold':
                return 'hover:shadow-[0_0_30px_rgba(251,191,36,0.2)]';
            case 'platinum':
                return 'hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]';
            default:
                return 'hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]';
        }
    };

    return (
        <div
            className={cn(
                "relative flex flex-col rounded-3xl border p-8 md:p-10",
                "bg-gradient-to-br from-cyan-950/20 via-gray-950/60 to-gray-950",
                "group transition-all duration-500",
                tier.popular
                    ? "border-cyan-400/50 shadow-[0_0_40px_rgba(6,182,212,0.2)] lg:scale-105 mt-6 lg:mt-0"
                    : "border-cyan-500/20",
                getBorderGlow(tier.id),
                className
            )}
        >
            {/* Popular Badge */}
            {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-50">
                    <div className="px-6 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 shadow-lg">
                        <span className="text-[var(--app-text)] font-bold text-sm uppercase tracking-wider whitespace-nowrap">
                            Most Popular
                        </span>
                    </div>
                </div>
            )}

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Tier Name Badge */}
                <div className="mb-6">
                    <div className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm",
                        tier.id === 'silver' && "bg-gray-950/50 border-gray-400/30",
                        tier.id === 'gold' && "bg-amber-950/50 border-yellow-400/30",
                        tier.id === 'platinum' && "bg-cyan-950/50 border-cyan-400/30"
                    )}>
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            tier.id === 'silver' && "bg-gray-400",
                            tier.id === 'gold' && "bg-yellow-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]",
                            tier.id === 'platinum' && "bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                        )} />
                        <span className={cn(
                            "text-sm font-bold uppercase tracking-wider",
                            tier.id === 'silver' && "text-gray-300",
                            tier.id === 'gold' && "text-yellow-300",
                            tier.id === 'platinum' && "text-cyan-300"
                        )}>
                            {tier.displayName}
                        </span>
                    </div>
                </div>

                {/* Tier Name */}
                <h3 className={cn(
                    "text-3xl md:text-4xl font-bold mb-2 tracking-tight bg-gradient-to-r bg-clip-text text-transparent",
                    getGradientColors(tier.id)
                )}>
                    {tier.name}
                </h3>

                {/* Price */}
                <div className="mb-6">
                    {tier.discountedPrice !== undefined ? (
                        <>
                            {/* Promotion Badge */}
                            <div className="mb-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-semibold">
                                    🎉 {tier.promotionName || 'Special Offer'}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl md:text-6xl font-bold text-[var(--app-text)]">
                                    ৳{tier.discountedPrice.toLocaleString()}
                                </span>
                                <span className="text-2xl text-gray-500 line-through">
                                    ৳{tier.basePrice.toLocaleString()}
                                </span>
                                <span className="text-gray-400 text-lg">/month</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl md:text-6xl font-bold text-[var(--app-text)]">
                                ৳{tier.basePrice.toLocaleString()}
                            </span>
                            <span className="text-gray-400 text-lg">/month</span>
                        </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2">{tier.usageLimit}</p>
                </div>

                {/* Services Included */}
                <div className="mb-6 pb-6 border-b border-cyan-500/10">
                    <p className="text-sm text-gray-400 mb-3 uppercase tracking-wide">Includes</p>
                    <div className="flex items-center gap-2">
                        <span className={cn(
                            "text-2xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                            getGradientColors(tier.id)
                        )}>
                            {tier.services.length}
                        </span>
                        <span className="text-gray-300">
                            {tier.services.length === 1 ? 'Service' : 'Services'}
                        </span>
                    </div>
                </div>

                {/* Features List */}
                <div className="flex-1 space-y-3 mb-8">
                    {tier.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center mt-0.5">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M2 6L5 9L10 3" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="text-gray-300 text-sm md:text-base leading-tight">
                                {feature}
                            </span>
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                <button
                    onClick={handleGetStarted}
                    className={cn(
                        "w-full px-6 py-4 rounded-full font-semibold text-base md:text-lg transition-all duration-300",
                        tier.popular
                            ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-[var(--app-text)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-105"
                            : "border-2 border-cyan-500/30 bg-transparent text-cyan-100 hover:bg-cyan-500/10 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                    )}>
                    Get Started
                </button>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
};

export default PricingCard;
