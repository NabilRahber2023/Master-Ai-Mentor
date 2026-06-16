import PricingSection from '@/components/pricing/pricing-section';

// Force dynamic rendering - this page queries the database for pricing data
// and cannot be statically generated at build time
export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Pricing | AI-Mentor',
    description: 'Choose the perfect plan for your institution. Flexible pricing with transparent costs and powerful AI-driven student services.',
};

export default function PricingPage() {
    return (
        <main className="min-h-screen">
            <PricingSection />
        </main>
    );
}
