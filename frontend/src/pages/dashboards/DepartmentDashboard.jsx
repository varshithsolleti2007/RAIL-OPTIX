import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";

/**
 * Shared dashboard shell for Engineering / Electrical / S&T.
 * Department-specific work types are passed in via props; data wiring
 * to the backend (block requests, notifications) lands once
 * /api/block-requests exists.
 */
export default function DepartmentDashboard({ departmentName, workTypes }) {
  return (
    <DashboardLayout title={`${departmentName} Dashboard`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Requests" value="—" />
        <StatCard label="Pending" value="—" />
        <StatCard label="Approved" value="—" />
        <StatCard label="Upcoming Blocks" value="—" />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-slate-900">Recent Requests</h2>
          <button className="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1.5">
            + Create Block Request
          </button>
        </div>
        <p className="text-sm text-slate-500">
          No requests yet. Typical work types: {workTypes.join(", ")}.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-medium text-slate-900 mb-3">Notifications</h2>
        <p className="text-sm text-slate-500">No notifications yet.</p>
      </div>
    </DashboardLayout>
  );
}
