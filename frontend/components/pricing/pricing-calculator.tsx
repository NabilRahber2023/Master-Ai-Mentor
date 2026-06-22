'use client';

import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";
import { PricingTierData, CalculatorState, PriceCalculation } from './pricing-types';
import { type DurationDiscount, type VolumeDiscount } from '@/db/schema';

// Default duration discounts (fallback if none configured)
const DEFAULT_DURATION_DISCOUNTS: Record<number, number> = {
    1: 0,
    3: 5,
    6: 10,
    12: 20,
};

interface PricingCalculatorProps {
    tiers?: PricingTierData[];
    durationDiscounts?: DurationDiscount[];
    volumeDiscounts?: VolumeDiscount[];
}

const PricingCalculator: React.FC<PricingCalculatorProps> = ({
    tiers = [],
    durationDiscounts = [],
    volumeDiscounts = [],
}) => {
    // Build tier prices from props
    const tierPrices = React.useMemo(() => {
        const prices: Record<string, number> = {};
        tiers.forEach(tier => {
            prices[tier.id] = tier.discountedPrice ?? tier.basePrice;
        });
        return prices;
    }, [tiers]);

    // Build duration discount map from props
    const durationDiscountMap = React.useMemo(() => {
        if (durationDiscounts.length === 0) {
            return DEFAULT_DURATION_DISCOUNTS;
        }
        const map: Record<number, number> = {};
        durationDiscounts.forEach(d => {
            map[d.months] = d.discountPercent;
        });
        return map;
    }, [durationDiscounts]);

    // Get available duration options
    const availableDurations = React.useMemo(() => {
        if (durationDiscounts.length > 0) {
            return durationDiscounts.map(d => d.months).sort((a, b) => a - b);
        }
        return [1, 3, 6, 12];
    }, [durationDiscounts]);

    // Get available tier IDs
    const availableTiers = React.useMemo(() => {
        return tiers.map(t => t.id);
    }, [tiers]);

    // Default to first tier or 'gold'
    const defaultTier = availableTiers.length > 0 ? availableTiers[0] : 'gold';

    const [state, setState] = useState<CalculatorState>({
        selectedTier: defaultTier as CalculatorState['selectedTier'],
        duration: availableDurations[0] || 1,
        userCount: 100,
    });

    const [calculation, setCalculation] = useState<PriceCalculation>({
        basePrice: 0,
        durationDiscount: 0,
        volumeDiscount: 0,
        discountedMonthlyPrice: 0,
        totalPrice: 0,
        savingsAmount: 0,
    });

    // Update selected tier when tiers change
    useEffect(() => {
        if (availableTiers.length > 0 && !availableTiers.includes(state.selectedTier)) {
            setState(prev => ({ ...prev, selectedTier: availableTiers[0] as CalculatorState['selectedTier'] }));
        }
    }, [availableTiers, state.selectedTier]);

    useEffect(() => {
        calculatePrice();
    }, [state, tierPrices, durationDiscountMap, volumeDiscounts]);

    const calculatePrice = () => {
        const basePrice = tierPrices[state.selectedTier] || 0;

        // Get duration discount from dynamic map
        const durationDiscountPercent = durationDiscountMap[state.duration] || 0;
        const durationDiscount = durationDiscountPercent / 100;

        // Find applicable volume discount
        let volumeDiscountPercent = 0;
        for (const v of volumeDiscounts) {
            if (state.userCount >= v.minUsers) {
                if (v.maxUsers === null || state.userCount <= v.maxUsers) {
                    volumeDiscountPercent = v.discountPercent;
                }
            }
        }
        const volumeDiscount = volumeDiscountPercent / 100;

        // Calculate discounted price
        const totalDiscount = Math.min(durationDiscount + volumeDiscount, 0.30);
        const discountedMonthlyPrice = basePrice * (1 - totalDiscount);
        const totalPrice = discountedMonthlyPrice * state.duration;
        const savingsAmount = (basePrice * state.duration) - totalPrice;

        setCalculation({
            basePrice,
            durationDiscount,
            volumeDiscount,
            discountedMonthlyPrice,
            totalPrice,
            savingsAmount,
        });
    };

    const updateTier = (tier: string) => {
        setState(prev => ({ ...prev, selectedTier: tier as CalculatorState['selectedTier'] }));
    };

    const updateDuration = (duration: number) => {
        setState(prev => ({ ...prev, duration }));
    };

    const updateUserCount = (count: number) => {
        setState(prev => ({ ...prev, userCount: count }));
    };

    const getTierBadgeStyle = (tierId: string) => {
        const isSelected = state.selectedTier === tierId;
        if (tierId === 'silver') {
            return isSelected
                ? "bg-gradient-to-r from-gray-400 to-gray-300 text-gray-900 shadow-[0_0_20px_rgba(156,163,175,0.4)]"
                : "bg-gray-950/50 border-gray-400/30 text-gray-300 hover:border-gray-400/50";
        }
        if (tierId === 'gold') {
            return isSelected
                ? "bg-gradient-to-r from-yellow-400 to-amber-300 text-amber-900 shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                : "bg-amber-950/50 border-yellow-400/30 text-yellow-300 hover:border-yellow-400/50";
        }
        if (tierId === 'platinum') {
            return isSelected
                ? "bg-gradient-to-r from-cyan-400 to-teal-400 text-cyan-900 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                : "bg-cyan-950/50 border-cyan-400/30 text-cyan-300 hover:border-cyan-400/50";
        }
        // Default/custom tier style
        return isSelected
            ? "bg-gradient-to-r from-purple-400 to-pink-400 text-purple-900 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            : "bg-purple-950/50 border-purple-400/30 text-purple-300 hover:border-purple-400/50";
    };

    const totalDiscountPercent = ((calculation.durationDiscount + calculation.volumeDiscount) * 100).toFixed(0);

    // Don't render if no tiers
    if (tiers.length === 0) {
        return null;
    }

    return (
        <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-gray-950/60 to-gray-950 p-8 md:p-12">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-cyan-950/30 border border-cyan-500/30 mb-6 backdrop-blur-sm">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-cyan-400">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm font-medium text-cyan-100">Price Calculator</span>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-[var(--app-text)] mb-3">
                        Customize Your{' '}
                        <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                            Plan
                        </span>
                    </h3>
                    <p className="text-gray-400 text-base md:text-lg">
                        Choose your package and see real-time pricing with volume discounts
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                    {/* Left Column: Controls */}
                    <div className="space-y-8">
                        {/* Package Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
                                Select Package
                            </label>
                            <div className={cn(
                                "grid gap-3",
                                tiers.length <= 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4"
                            )}>
                                {tiers.map((tier) => (
                                    <button
                                        key={tier.id}
                                        onClick={() => updateTier(tier.id)}
                                        className={cn(
                                            "px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300 border",
                                            getTierBadgeStyle(tier.id)
                                        )}
                                    >
                                        {tier.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">
                                Billing Period
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {availableDurations.map((months) => (
                                    <button
                                        key={months}
                                        onClick={() => updateDuration(months)}
                                        className={cn(
                                            "relative px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 border",
                                            state.duration === months
                                                ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-[var(--app-text)] border-transparent shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                                                : "bg-gray-950/50 border-cyan-500/30 text-gray-300 hover:border-cyan-500/50 hover:bg-cyan-950/30"
                                        )}
                                    >
                                        {months === 1 ? 'Monthly' : `${months} Months`}
                                        {months > 1 && (durationDiscountMap[months] || 0) > 0 && (
                                            <span className={cn(
                                                "absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold",
                                                state.duration === months
                                                    ? "bg-yellow-400 text-yellow-900"
                                                    : "bg-cyan-500/20 text-cyan-300"
                                            )}>
                                                -{durationDiscountMap[months]}%
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* User Count Slider */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                                    Number of Users
                                </label>
                                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                    {state.userCount}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="1000"
                                step="10"
                                value={state.userCount}
                                onChange={(e) => updateUserCount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                style={{
                                    background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((state.userCount - 10) / 990) * 100}%, #1f2937 ${((state.userCount - 10) / 990) * 100}%, #1f2937 100%)`
                                }}
                            />
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                                <span>10</span>
                                <span>1000+</span>
                            </div>
                            {calculation.volumeDiscount > 0 && (
                                <div className="mt-3 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                    <p className="text-sm text-cyan-300 flex items-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" />
                                        </svg>
                                        Volume discount applied: {(calculation.volumeDiscount * 100).toFixed(0)}% off
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Price Breakdown */}
                    <div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 via-gray-950/80 to-gray-950 p-6 md:p-8">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent pointer-events-none rounded-2xl" />

                        <div className="relative z-10 space-y-6">
                            <h4 className="text-xl font-bold text-[var(--app-text)] mb-6 pb-4 border-b border-cyan-500/20">
                                Price Breakdown
                            </h4>

                            {/* Base Price */}
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400">Base Price</span>
                                <span className="text-[var(--app-text)] font-semibold">৳{calculation.basePrice.toLocaleString()}/mo</span>
                            </div>

                            {/* Duration Discount */}
                            {calculation.durationDiscount > 0 && (
                                <div className="flex justify-between items-center text-cyan-300">
                                    <span className="flex items-center gap-2">
                                        Duration Discount
                                        <span className="text-xs bg-cyan-500/20 px-2 py-0.5 rounded-full">
                                            {state.duration} months
                                        </span>
                                    </span>
                                    <span className="font-semibold">-{(calculation.durationDiscount * 100).toFixed(0)}%</span>
                                </div>
                            )}

                            {/* Volume Discount */}
                            {calculation.volumeDiscount > 0 && (
                                <div className="flex justify-between items-center text-teal-300">
                                    <span className="flex items-center gap-2">
                                        Volume Discount
                                        <span className="text-xs bg-teal-500/20 px-2 py-0.5 rounded-full">
                                            {state.userCount} users
                                        </span>
                                    </span>
                                    <span className="font-semibold">-{(calculation.volumeDiscount * 100).toFixed(0)}%</span>
                                </div>
                            )}

                            {/* Divider */}
                            <div className="border-t border-cyan-500/20 pt-4">
                                {/* Discounted Monthly Price */}
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-gray-300">Monthly Price</span>
                                    <span className="text-xl font-bold text-[var(--app-text)]">
                                        ৳{calculation.discountedMonthlyPrice.toLocaleString()}
                                    </span>
                                </div>

                                {/* Total for Period */}
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-gray-400 text-sm">
                                        Total for {state.duration} {state.duration === 1 ? 'month' : 'months'}
                                    </span>
                                    <span className="text-lg font-semibold text-gray-300">
                                        ৳{calculation.totalPrice.toLocaleString()}
                                    </span>
                                </div>

                                {/* Total Savings */}
                                {calculation.savingsAmount > 0 && (
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                                        <div className="flex justify-between items-center">
                                            <span className="text-green-300 font-semibold flex items-center gap-2">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M21 21H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                                You Save
                                            </span>
                                            <span className="text-2xl font-bold text-green-400">
                                                ৳{calculation.savingsAmount.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-green-300/70 mt-1">
                                            {totalDiscountPercent}% total discount applied
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* CTA Button */}
                            <button className="w-full px-6 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-[var(--app-text)] font-bold text-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 hover:scale-105 mt-6">
                                Get Started Now
                            </button>

                            <p className="text-xs text-center text-gray-500 mt-3">
                                30-day money-back guarantee • No setup fees
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingCalculator;
