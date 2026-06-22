import { CsvUpload } from "@/components/admin/csv-upload";

export default function DashboardIndexPage() {
    return (
        <div className="min-h-screen bg-[var(--app-bg)] p-6 md:p-8">
            <h1 className="mb-6 text-2xl font-bold text-[var(--app-text)]">Admin · Data Management</h1>
            <CsvUpload />
        </div>
    );
}
