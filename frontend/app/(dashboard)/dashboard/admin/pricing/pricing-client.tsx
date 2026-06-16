"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Percent, Gift, Clock, Users, Trash2, Loader2, DollarSign } from "lucide-react";
import { type Promotion, type LoyaltyRedemptionRule, type Package, type DurationDiscount, type VolumeDiscount } from "@/db/schema";
import { PromotionsTable } from "@/components/promotions/promotions-table";
import { PromotionFormDialog } from "@/components/promotions/promotion-form-dialog";
import { LoyaltyRulesTable } from "@/components/loyalty/loyalty-rules-table";
import { LoyaltyRuleFormDialog } from "@/components/loyalty/loyalty-rule-form-dialog";
import {
    createDurationDiscount,
    updateDurationDiscount,
    deleteDurationDiscount,
    createVolumeDiscount,
    updateVolumeDiscount,
    deleteVolumeDiscount,
    seedDefaultDiscounts,
} from "@/actionts/pricing/pricing-settings-actions";
import { updatePackage } from "@/actionts/packages/package-actions";
import { toast } from "sonner";

interface PricingClientProps {
    promotions: Promotion[];
    loyaltyRules: LoyaltyRedemptionRule[];
    packages: Package[];
    durationDiscounts: DurationDiscount[];
    volumeDiscounts: VolumeDiscount[];
}

