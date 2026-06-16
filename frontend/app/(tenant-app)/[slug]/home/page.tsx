"use client";

import { useTenant } from "@/hooks/use-tenant";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import {
    GraduationCap,
    Compass,
    Bot,
    TrendingUp,
    Users,
    Activity,
} from "lucide-react";
import Link from "next/link";

// Quick stat cards data
const getQuickStats = (tenant: NonNullable<ReturnType<typeof useTenant>>) => [
    {
        title: "Active Modules",
        value: tenant.enabledModules.length.toString(),
        icon: Activity,
        description: "Enabled AI modules",
    },
    {
        title: "Current Plan",
        value: tenant.packageId?.charAt(0).toUpperCase() + (tenant.packageId?.slice(1) || ""),
        icon: GraduationCap,
        description: "Subscription tier",
    },
    {
        title: "Your Role",
        value: tenant.userRole.charAt(0).toUpperCase() + tenant.userRole.slice(1),
        icon: Users,
        description: "Organization role",
    },
];

// Module definitions (href built dynamically using slug)
const MODULE_DEFS = [
    {
        id: "grade-prediction",
        title: "Grade Prediction",
        description: "AI-powered academic performance prediction",
        icon: GraduationCap,
        color: "bg-blue-500/10 text-blue-500",
    },
    {
        id: "career-guidance",
        title: "Career Guidance",
        description: "Personalized career path recommendations",
        icon: Compass,
        color: "bg-purple-500/10 text-purple-500",
    },
    {
        id: "ai-chatbot",
        title: "AI Chatbot",
        description: "24/7 intelligent student assistant",
        icon: Bot,
        color: "bg-green-500/10 text-green-500",
    },
    {
        id: "growth-potential",
        title: "Growth Potential",
        description: "Student development analysis",
        icon: TrendingUp,
        color: "bg-orange-500/10 text-orange-500",
    },
];

export default function TenantDashboard() {
    const tenant = useTenant();

    if (!tenant) {
        return null;
    }

    const stats = getQuickStats(tenant);

    return (
        <>
            {/* Header */}
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbPage>Dashboard</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>

            {/* Content */}
            <div className="flex-1 space-y-6 p-6">
                {/* Welcome */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome to {tenant.organizationName}
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your AI-powered student success modules from here.
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    {stats.map((stat) => (
                        <Card key={stat.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stat.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Module Cards */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">AI Modules</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {MODULE_DEFS.map((module) => {
                            const isEnabled = tenant.enabledModules.includes(module.id);
                            const Icon = module.icon;
                            const moduleHref = `/${tenant.slug}/modules/${module.id}`;

                            return (
                                <Card
                                    key={module.id}
                                    className={`transition-all ${isEnabled
                                        ? "hover:shadow-lg cursor-pointer"
                                        : "opacity-50 cursor-not-allowed"
                                        }`}
                                >
                                    {isEnabled ? (
                                        <Link href={moduleHref}>
                                            <CardHeader>
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${module.color}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <CardTitle className="text-base">{module.title}</CardTitle>
                                                <CardDescription className="text-xs mt-1">
                                                    {module.description}
                                                </CardDescription>
                                            </CardContent>
                                        </Link>
                                    ) : (
                                        <>
                                            <CardHeader>
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${module.color}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <CardTitle className="text-base">{module.title}</CardTitle>
                                                <CardDescription className="text-xs mt-1">
                                                    Upgrade to unlock
                                                </CardDescription>
                                            </CardContent>
                                        </>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}
