import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { BatchPredictionDashboard } from "@/components/modules/batch-prediction";

export default function BatchPredictionPage() {
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b border-[var(--app-border)]/10 px-6 bg-[var(--app-bg)] sticky top-0 z-50">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-headline text-slate-300 uppercase tracking-widest text-[10px]">
                                Batch Prediction
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 bg-[var(--app-bg)]">
                <BatchPredictionDashboard />
            </div>
        </>
    );
}