export function PricingClient({
    promotions,
    loyaltyRules,
    packages,
    durationDiscounts,
    volumeDiscounts,
}: PricingClientProps) {
    const [promoDialogOpen, setPromoDialogOpen] = React.useState(false);
    const [loyaltyDialogOpen, setLoyaltyDialogOpen] = React.useState(false);
    const [editingPromotion, setEditingPromotion] = React.useState<Promotion | null>(null);
    const [editingLoyaltyRule, setEditingLoyaltyRule] = React.useState<LoyaltyRedemptionRule | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    // Duration discount state
    const [newDuration, setNewDuration] = React.useState({ months: 0, discountPercent: 0, label: "" });

    // Volume discount state
    const [newVolume, setNewVolume] = React.useState({ minUsers: 0, maxUsers: 0, discountPercent: 0, label: "" });

    const handleEditPromotion = (promotion: Promotion) => {
        setEditingPromotion(promotion);
        setPromoDialogOpen(true);
    };

    const handleEditLoyaltyRule = (rule: LoyaltyRedemptionRule) => {
        setEditingLoyaltyRule(rule);
        setLoyaltyDialogOpen(true);
    };

    const handlePromoDialogClose = (open: boolean) => {
        setPromoDialogOpen(open);
        if (!open) {
            setEditingPromotion(null);
        }
    };

    const handleLoyaltyDialogClose = (open: boolean) => {
        setLoyaltyDialogOpen(open);
        if (!open) {
            setEditingLoyaltyRule(null);
        }
    };

    const handleSeedDefaults = async () => {
        setIsLoading(true);
        try {
            await seedDefaultDiscounts();
            toast.success("Default discounts created");
        } catch {
            toast.error("Failed to create defaults");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDuration = async () => {
        if (newDuration.months <= 0) {
            toast.error("Please enter valid months");
            return;
        }
        setIsLoading(true);
        try {
            await createDurationDiscount({
                months: newDuration.months,
                discountPercent: newDuration.discountPercent,
                label: newDuration.label || `${newDuration.months} Months`,
                isActive: true,
            });
            setNewDuration({ months: 0, discountPercent: 0, label: "" });
            toast.success("Duration discount added");
        } catch {
            toast.error("Failed to add discount");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateDuration = async (id: string, discountPercent: number) => {
        try {
            await updateDurationDiscount(id, { discountPercent });
            toast.success("Discount updated");
        } catch {
            toast.error("Failed to update");
        }
    };

    const handleToggleDuration = async (id: string, isActive: boolean) => {
        try {
            await updateDurationDiscount(id, { isActive });
        } catch {
            toast.error("Failed to toggle");
        }
    };

    const handleDeleteDuration = async (id: string) => {
        try {
            await deleteDurationDiscount(id);
            toast.success("Deleted");
        } catch {
            toast.error("Failed to delete");
        }
    };

    const handleAddVolume = async () => {
        if (newVolume.minUsers < 0) {
            toast.error("Please enter valid user range");
            return;
        }
        setIsLoading(true);
        try {
            await createVolumeDiscount({
                minUsers: newVolume.minUsers,
                maxUsers: newVolume.maxUsers || null,
                discountPercent: newVolume.discountPercent,
                label: newVolume.label || `${newVolume.minUsers}+ users`,
                isActive: true,
            });
            setNewVolume({ minUsers: 0, maxUsers: 0, discountPercent: 0, label: "" });
            toast.success("Volume discount added");
        } catch {
            toast.error("Failed to add discount");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateVolume = async (id: string, discountPercent: number) => {
        try {
            await updateVolumeDiscount(id, { discountPercent });
            toast.success("Discount updated");
        } catch {
            toast.error("Failed to update");
        }
    };

    const handleToggleVolume = async (id: string, isActive: boolean) => {
        try {
            await updateVolumeDiscount(id, { isActive });
        } catch {
            toast.error("Failed to toggle");
        }
    };

    const handleDeleteVolume = async (id: string) => {
        try {
            await deleteVolumeDiscount(id);
            toast.success("Deleted");
        } catch {
            toast.error("Failed to delete");
        }
    };

    // Package pricing handlers
    const handleUpdatePackagePrice = async (packageId: string, basePrice: number) => {
        try {
            await updatePackage(packageId, { basePrice });
            toast.success("Price updated");
        } catch {
            toast.error("Failed to update price");
        }
    };

    const handleUpdatePackageCurrency = async (packageId: string, currency: string) => {
        try {
            await updatePackage(packageId, { currency });
            toast.success("Currency updated");
        } catch {
            toast.error("Failed to update currency");
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pricing Management</h1>
                <p className="text-muted-foreground">
                    Manage promotions, discounts, duration pricing, and volume-based discounts.
                </p>
            </div>

            <Tabs defaultValue="packages" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="packages" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        Packages
                    </TabsTrigger>
                    <TabsTrigger value="duration" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Duration
                    </TabsTrigger>
                    <TabsTrigger value="volume" className="gap-2">
                        <Users className="h-4 w-4" />
                        Volume
                    </TabsTrigger>
                    <TabsTrigger value="promotions" className="gap-2">
                        <Percent className="h-4 w-4" />
                        Promotions
                    </TabsTrigger>
                    <TabsTrigger value="loyalty" className="gap-2">
                        <Gift className="h-4 w-4" />
                        Loyalty
                    </TabsTrigger>
                </TabsList>

                {/* Package Pricing Tab */}
                <TabsContent value="packages" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Package Pricing</CardTitle>
                            <CardDescription>
                                Set the base price for each package. Prices are in smallest currency unit.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Package</TableHead>
                                        <TableHead>Tier</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Currency</TableHead>
                                        <TableHead>Loyalty Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {packages.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                                No packages found. Create packages first in the Packages section.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        packages.map((pkg) => (
                                            <TableRow key={pkg.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{pkg.name}</span>
                                                        <span className="text-xs text-muted-foreground">{pkg.displayName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="capitalize px-2 py-1 rounded-full text-xs bg-muted">
                                                        {pkg.tier}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        defaultValue={pkg.basePrice}
                                                        className="w-28"
                                                        onBlur={(e) => handleUpdatePackagePrice(pkg.id, Number(e.target.value))}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <select
                                                        defaultValue={pkg.currency}
                                                        className="h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        onChange={(e) => handleUpdatePackageCurrency(pkg.id, e.target.value)}
                                                    >
                                                        <option value="BDT">BDT</option>
                                                        <option value="USD">USD</option>
                                                        <option value="EUR">EUR</option>
                                                    </select>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        defaultValue={pkg.loyaltyPoints}
                                                        className="w-20"
                                                        onBlur={(e) => {
                                                            updatePackage(pkg.id, { loyaltyPoints: Number(e.target.value) })
                                                                .then(() => toast.success("Points updated"))
                                                                .catch(() => toast.error("Failed"));
                                                        }}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Duration Discounts Tab */}
                <TabsContent value="duration" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Duration-Based Discounts</CardTitle>
                                    <CardDescription>
                                        Set discounts for 3-month, 6-month, annual subscriptions, etc.
                                    </CardDescription>
                                </div>
                                {durationDiscounts.length === 0 && (
                                    <Button onClick={handleSeedDefaults} disabled={isLoading} variant="outline">
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Load Defaults
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Months</TableHead>
                                        <TableHead>Label</TableHead>
                                        <TableHead>Discount %</TableHead>
                                        <TableHead>Active</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {durationDiscounts.map((d) => (
                                        <TableRow key={d.id}>
                                            <TableCell className="font-medium">{d.months}</TableCell>
                                            <TableCell>{d.label}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    defaultValue={d.discountPercent}
                                                    className="w-20"
                                                    onBlur={(e) => handleUpdateDuration(d.id, Number(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={d.isActive}
                                                    onCheckedChange={(checked) => handleToggleDuration(d.id, checked)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteDuration(d.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Add new row */}
                                    <TableRow>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min={1}
                                                placeholder="Months"
                                                className="w-20"
                                                value={newDuration.months || ""}
                                                onChange={(e) => setNewDuration(p => ({ ...p, months: Number(e.target.value) }))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                placeholder="Label"
                                                className="w-32"
                                                value={newDuration.label}
                                                onChange={(e) => setNewDuration(p => ({ ...p, label: e.target.value }))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                placeholder="%"
                                                className="w-20"
                                                value={newDuration.discountPercent || ""}
                                                onChange={(e) => setNewDuration(p => ({ ...p, discountPercent: Number(e.target.value) }))}
                                            />
                                        </TableCell>
                                        <TableCell colSpan={2}>
                                            <Button size="sm" onClick={handleAddDuration} disabled={isLoading}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Volume Discounts Tab */}
                <TabsContent value="volume" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Volume-Based Discounts</CardTitle>
                                    <CardDescription>
                                        Set discounts based on number of users/seats.
                                    </CardDescription>
                                </div>
                                {volumeDiscounts.length === 0 && (
                                    <Button onClick={handleSeedDefaults} disabled={isLoading} variant="outline">
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Load Defaults
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Min Users</TableHead>
                                        <TableHead>Max Users</TableHead>
                                        <TableHead>Label</TableHead>
                                        <TableHead>Discount %</TableHead>
                                        <TableHead>Active</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {volumeDiscounts.map((v) => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-medium">{v.minUsers}</TableCell>
                                            <TableCell>{v.maxUsers ?? "∞"}</TableCell>
                                            <TableCell>{v.label}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    defaultValue={v.discountPercent}
                                                    className="w-20"
                                                    onBlur={(e) => handleUpdateVolume(v.id, Number(e.target.value))}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={v.isActive}
                                                    onCheckedChange={(checked) => handleToggleVolume(v.id, checked)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteVolume(v.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Add new row */}
                                    <TableRow>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="Min"
                                                className="w-20"
                                                value={newVolume.minUsers || ""}
                                                onChange={(e) => setNewVolume(p => ({ ...p, minUsers: Number(e.target.value) }))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min={0}
                                                placeholder="Max (0=∞)"
                                                className="w-20"
                                                value={newVolume.maxUsers || ""}
                                                onChange={(e) => setNewVolume(p => ({ ...p, maxUsers: Number(e.target.value) }))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                placeholder="Label"
                                                className="w-28"
                                                value={newVolume.label}
                                                onChange={(e) => setNewVolume(p => ({ ...p, label: e.target.value }))}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min={0}
                                                max={100}
                                                placeholder="%"
                                                className="w-20"
                                                value={newVolume.discountPercent || ""}
                                                onChange={(e) => setNewVolume(p => ({ ...p, discountPercent: Number(e.target.value) }))}
                                            />
                                        </TableCell>
                                        <TableCell colSpan={2}>
                                            <Button size="sm" onClick={handleAddVolume} disabled={isLoading}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Promotions Tab */}
                <TabsContent value="promotions" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">Promotions & Discounts</h2>
                            <p className="text-sm text-muted-foreground">
                                Create time-limited discounts with promo codes.
                            </p>
                        </div>
                        <Button onClick={() => setPromoDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Promotion
                        </Button>
                    </div>

                    <PromotionsTable
                        promotions={promotions}
                        onEdit={handleEditPromotion}
                    />

                    <PromotionFormDialog
                        open={promoDialogOpen}
                        onOpenChange={handlePromoDialogClose}
                        editingPromotion={editingPromotion}
                        packages={packages}
                    />
                </TabsContent>

                {/* Loyalty Tab */}
                <TabsContent value="loyalty" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-semibold">Loyalty Redemption Rules</h2>
                            <p className="text-sm text-muted-foreground">
                                Define how users can redeem their loyalty points.
                            </p>
                        </div>
                        <Button onClick={() => setLoyaltyDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Rule
                        </Button>
                    </div>

                    <LoyaltyRulesTable
                        rules={loyaltyRules}
                        onEdit={handleEditLoyaltyRule}
                    />

                    <LoyaltyRuleFormDialog
                        open={loyaltyDialogOpen}
                        onOpenChange={handleLoyaltyDialogClose}
                        editingRule={editingLoyaltyRule}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
