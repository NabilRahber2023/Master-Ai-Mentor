export type PricingTier = 'silver' | 'gold' | 'platinum' | 'custom';

export type ServiceType =
    | 'grade-prediction'
    | 'career-guidance'
    | 'ai-chatbot'
    | 'growth-potential';

export interface Service {
    id: ServiceType;
    name: string;
    description: string;
}

export interface PricingTierData {
    id: PricingTier;
    name: string;
    displayName: string;
    basePrice: number;
    discountedPrice?: number; // Price after promotion
    promotionName?: string; // Active promotion name
    usageLimit: string;
    services: ServiceType[];
    features: string[];
    popular?: boolean;
    badge?: string;
}

export interface CalculatorState {
    selectedTier: PricingTier;
    duration: number; // months (dynamic from admin)
    userCount: number;
}

export interface PriceCalculation {
    basePrice: number;
    durationDiscount: number;
    volumeDiscount: number;
    discountedMonthlyPrice: number;
    totalPrice: number;
    savingsAmount: number;
}
