import { Suspense } from "react";
import { getPackages } from "@/actionts/packages/package-actions";
import { PackagesClient } from "./packages-client";
import { Skeleton } from "@/components/ui/skeleton";

export default async function PackagesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Package Management</h1>
                <p className="text-muted-foreground">
                    Create and manage packages that will be displayed on the landing page.
                </p>
            </div>
            <Suspense fallback={<PackagesTableSkeleton />}>
                <PackagesPageContent />
            </Suspense>
        </div>
    );
}

async function PackagesPageContent() {
    const packages = await getPackages();
    return <PackagesClient packages={packages} />;
}

function PackagesTableSkeleton() {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-[150px]" />
            <div className="rounded-md border">
                <div className="p-4 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}