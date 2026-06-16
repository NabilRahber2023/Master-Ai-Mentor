"use client";

import * as React from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { type Promotion, type Package } from "@/db/schema";
import { createPromotion, updatePromotion } from "@/actionts/promotions/promotion-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const promotionSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().min(1, "Value must be at least 1"),
    packageId: z.string().nullable(),
    promoCode: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    maxUses: z.number().nullable(),
    isActive: z.boolean(),
});

type PromotionFormData = z.infer<typeof promotionSchema>;

interface PromotionFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingPromotion?: Promotion | null;
    packages: Package[];
}

export function PromotionFormDialog({
    open,
    onOpenChange,
    editingPromotion,
    packages,
}: PromotionFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const getDefaultValues = React.useCallback((): PromotionFormData => {
        if (editingPromotion) {
            return {
                name: editingPromotion.name,
                description: editingPromotion.description || "",
                discountType: editingPromotion.discountType,
                discountValue: editingPromotion.discountValue,
                packageId: editingPromotion.packageId,
                promoCode: editingPromotion.promoCode || "",
                startDate: new Date(editingPromotion.startDate).toISOString().split("T")[0],
                endDate: new Date(editingPromotion.endDate).toISOString().split("T")[0],
                maxUses: editingPromotion.maxUses,
                isActive: editingPromotion.isActive,
            };
        }
        return {
            name: "",
            description: "",
            discountType: "percentage",
            discountValue: 10,
            packageId: null,
            promoCode: "",
            startDate: new Date().toISOString().split("T")[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            maxUses: null,
            isActive: true,
        };
    }, [editingPromotion]);

    const form = useForm({
        defaultValues: getDefaultValues(),
        validators: {
            onSubmit: promotionSchema,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            try {
                const payload = {
                    ...value,
                    description: value.description || null,
                    promoCode: value.promoCode || null,
                    startDate: new Date(value.startDate),
                    endDate: new Date(value.endDate),
                };

                if (editingPromotion) {
                    await updatePromotion(editingPromotion.id, payload);
                    toast.success("Promotion updated successfully");
                } else {
                    await createPromotion(payload);
                    toast.success("Promotion created successfully");
                }
                onOpenChange(false);
            } catch (error) {
                console.error("Form submission error:", error);
                toast.error(editingPromotion ? "Failed to update promotion" : "Failed to create promotion");
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    React.useEffect(() => {
        if (open) {
            const values = getDefaultValues();
            form.reset();
            form.setFieldValue("name", values.name);
            form.setFieldValue("description", values.description);
            form.setFieldValue("discountType", values.discountType);
            form.setFieldValue("discountValue", values.discountValue);
            form.setFieldValue("packageId", values.packageId);
            form.setFieldValue("promoCode", values.promoCode);
            form.setFieldValue("startDate", values.startDate);
            form.setFieldValue("endDate", values.endDate);
            form.setFieldValue("maxUses", values.maxUses);
            form.setFieldValue("isActive", values.isActive);
        }
    }, [open, editingPromotion, form, getDefaultValues]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingPromotion ? "Edit Promotion" : "Create New Promotion"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingPromotion
                            ? "Update the promotion details below."
                            : "Fill in the details to create a new promotion."}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="promotion-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        <form.Field
                            name="name"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>Promotion Name</FieldLabel>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="Summer Sale 2025"
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                );
                            }}
                        />

                        <form.Field
                            name="description"
                            children={(field) => (
                                <Field>
                                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                                    <Textarea
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Promotion description..."
                                        rows={2}
                                    />
                                </Field>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="discountType"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel>Discount Type</FieldLabel>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={(v) => field.handleChange(v as "percentage" | "fixed")}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="discountValue"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel htmlFor={field.name}>Discount Value</FieldLabel>
                                        <Input
                                            id={field.name}
                                            type="number"
                                            min={1}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                        />
                                    </Field>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="startDate"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel htmlFor={field.name}>Start Date</FieldLabel>
                                        <Input
                                            id={field.name}
                                            type="date"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="endDate"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel htmlFor={field.name}>End Date</FieldLabel>
                                        <Input
                                            id={field.name}
                                            type="date"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                        />
                                    </Field>
                                )}
                            />
                        </div>

                        <form.Field
                            name="promoCode"
                            children={(field) => (
                                <Field>
                                    <FieldLabel htmlFor={field.name}>Promo Code (Optional)</FieldLabel>
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                                        placeholder="SUMMER25"
                                    />
                                    <FieldDescription>
                                        Leave empty for automatic discount, or enter a code users must apply
                                    </FieldDescription>
                                </Field>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="packageId"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel>Apply to Package</FieldLabel>
                                        <Select
                                            value={field.state.value ?? "all"}
                                            onValueChange={(v) => field.handleChange(v === "all" ? null : v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="All packages" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Packages</SelectItem>
                                                {packages.map((pkg) => (
                                                    <SelectItem key={pkg.id} value={pkg.id}>
                                                        {pkg.displayName}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="maxUses"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel htmlFor={field.name}>Max Uses</FieldLabel>
                                        <Input
                                            id={field.name}
                                            type="number"
                                            min={0}
                                            value={field.state.value ?? ""}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value ? Number(e.target.value) : null)}
                                            placeholder="Unlimited"
                                        />
                                    </Field>
                                )}
                            />
                        </div>

                        <form.Field
                            name="isActive"
                            children={(field) => (
                                <Field orientation="horizontal">
                                    <Switch
                                        id="isActive"
                                        checked={field.state.value}
                                        onCheckedChange={field.handleChange}
                                    />
                                    <FieldLabel htmlFor="isActive" className="font-normal">
                                        Active
                                    </FieldLabel>
                                </Field>
                            )}
                        />
                    </FieldGroup>
                </form>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" form="promotion-form" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingPromotion ? "Update Promotion" : "Create Promotion"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
