"use client"
import Hero from "@/components/landing-page/hero";
import ServicesSection from "@/components/features/services/services-section";
import SaaSFeaturesSection from "@/components/features/saas-features-section";
import Partner from "@/components/partner/partner";

export default function Home() {
    return (
        <>
            <Hero />
            <div id="services">
                <ServicesSection />
            </div>
            <div id="features">
                <SaaSFeaturesSection />
            </div>
            <div id="partners">
                <Partner />
            </div>
        </>
    );
}
