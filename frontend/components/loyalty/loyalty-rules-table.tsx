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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, ArrowUpDown } from "lucide-react";
import { type LoyaltyRedemptionRule } from "@/db/schema";
import { toggleLoyaltyRuleActive, deleteLoyaltyRule } from "@/actionts/loyalty/loyalty-actions";
import { toast } from "sonner";

interface LoyaltyRulesTableProps {
    rules: LoyaltyRedemptionRule[];
    onEdit: (rule: LoyaltyRedemptionRule) => void;
}

export function LoyaltyRulesTable({ rules, onEdit }: LoyaltyRulesTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [isLoading, setIsLoading] = React.useState<string | null>(null);

    const handleToggleActive = async (id: string) => {
        setIsLoading(id);
        try {
            await toggleLoyaltyRuleActive(id);
            toast.success("Rule status updated");
        } catch {
            toast.error("Failed to update status");
        } finally {
            setIsLoading(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;

        setIsLoading(id);
        try {
            await deleteLoyaltyRule(id);
            toast.success("Rule deleted");
        } catch {
            toast.error("Failed to delete rule");
        } finally {
            setIsLoading(null);
        }
    };

    const columns: ColumnDef<LoyaltyRedemptionRule>[] = [
        {
            accessorKey: "name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex flex-col gap-1">
                    <span className="font-medium">{row.original.name}</span>
                    {row.original.description && (
                        <span className="text-xs text-muted-foreground">
                            {row.original.description}
                        </span>
                    )}
                </div>
            ),
        },
        {
            accessorKey: "pointsRequired",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Points Required
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-medium text-yellow-500">
                    {row.original.pointsRequired.toLocaleString()} pts
                </span>
            ),
        },
        {
            accessorKey: "discountType",
            header: "Reward",
            cell: ({ row }) => {
                const type = row.original.discountType;
                const value = row.original.discountValue;
                return (
                    <span className="font-medium text-green-500">
                        {type === "percentage" ? `${value}% off` : `৳${value} off`}
                    </span>
                );
            },
        },
        {
            accessorKey: "isActive",
            header: "Active",
            cell: ({ row }) => (
                <Switch
                    checked={row.original.isActive}
                    onCheckedChange={() => handleToggleActive(row.original.id)}
                    disabled={isLoading === row.original.id}
                />
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
        data: rules,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        state: { sorting },
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
                                No loyalty rules found. Create your first rule to get started.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
