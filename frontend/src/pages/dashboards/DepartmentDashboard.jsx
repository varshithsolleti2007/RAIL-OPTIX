import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import BlockRequestForm from "../../components/BlockRequestForm";
import BlockRequestsList from "../../components/BlockRequestsList";
import NotificationsPanel from "../../components/NotificationsPanel";
import { blockRequestsApi } from "../../api/resources";

export default function DepartmentDashboard({ departmentName, workTypes }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { requests } = await blockRequestsApi.list();
      setRequests(requests);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "SUBMITTED").length,
    approved: requests.filter((r) => ["APPROVED", "SCHEDULED"].includes(r.status)).length,
    rejected: requests.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <DashboardLayout title={`${departmentName} Dashboard`}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Requests" value={counts.total} />
        <StatCard label="Pending" value={counts.pending} />
        <StatCard label="Approved" value={counts.approved} />
        <StatCard label="Rejected" value={counts.rejected} />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium text-slate-900">Requests</h2>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-1.5"
          >
            {showForm ? "Cancel" : "+ Create Block Request"}
          </button>
        </div>

        {showForm && (
          <div className="mb-4 pb-4 border-b border-slate-100">
            <BlockRequestForm
              workTypes={workTypes}
              onCreated={() => {
                setShowForm(false);
                load();
              }}
            />
          </div>
        )}

        <BlockRequestsList requests={requests} loading={loading} onChanged={load} />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-medium text-slate-900 mb-3">Notifications</h2>
        <NotificationsPanel />
      </div>
    </DashboardLayout>
  );
}
