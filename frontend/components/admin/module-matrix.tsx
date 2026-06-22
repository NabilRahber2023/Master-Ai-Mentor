"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleOrgModule, setModuleGlobal, type ModuleMatrix } from "@/actionts/admin/module-actions";
import { toast } from "sonner";

/**
 * Super Admin grid: organizations (rows) × modules (columns). Each cell toggles
 * org_module.enabled; the header toggle is the global kill-switch per module.
 */
export function ModuleMatrixGrid({ initial }: { initial: ModuleMatrix }) {
    const [matrix, setMatrix] = useState(initial);
    const [pending, startTransition] = useTransition();

    const onCell = (orgId: string, moduleId: string, next: boolean) => {
        setMatrix((m) => ({
            ...m,
            orgs: m.orgs.map((o) =>
                o.orgId === orgId ? { ...o, enabled: { ...o.enabled, [moduleId]: next } } : o,
            ),
        }));
        startTransition(async () => {
            try {
                await toggleOrgModule(orgId, moduleId, next);
                toast.success(`${next ? "Enabled" : "Disabled"} ${moduleId}`);
            } catch {
                toast.error("Failed to update — reverting");
                setMatrix((m) => ({
                    ...m,
                    orgs: m.orgs.map((o) =>
                        o.orgId === orgId ? { ...o, enabled: { ...o.enabled, [moduleId]: !next } } : o,
                    ),
                }));
            }
        });
    };

    const onGlobal = (moduleId: string, next: boolean) => {
        setMatrix((m) => ({
            ...m,
            modules: m.modules.map((mod) => (mod.id === moduleId ? { ...mod, globalEnabled: next } : mod)),
        }));
        startTransition(async () => {
            try {
                await setModuleGlobal(moduleId, next);
                toast.success(`${next ? "Enabled" : "Killed"} ${moduleId} globally`);
            } catch {
                toast.error("Failed to update global switch");
            }
        });
    };

    return (
        <div className="overflow-x-auto rounded-xl border">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b bg-muted/40">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                        {matrix.modules.map((m) => (
                            <th key={m.id} className="px-4 py-3 text-center font-medium">
                                <div className="flex flex-col items-center gap-1.5">
                                    <span>{m.name}</span>
                                    <label className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                                        global
                                        <Switch
                                            checked={m.globalEnabled}
                                            disabled={pending}
                                            onCheckedChange={(v) => onGlobal(m.id, v)}
                                        />
                                    </label>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {matrix.orgs.map((o) => (
                        <tr key={o.orgId} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="px-4 py-3">
                                <div className="font-medium">{o.orgName}</div>
                                {o.slug && <div className="text-xs text-muted-foreground">/{o.slug}</div>}
                            </td>
                            {matrix.modules.map((m) => (
                                <td key={m.id} className="px-4 py-3 text-center">
                                    <Switch
                                        checked={!!o.enabled[m.id]}
                                        disabled={pending || !m.globalEnabled}
                                        onCheckedChange={(v) => onCell(o.orgId, m.id, v)}
                                    />
                                </td>
                            ))}
                        </tr>
                    ))}
                    {matrix.orgs.length === 0 && (
                        <tr>
                            <td colSpan={matrix.modules.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                                No organizations yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
