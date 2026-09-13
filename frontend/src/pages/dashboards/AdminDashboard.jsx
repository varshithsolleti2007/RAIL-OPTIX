import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";

export default function AdminDashboard() {
  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Users" value="—" />
        <StatCard label="Departments" value="—" />
        <StatCard label="Railway Sections" value="—" />
        <StatCard label="Audit Entries" value="—" />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-medium text-slate-900 mb-3">System Activity</h2>
        <p className="text-sm text-slate-500">No activity recorded yet.</p>
      </div>
    </DashboardLayout>
  );
}
