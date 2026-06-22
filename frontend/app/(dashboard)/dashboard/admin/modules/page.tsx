import { getModuleMatrix } from "@/actionts/admin/module-actions";
import { ModuleMatrixGrid } from "@/components/admin/module-matrix";

export default async function AdminModulesPage() {
    const matrix = await getModuleMatrix();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Module Control</h1>
                <p className="text-sm text-muted-foreground">
                    Turn each module on or off per organization. The <strong>global</strong> switch is a
                    platform-wide kill-switch — when off, the module is disabled for everyone.
                </p>
            </div>
            <ModuleMatrixGrid initial={matrix} />
        </div>
    );
}
