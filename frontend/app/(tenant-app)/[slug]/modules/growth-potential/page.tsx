"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function GrowthPotentialPage() {
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Growth Potential</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex-1 space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Growth Potential</h1>
                    <p className="text-muted-foreground">
                        Development insights, progress tracking, and potential forecasting.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Potential Snapshot</CardTitle>
                            <CardDescription>Key indicators and trend direction.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Add growth signals and cohort comparisons here.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Action Plan</CardTitle>
                            <CardDescription>Suggested interventions and next steps.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Connect to backend recommendations when ready.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
