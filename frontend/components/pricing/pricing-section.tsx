import { getVisiblePackages } from "@/actionts/packages/package-actions";
import { getActivePromotions } from "@/actionts/promotions/promotion-actions";
import { getActiveDurationDiscounts, getActiveVolumeDiscounts } from "@/actionts/pricing/pricing-settings-actions";
import PricingSectionClient from "./pricing-section-client";

export default async function PricingSection() {
    const [packages, promotions, durationDiscounts, volumeDiscounts] = await Promise.all([
        getVisiblePackages(),
        getActivePromotions(),
        getActiveDurationDiscounts(),
        getActiveVolumeDiscounts(),
    ]);

    return (
        <PricingSectionClient
            packages={packages}
            promotions={promotions}
            durationDiscounts={durationDiscounts}
            volumeDiscounts={volumeDiscounts}
        />
    );
}
