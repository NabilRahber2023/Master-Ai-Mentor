"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { StudentAnalyticsDashboard } from "@/components/grade-prediction/StudentAnalyticsDashboard";

export default function GradePredictionDashboardPage() {
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Grade Prediction</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex-1 space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Student analytics</h1>
                    <p className="text-muted-foreground">
                        Segmentation, prediction, prescriptions, and forecast insights.
                    </p>
                </div>
                <StudentAnalyticsDashboard />
            </div>
        </>
    );
}
