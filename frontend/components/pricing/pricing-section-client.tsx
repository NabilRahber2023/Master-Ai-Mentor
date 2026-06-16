'use client';

import React from 'react';
import PricingCard from './pricing-card';
import PricingCalculator from './pricing-calculator';
import { PricingTierData, ServiceType } from './pricing-types';
import { type Package, type Promotion, type DurationDiscount, type VolumeDiscount } from '@/db/schema';

// Default fallback tiers when no packages exist in database
const DEFAULT_PRICING_TIERS: PricingTierData[] = [
    {
        id: 'silver',
        name: 'Silver',
        displayName: 'Silver Plan',
        basePrice: 299,
        usageLimit: 'Up to 100 users per month',
        services: ['grade-prediction' as ServiceType],
        features: [
            'Grade Prediction & Analytics',
            'Historical data analysis',
            'Performance forecasting',
            'Study pattern recognition',
            'Email support',
            'Monthly performance reports',
        ],
        badge: 'Starter',
    },
    {
        id: 'gold',
        name: 'Gold',
        displayName: 'Gold Plan',
        basePrice: 599,
        usageLimit: 'Up to 250 users per month',
        services: ['grade-prediction' as ServiceType, 'career-guidance' as ServiceType],
        features: [
            'All Silver features',
            'Career Guidance & Roadmap',
            'Strength & interest analysis',
            'Subject recommendations',
            'Career path planning',
            'Priority email support',
            'Weekly analytics reports',
        ],
        popular: true,
        badge: 'Most Popular',
    },
    {
        id: 'platinum',
        name: 'Platinum',
        displayName: 'Platinum Plan',
        basePrice: 999,
        usageLimit: 'Unlimited users',
        services: [
            'grade-prediction' as ServiceType,
            'career-guidance' as ServiceType,
            'ai-chatbot' as ServiceType,
            'growth-potential' as ServiceType,
        ],
        features: [
            'All Gold features',
            'AI Chatbot Mentor (24/7)',
            'Instant question answering',
            'Complex concept explanations',
            'Growth Potential Analysis (9-Box)',
            'Performance matrix insights',
            '24/7 Priority support',
            'Dedicated account manager',
            'Custom integrations',
        ],
        badge: 'Enterprise',
    },
];

interface PricingSectionClientProps {
    packages?: Package[];
    promotions?: Promotion[];
    durationDiscounts?: DurationDiscount[];
    volumeDiscounts?: VolumeDiscount[];
}

// Find best applicable promotion for a package
function findBestPromotion(packageId: string, promotions: Promotion[]): Promotion | null {
    const now = new Date();
    const applicable = promotions.filter(p => {
        // Check if active and within date range
        if (!p.isActive) return false;
        if (new Date(p.startDate) > now) return false;
        if (new Date(p.endDate) < now) return false;
        // Check if max uses reached
        if (p.maxUses && p.usedCount >= p.maxUses) return false;
        // Check if applies to this package (null = all packages)
        return !(p.packageId && p.packageId !== packageId);

    });

    if (applicable.length === 0) return null;

    // Return the one with highest discount (simplified: just return first)
    return applicable[0];
}

// Calculate discounted price
function calculateDiscountedPrice(basePrice: number, promotion: Promotion): number {
    if (promotion.discountType === 'percentage') {
        return Math.round(basePrice * (100 - promotion.discountValue) / 100);
    }
    return Math.max(0, basePrice - promotion.discountValue);
}

// Convert database package to pricing tier format with promotion
function packageToTier(pkg: Package, promotions: Promotion[]): PricingTierData {
    const promotion = findBestPromotion(pkg.id, promotions);
    const discountedPrice = promotion ? calculateDiscountedPrice(pkg.basePrice, promotion) : undefined;

    return {
        id: pkg.tier,
        name: pkg.name,
        displayName: pkg.displayName,
        basePrice: pkg.basePrice,
        discountedPrice,
        promotionName: promotion?.name,
        usageLimit: pkg.usageLimit || '',
        services: pkg.modules as ServiceType[],
        features: pkg.features as string[],
        popular: pkg.isPopular,
        badge: pkg.badge || undefined,
    };
}

