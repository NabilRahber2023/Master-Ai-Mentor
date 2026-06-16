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
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { type LoyaltyRedemptionRule } from "@/db/schema";
import { createLoyaltyRule, updateLoyaltyRule } from "@/actionts/loyalty/loyalty-actions";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const loyaltyRuleSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    pointsRequired: z.number().min(1, "Points must be at least 1"),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().min(1, "Value must be at least 1"),
    isActive: z.boolean(),
});

type LoyaltyRuleFormData = z.infer<typeof loyaltyRuleSchema>;

interface LoyaltyRuleFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingRule?: LoyaltyRedemptionRule | null;
}

export function LoyaltyRuleFormDialog({
    open,
    onOpenChange,
    editingRule,
}: LoyaltyRuleFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const getDefaultValues = React.useCallback((): LoyaltyRuleFormData => {
        if (editingRule) {
            return {
                name: editingRule.name,
                description: editingRule.description || "",
                pointsRequired: editingRule.pointsRequired,
                discountType: editingRule.discountType,
                discountValue: editingRule.discountValue,
                isActive: editingRule.isActive,
            };
        }
        return {
            name: "",
            description: "",
            pointsRequired: 100,
            discountType: "percentage",
            discountValue: 5,
            isActive: true,
        };
    }, [editingRule]);

    const form = useForm({
        defaultValues: getDefaultValues(),
        validators: {
            onSubmit: loyaltyRuleSchema,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            try {
                const payload = {
                    ...value,
                    description: value.description || null,
                };

                if (editingRule) {
                    await updateLoyaltyRule(editingRule.id, payload);
                    toast.success("Rule updated successfully");
                } else {
                    await createLoyaltyRule(payload);
                    toast.success("Rule created successfully");
                }
                onOpenChange(false);
            } catch (error) {
                console.error("Form submission error:", error);
                toast.error(editingRule ? "Failed to update rule" : "Failed to create rule");
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
            form.setFieldValue("pointsRequired", values.pointsRequired);
            form.setFieldValue("discountType", values.discountType);
            form.setFieldValue("discountValue", values.discountValue);
            form.setFieldValue("isActive", values.isActive);
        }
    }, [open, editingRule, form, getDefaultValues]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingRule ? "Edit Loyalty Rule" : "Create New Rule"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingRule
                            ? "Update the redemption rule details below."
                            : "Define how users can redeem their loyalty points."}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="loyalty-rule-form"
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
                                        <FieldLabel htmlFor={field.name}>Rule Name</FieldLabel>
                                        <Input
                                            id={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="5% Discount for 100 Points"
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
                                        placeholder="Description..."
                                        rows={2}
                                    />
                                </Field>
                            )}
                        />

                        <form.Field
                            name="pointsRequired"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <Field data-invalid={isInvalid}>
                                        <FieldLabel htmlFor={field.name}>Points Required</FieldLabel>
                                        <Input
                                            id={field.name}
                                            type="number"
                                            min={1}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                        />
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </Field>
                                );
                            }}
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
                    <Button type="submit" form="loyalty-rule-form" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingRule ? "Update Rule" : "Create Rule"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
