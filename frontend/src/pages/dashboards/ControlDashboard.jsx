import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";

export default function ControlDashboard() {
  return (
    <DashboardLayout title="Control Center">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending Requests" value="—" />
        <StatCard label="Open Conflicts" value="—" />
        <StatCard label="Today's Blocks" value="—" />
        <StatCard label="Upcoming Blocks" value="—" />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="font-medium text-slate-900 mb-3">Request Queue</h2>
          <p className="text-sm text-slate-500">No pending requests.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="font-medium text-slate-900 mb-3">Conflicts</h2>
          <p className="text-sm text-slate-500">No open conflicts.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <h2 className="font-medium text-slate-900 mb-3">
          AI Recommendation
        </h2>
        <p className="text-sm text-slate-500">
          No recommendation available. Recommendations appear once the
          Intelligence Service is connected and a conflicting request exists.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-medium text-slate-900 mb-3">Schedule Timeline</h2>
        <p className="text-sm text-slate-500">No schedules published yet.</p>
      </div>
    </DashboardLayout>
  );
}
