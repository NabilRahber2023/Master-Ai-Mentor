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

export default function CareerGuidancePage() {
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Career Guidance</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex-1 space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Career Guidance</h1>
                    <p className="text-muted-foreground">
                        Personalized pathways, skills mapping, and role recommendations.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Career Path Explorer</CardTitle>
                            <CardDescription>Visualize target roles and required skills.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Add role fit scoring and roadmap recommendations here.
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Skill Gap Analysis</CardTitle>
                            <CardDescription>Identify strengths and next focus areas.</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            Connect to the backend career engine to populate insights.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}
