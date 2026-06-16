"use client";

import * as React from "react";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getSortedRowModel,
    SortingState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Eye, EyeOff, Star, StarOff, ArrowUpDown } from "lucide-react";
import { type Package, type ModuleType } from "@/db/schema";
import { togglePackageVisibility, togglePackagePopular, deletePackage } from "@/actionts/packages/package-actions";
import { toast } from "sonner";

interface PackagesTableProps {
    packages: Package[];
    onEdit: (pkg: Package) => void;
}

const MODULE_LABELS: Record<ModuleType, string> = {
    "grade-prediction": "Grade Prediction",
    "career-guidance": "Career Guidance",
    "ai-chatbot": "AI Chatbot",
    "growth-potential": "Growth Potential",
};

const TIER_COLORS: Record<string, string> = {
    silver: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    gold: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    platinum: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    custom: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export function PackagesTable({ packages, onEdit }: PackagesTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [isLoading, setIsLoading] = React.useState<string | null>(null);

    const handleToggleVisibility = async (id: string) => {
        setIsLoading(id);
        try {
            await togglePackageVisibility(id);
            toast.success("Package visibility updated");
        } catch {
            toast.error("Failed to update visibility");
        } finally {
            setIsLoading(null);
        }
    };

    const handleTogglePopular = async (id: string) => {
        setIsLoading(id);
        try {
            await togglePackagePopular(id);
            toast.success("Popular status updated");
        } catch {
            toast.error("Failed to update popular status");
        } finally {
            setIsLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this package?")) return;

        setIsLoading(id);
        try {
            await deletePackage(id);
            toast.success("Package deleted");
        } catch {
            toast.error("Failed to delete package");
        } finally {
            setIsLoading(null);
        }
    };

    const columns: ColumnDef<Package>[] = [
        {
            accessorKey: "displayName",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Package Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <span className="font-medium">{row.original.displayName}</span>
                    <span className="text-xs text-muted-foreground">{row.original.name}</span>
                </div>
            ),
        },
        {
            accessorKey: "tier",
            header: "Tier",
            cell: ({ row }) => (
                <Badge variant="outline" className={TIER_COLORS[row.original.tier]}>
                    {row.original.tier.charAt(0).toUpperCase() + row.original.tier.slice(1)}
                </Badge>
            ),
        },
        {
            accessorKey: "basePrice",
            header: "Price",
            cell: ({ row }) => {
                const price = row.original.basePrice;
                const currency = row.original.currency;
                const symbol = currency === "BDT" ? "৳" : currency === "USD" ? "$" : "€";
                return (
                    <span className="font-medium">
                        {symbol}{price.toLocaleString()}<span className="text-muted-foreground text-xs">/mo</span>
                    </span>
                );
            },
        },
        {
            accessorKey: "modules",
            header: "Modules",
            cell: ({ row }) => {
                const modules = row.original.modules as ModuleType[];
                return (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {modules.map((mod) => (
                            <Badge key={mod} variant="secondary" className="text-xs">
                                {MODULE_LABELS[mod]}
                            </Badge>
                        ))}
                    </div>
                );
            },
        },
        {
            accessorKey: "isVisible",
            header: "Visible",
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Switch
                        checked={row.original.isVisible}
                        onCheckedChange={() => handleToggleVisibility(row.original.id)}
                        disabled={isLoading === row.original.id}
                    />
                    {row.original.isVisible ? (
                        <Eye className="h-4 w-4 text-green-500" />
                    ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            ),
        },
        {
            accessorKey: "isPopular",
            header: "Popular",
            cell: ({ row }) => (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTogglePopular(row.original.id)}
                    disabled={isLoading === row.original.id}
                >
                    {row.original.isPopular ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground" />
                    )}
                </Button>
            ),
        },
        {
            id: "actions",
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onEdit(row.original)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => handleDelete(row.original.id)}
                            className="text-destructive focus:text-destructive"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const table = useReactTable({
        data: packages,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
        },
    });

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(
                                            cell.column.columnDef.cell,
                                            cell.getContext()
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                No packages found. Create your first package to get started.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
