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

export default function AiChatbotPage() {
    return (
        <>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>AI Chatbot</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex-1 space-y-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Chatbot</h1>
                    <p className="text-muted-foreground">
                        A dedicated space for chat history, analytics, and knowledge settings.
                    </p>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Chatbot Console</CardTitle>
                        <CardDescription>Use the floating chatbot for now.</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        This page can later show conversation logs, feedback, and knowledge sources.
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
