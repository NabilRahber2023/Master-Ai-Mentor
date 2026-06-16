"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { type Package } from "@/db/schema";
import { PackagesTable } from "@/components/packages/packages-table";
import { PackageFormDialog } from "@/components/packages/package-form-dialog";

interface PackagesClientProps {
    packages: Package[];
}

export function PackagesClient({ packages }: PackagesClientProps) {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [editingPackage, setEditingPackage] = React.useState<Package | null>(null);

    const handleEdit = (pkg: Package) => {
        setEditingPackage(pkg);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingPackage(null);
        setDialogOpen(true);
    };

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setEditingPackage(null);
        }
    };

    return (
        <>
            <div className="flex justify-end">
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Package
                </Button>
            </div>

            <PackagesTable packages={packages} onEdit={handleEdit} />

            <PackageFormDialog
                open={dialogOpen}
                onOpenChange={handleDialogClose}
                editingPackage={editingPackage}
            />
        </>
    );
}
