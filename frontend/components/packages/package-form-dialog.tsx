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
import { Checkbox } from "@/components/ui/checkbox";
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
    FieldLegend,
    FieldSet,
} from "@/components/ui/field";
import { type Package, type ModuleType } from "@/db/schema";
import { createPackage, updatePackage } from "@/actionts/packages/package-actions";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

const MODULES: { id: ModuleType; name: string }[] = [
    { id: "grade-prediction", name: "Grade Prediction" },
    { id: "career-guidance", name: "Career Guidance" },
    { id: "ai-chatbot", name: "AI Chatbot" },
    { id: "growth-potential", name: "Growth Potential" },
];

const packageSchema = z.object({
    name: z.string().min(1, "Name is required"),
    displayName: z.string().min(1, "Display name is required"),
    description: z.string().optional(),
    tier: z.enum(["silver", "gold", "platinum", "custom"]),
    basePrice: z.number().min(0, "Price must be 0 or greater"),
    currency: z.string().min(1, "Currency is required"),
    loyaltyPoints: z.number().min(0, "Points must be 0 or greater"),
    usageLimit: z.string().optional(),
    modules: z.array(z.string()).min(1, "Select at least one module"),
    features: z.array(z.string()),
    isVisible: z.boolean(),
    isPopular: z.boolean(),
    badge: z.string().optional(),
    sortOrder: z.number(),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface PackageFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingPackage?: Package | null;
}

export function PackageFormDialog({
    open,
    onOpenChange,
    editingPackage,
}: PackageFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [newFeature, setNewFeature] = React.useState("");

    const getDefaultValues = React.useCallback((): PackageFormData => {
        if (editingPackage) {
            return {
                name: editingPackage.name,
                displayName: editingPackage.displayName,
                description: editingPackage.description || "",
                tier: editingPackage.tier,
                basePrice: editingPackage.basePrice,
                currency: editingPackage.currency,
                loyaltyPoints: editingPackage.loyaltyPoints,
                usageLimit: editingPackage.usageLimit || "",
                modules: editingPackage.modules as string[],
                features: editingPackage.features as string[],
                isVisible: editingPackage.isVisible,
                isPopular: editingPackage.isPopular,
                badge: editingPackage.badge || "",
                sortOrder: editingPackage.sortOrder,
            };
        }
        return {
            name: "",
            displayName: "",
            description: "",
            tier: "custom",
            basePrice: 0,
            currency: "BDT",
            loyaltyPoints: 0,
            usageLimit: "",
            modules: [],
            features: [],
            isVisible: false,
            isPopular: false,
            badge: "",
            sortOrder: 0,
        };
    }, [editingPackage]);

    const form = useForm({
        defaultValues: getDefaultValues(),
        validators: {
            onSubmit: packageSchema,
        },
        onSubmit: async ({ value }) => {
            setIsSubmitting(true);
            try {
                const payload = {
                    ...value,
                    modules: value.modules as ModuleType[],
                    description: value.description || null,
                    usageLimit: value.usageLimit || null,
                    badge: value.badge || null,
                };

                if (editingPackage) {
                    await updatePackage(editingPackage.id, payload);
                    toast.success("Package updated successfully");
                } else {
                    await createPackage(payload);
                    toast.success("Package created successfully");
                }
                onOpenChange(false);
            } catch (error) {
                console.error("Form submission error:", error);
                toast.error(editingPackage ? "Failed to update package" : "Failed to create package");
            } finally {
                setIsSubmitting(false);
            }
        },
    });

    // Reset form when dialog opens or editingPackage changes
    React.useEffect(() => {
        if (open) {
            const values = getDefaultValues();
            form.reset();
            // Manually set each field value
            form.setFieldValue("name", values.name);
            form.setFieldValue("displayName", values.displayName);
            form.setFieldValue("description", values.description);
            form.setFieldValue("tier", values.tier);
            form.setFieldValue("basePrice", values.basePrice);
            form.setFieldValue("currency", values.currency);
            form.setFieldValue("loyaltyPoints", values.loyaltyPoints);
            form.setFieldValue("usageLimit", values.usageLimit);
            form.setFieldValue("modules", values.modules);
            form.setFieldValue("features", values.features);
            form.setFieldValue("isVisible", values.isVisible);
            form.setFieldValue("isPopular", values.isPopular);
            form.setFieldValue("badge", values.badge);
            form.setFieldValue("sortOrder", values.sortOrder);
        }
    }, [open, editingPackage, form, getDefaultValues]);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingPackage ? "Edit Package" : "Create New Package"}
                    </DialogTitle>
                    <DialogDescription>
                        {editingPackage
                            ? "Update the package details below."
                            : "Fill in the details to create a new package."}
                    </DialogDescription>
                </DialogHeader>

                <form
                    id="package-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                >
                    <FieldGroup>
                        {/* Basic Info Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="name"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Internal Name</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={isInvalid}
                                                placeholder="e.g., starter-plan"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}
                            />
                            <form.Field
                                name="displayName"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Display Name</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(e.target.value)}
                                                aria-invalid={isInvalid}
                                                placeholder="e.g., Starter Plan"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}
                            />
                        </div>

                        {/* Description */}
                        <form.Field
                            name="description"
                            children={(field) => (
                                <Field>
                                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                                    <Textarea
                                        id={field.name}
                                        name={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Package description..."
                                        rows={3}
                                    />
                                </Field>
                            )}
                        />

                        {/* Tier and Usage Limit Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="tier"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel htmlFor="tier-select">Tier</FieldLabel>
                                        <Select
                                            name={field.name}
                                            value={field.state.value}
                                            onValueChange={(value) => field.handleChange(value as "silver" | "gold" | "platinum" | "custom")}
                                        >
                                            <SelectTrigger id="tier-select">
                                                <SelectValue placeholder="Select tier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="silver">Silver</SelectItem>
                                                <SelectItem value="gold">Gold</SelectItem>
                                                <SelectItem value="platinum">Platinum</SelectItem>
                                                <SelectItem value="custom">Custom</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="usageLimit"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel htmlFor={field.name}>Usage Limit</FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="e.g., Up to 100 users"
                                        />
                                    </Field>
                                )}
                            />
                        </div>

                        {/* Price Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="basePrice"
                                children={(field) => {
                                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                    return (
                                        <Field data-invalid={isInvalid}>
                                            <FieldLabel htmlFor={field.name}>Price (Monthly)</FieldLabel>
                                            <Input
                                                id={field.name}
                                                name={field.name}
                                                type="number"
                                                min={0}
                                                value={field.state.value}
                                                onBlur={field.handleBlur}
                                                onChange={(e) => field.handleChange(Number(e.target.value))}
                                                aria-invalid={isInvalid}
                                                placeholder="e.g., 299"
                                            />
                                            {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                        </Field>
                                    );
                                }}
                            />
                            <form.Field
                                name="currency"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel htmlFor="currency-select">Currency</FieldLabel>
                                        <Select
                                            name={field.name}
                                            value={field.state.value}
                                            onValueChange={field.handleChange}
                                        >
                                            <SelectTrigger id="currency-select">
                                                <SelectValue placeholder="Select currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="BDT">BDT (৳)</SelectItem>
                                                <SelectItem value="USD">USD ($)</SelectItem>
                                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                )}
                            />
                        </div>

                        {/* Loyalty Points Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="loyaltyPoints"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel htmlFor={field.name}>Loyalty Points Earned</FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type="number"
                                            min={0}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            placeholder="e.g., 100"
                                        />
                                        <FieldDescription>
                                            Points users earn when purchasing this package
                                        </FieldDescription>
                                    </Field>
                                )}
                            />
                        </div>

                        {/* Badge and Sort Order Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <form.Field
                                name="badge"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel htmlFor={field.name}>Badge Text</FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(e.target.value)}
                                            placeholder="e.g., Most Popular"
                                        />
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="sortOrder"
                                children={(field) => (
                                    <Field>
                                        <FieldLabel htmlFor={field.name}>Sort Order</FieldLabel>
                                        <Input
                                            id={field.name}
                                            name={field.name}
                                            type="number"
                                            value={field.state.value}
                                            onBlur={field.handleBlur}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                        />
                                    </Field>
                                )}
                            />
                        </div>

                        {/* Modules */}
                        <form.Field
                            name="modules"
                            mode="array"
                            children={(field) => {
                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                                return (
                                    <FieldSet>
                                        <FieldLegend variant="label">Modules (Services)</FieldLegend>
                                        <FieldDescription>
                                            Select the services included in this package.
                                        </FieldDescription>
                                        <FieldGroup data-slot="checkbox-group">
                                            <div className="grid grid-cols-2 gap-3">
                                                {MODULES.map((module) => (
                                                    <Field
                                                        key={module.id}
                                                        orientation="horizontal"
                                                        data-invalid={isInvalid}
                                                        className="rounded-lg border p-3"
                                                    >
                                                        <Checkbox
                                                            id={`module-${module.id}`}
                                                            name={field.name}
                                                            checked={field.state.value.includes(module.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    field.pushValue(module.id);
                                                                } else {
                                                                    const index = field.state.value.indexOf(module.id);
                                                                    if (index > -1) {
                                                                        field.removeValue(index);
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        <FieldLabel
                                                            htmlFor={`module-${module.id}`}
                                                            className="flex-1 cursor-pointer font-normal"
                                                        >
                                                            {module.name}
                                                        </FieldLabel>
                                                    </Field>
                                                ))}
                                            </div>
                                        </FieldGroup>
                                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                                    </FieldSet>
                                );
                            }}
                        />

                        {/* Features */}
                        <form.Field
                            name="features"
                            mode="array"
                            children={(field) => (
                                <FieldSet>
                                    <FieldLegend variant="label">Features</FieldLegend>
                                    <FieldDescription>
                                        Add features that will be displayed on the pricing card.
                                    </FieldDescription>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Add a feature..."
                                            value={newFeature}
                                            onChange={(e) => setNewFeature(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    if (newFeature.trim()) {
                                                        field.pushValue(newFeature.trim());
                                                        setNewFeature("");
                                                    }
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => {
                                                if (newFeature.trim()) {
                                                    field.pushValue(newFeature.trim());
                                                    setNewFeature("");
                                                }
                                            }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="space-y-2">
                                        {field.state.value.map((feature, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
                                            >
                                                <span className="text-sm">{feature}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => field.removeValue(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </FieldSet>
                            )}
                        />

                        {/* Visibility Toggles */}
                        <div className="flex items-center gap-6">
                            <form.Field
                                name="isVisible"
                                children={(field) => (
                                    <Field orientation="horizontal">
                                        <Switch
                                            id="isVisible"
                                            name={field.name}
                                            checked={field.state.value}
                                            onCheckedChange={field.handleChange}
                                        />
                                        <FieldLabel htmlFor="isVisible" className="font-normal">
                                            Visible on landing page
                                        </FieldLabel>
                                    </Field>
                                )}
                            />
                            <form.Field
                                name="isPopular"
                                children={(field) => (
                                    <Field orientation="horizontal">
                                        <Switch
                                            id="isPopular"
                                            name={field.name}
                                            checked={field.state.value}
                                            onCheckedChange={field.handleChange}
                                        />
                                        <FieldLabel htmlFor="isPopular" className="font-normal">
                                            Mark as popular
                                        </FieldLabel>
                                    </Field>
                                )}
                            />
                        </div>
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
                    <Button type="submit" form="package-form" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingPackage ? "Update Package" : "Create Package"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
