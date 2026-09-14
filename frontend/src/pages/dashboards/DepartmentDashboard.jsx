import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import BlockRequestForm from "../../components/BlockRequestForm";
import BlockRequestsList from "../../components/BlockRequestsList";
import NotificationsPanel from "../../components/NotificationsPanel";
import { Button, Card, StatTile } from "../../components/ui";
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
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Total Requests" value={counts.total} tone="base" />
        <StatTile label="Pending" value={counts.pending} tone="yellow" />
        <StatTile label="Approved" value={counts.approved} tone="teal" />
        <StatTile label="Rejected" value={counts.rejected} tone="coral" />
      </div>

      <Card padding="md" className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Requests</h2>
          <Button variant={showForm ? "secondary" : "primary"} onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Create Block Request"}
          </Button>
        </div>

        {showForm && (
          <div className="mb-5 border-b border-hairline-soft pb-5">
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
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-base font-semibold text-ink">Notifications</h2>
        <NotificationsPanel />
      </Card>
    </DashboardLayout>
  );
}