export default function PricingSectionClient({
    packages,
    promotions = [],
    durationDiscounts = [],
    volumeDiscounts = [],
}: PricingSectionClientProps) {
    // Use database packages if available, otherwise fallback to defaults
    const pricingTiers = packages && packages.length > 0
        ? packages.map(pkg => packageToTier(pkg, promotions))
        : DEFAULT_PRICING_TIERS;

    return (
        <section className="py-20 md:py-24 lg:py-32 px-4 md:px-8 bg-[#020402] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px]" />
                <div className="absolute top-[40%] right-[10%] w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[150px]" />
                <div className="absolute bottom-[15%] left-[20%] w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto w-full relative z-10">
                {/* Header */}
                <div className="text-center mb-16 md:mb-20">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-950/30 border border-cyan-500/30 mb-8 backdrop-blur-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm font-medium text-cyan-100">Flexible Pricing</span>
                    </div>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
                        Choose Your{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Perfect Plan
                        </span>
                    </h2>
                    <p className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                        Scale your AI-powered student services with transparent pricing.
                        No hidden fees, cancel anytime.
                    </p>
                </div>

                {/* Pricing Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-24 pt-8 items-start">
                    {pricingTiers.map((tier) => (
                        <PricingCard key={tier.id} tier={tier} />
                    ))}
                </div>

                {/* Feature Comparison Table */}
                <div className="mb-20 md:mb-24">
                    <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">
                        Compare{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Features
                        </span>
                    </h3>

                    <div className="relative overflow-x-auto rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/10 via-gray-950/40 to-gray-950">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

                        <table className="w-full relative z-10">
                            <thead>
                                <tr className="border-b border-cyan-500/20">
                                    <th className="text-left p-6 text-gray-300 font-semibold">Features</th>
                                    <th className="text-center p-6 text-gray-300 font-semibold">Silver</th>
                                    <th className="text-center p-6 text-yellow-300 font-semibold">Gold</th>
                                    <th className="text-center p-6 text-cyan-300 font-semibold">Platinum</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { feature: 'Grade Prediction & Analytics', silver: true, gold: true, platinum: true },
                                    { feature: 'Career Guidance & Roadmap', silver: false, gold: true, platinum: true },
                                    { feature: 'AI Chatbot Mentor', silver: false, gold: false, platinum: true },
                                    { feature: 'Growth Potential Analysis (9-Box)', silver: false, gold: false, platinum: true },
                                    { feature: 'User Limit', silver: '100', gold: '250', platinum: 'Unlimited' },
                                    { feature: 'Support', silver: 'Email', gold: 'Priority Email', platinum: '24/7 Priority' },
                                    { feature: 'Custom Integrations', silver: false, gold: false, platinum: true },
                                    { feature: 'Dedicated Account Manager', silver: false, gold: false, platinum: true },
                                ].map((row, index) => (
                                    <tr key={index} className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors">
                                        <td className="p-6 text-gray-300">{row.feature}</td>
                                        <td className="p-6 text-center">
                                            {typeof row.silver === 'boolean' ? (
                                                row.silver ? (
                                                    <svg className="w-5 h-5 text-cyan-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-gray-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                )
                                            ) : (
                                                <span className="text-gray-300 text-sm">{row.silver}</span>
                                            )}
                                        </td>
                                        <td className="p-6 text-center">
                                            {typeof row.gold === 'boolean' ? (
                                                row.gold ? (
                                                    <svg className="w-5 h-5 text-cyan-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-gray-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                )
                                            ) : (
                                                <span className="text-gray-300 text-sm">{row.gold}</span>
                                            )}
                                        </td>
                                        <td className="p-6 text-center">
                                            {typeof row.platinum === 'boolean' ? (
                                                row.platinum ? (
                                                    <svg className="w-5 h-5 text-cyan-400 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-5 h-5 text-gray-600 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                )
                                            ) : (
                                                <span className="text-gray-300 text-sm">{row.platinum}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pricing Calculator */}
                <div className="mb-20">
                    <PricingCalculator
                        tiers={pricingTiers}
                        durationDiscounts={durationDiscounts}
                        volumeDiscounts={volumeDiscounts}
                    />
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {[
                        {
                            icon: (
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ),
                            title: '30-Day Money-Back',
                            description: 'Not satisfied? Get a full refund within 30 days, no questions asked.',
                        },
                        {
                            icon: (
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ),
                            title: 'No Setup Fees',
                            description: 'Start immediately with zero upfront costs or hidden charges.',
                        },
                        {
                            icon: (
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            ),
                            title: 'Cancel Anytime',
                            description: 'No long-term contracts. Cancel your subscription at any time.',
                        },
                    ].map((item, index) => (
                        <div
                            key={index}
                            className="relative flex flex-col items-center text-center p-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/10 via-gray-950/40 to-gray-950 hover:border-cyan-400/40 transition-all duration-300 group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />

                            <div className="relative z-10 mb-4 p-3 rounded-full bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
                                {item.icon}
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
