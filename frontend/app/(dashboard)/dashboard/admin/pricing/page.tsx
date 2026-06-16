import { getPromotions } from "@/actionts/promotions/promotion-actions";
import { getLoyaltyRules } from "@/actionts/loyalty/loyalty-actions";
import { getPackages } from "@/actionts/packages/package-actions";
import { getDurationDiscounts, getVolumeDiscounts } from "@/actionts/pricing/pricing-settings-actions";
import { PricingClient } from "./pricing-client";

export default async function PricingPage() {
    const [promotions, loyaltyRules, packages, durationDiscounts, volumeDiscounts] = await Promise.all([
        getPromotions(),
        getLoyaltyRules(),
        getPackages(),
        getDurationDiscounts(),
        getVolumeDiscounts(),
    ]);

    return (
        <PricingClient
            promotions={promotions}
            loyaltyRules={loyaltyRules}
            packages={packages}
            durationDiscounts={durationDiscounts}
            volumeDiscounts={volumeDiscounts}
        />
    );
}