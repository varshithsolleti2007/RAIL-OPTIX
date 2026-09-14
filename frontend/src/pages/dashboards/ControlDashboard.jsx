import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import NotificationsPanel from "../../components/NotificationsPanel";
import ControlRequestCard from "../../components/ControlRequestCard";
import SimulationPanel from "../../components/SimulationPanel";
import { Badge, Button, Card, StatTile, TextField } from "../../components/ui";
import { blockRequestsApi, conflictsApi, dashboardApi, schedulesApi } from "../../api/resources";

export default function ControlDashboard() {
  const [requests, setRequests] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolution, setResolution] = useState("");
  const [failingId, setFailingId] = useState(null);
  const [failError, setFailError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, conflictRes, scheduleRes, metricsRes] = await Promise.all([
        blockRequestsApi.list(),
        conflictsApi.list({ status: "OPEN" }),
        schedulesApi.list(),
        dashboardApi.controlMetrics(),
      ]);
      setRequests(reqRes.requests);
      setConflicts(conflictRes.conflicts);
      setSchedules(scheduleRes.schedules);
      setMetrics(metricsRes);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // "Pending Requests" (the stat) and the actionable queue (the list) are
  // deliberately different things: the stat counts only SUBMITTED per
  // the backend's own metrics query, while the queue also surfaces
  // FAILED requests so Control has one place to review anything needing
  // a decision - a disrupted request just needs a different decision
  // (recovery) than a pending one (approve/reject).
  const actionable = requests.filter((r) => ["SUBMITTED", "FAILED"].includes(r.status));
  const scheduled = schedules.filter((s) => s.status === "PUBLISHED");

  async function handleResolve(id) {
    await conflictsApi.resolve(id, resolution);
    setResolvingId(null);
    setResolution("");
    load();
  }

  async function handleSimulateFailure(requestId) {
    if (failingId) return; // a fail request is already in flight - ignore extra clicks
    setFailingId(requestId);
    setFailError("");
    try {
      const result = await blockRequestsApi.fail(requestId);
      if (result.idempotent) {
        setFailError(result.message);
      }
      load();
    } catch (err) {
      setFailError(err.response?.data?.message || "Could not simulate failure.");
    } finally {
      setFailingId(null);
    }
  }

  return (
    <DashboardLayout title="Control Center">
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatTile label="Pending Requests" value={metrics ? metrics.pendingRequests : "-"} tone="yellow" />
        <StatTile label="Open Conflicts" value={metrics ? metrics.openConflicts : "-"} tone="coral" />
        <StatTile label="Today's Blocks" value={metrics ? metrics.todaysBlocks : "-"} tone="teal" />
        <StatTile label="Upcoming Blocks" value={metrics ? metrics.upcomingBlocks : "-"} tone="base" />
        <StatTile label="Recovery Required" value={metrics ? metrics.recoveryRequired : "-"} tone="rose" />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card padding="md">
          <h2 className="mb-3 text-base font-semibold text-ink">Request Queue</h2>
          {loading && <p className="text-sm text-steel">Loading...</p>}
          {!loading && actionable.length === 0 && <p className="text-sm text-steel">No pending requests.</p>}
          <div className="space-y-3">
            {actionable.map((r) => (
              <ControlRequestCard key={r._id} request={r} onChanged={load} />
            ))}
          </div>
        </Card>

        <Card padding="md">
          <h2 className="mb-3 text-base font-semibold text-ink">Conflicts</h2>
          {!loading && conflicts.length === 0 && <p className="text-sm text-steel">No open conflicts.</p>}
          <div className="space-y-3">
            {conflicts.map((c) => (
              <div key={c._id} className="rounded-input border border-hairline-soft p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-ink">{c.section?.name}</p>
                  <Badge variant="warning">{c.severity}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-steel">{c.description}</p>
                <div className="mt-1.5 space-y-0.5">
                  {c.requests.map((r) => (
                    <p key={r._id} className="text-xs text-slate">
                      {r.requestNumber} - {r.workType} ({r.status})
                    </p>
                  ))}
                </div>

                {resolvingId === c._id ? (
                  <div className="mt-2 flex gap-2">
                    <TextField
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Resolution note"
                      className="flex-1 text-xs"
                    />
                    <Button size="xs" onClick={() => handleResolve(c._id)}>
                      Confirm
                    </Button>
                  </div>
                ) : (
                  <Button variant="link" size="xs" className="mt-2" onClick={() => setResolvingId(c._id)}>
                    Mark resolved
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padding="md" className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-ink">Schedule Timeline</h2>
        {failError && <p className="mb-2 text-xs text-danger">{failError}</p>}
        {scheduled.length === 0 ? (
          <p className="text-sm text-steel">No schedules published yet.</p>
        ) : (
          <div className="space-y-2">
            {scheduled.map((s) => (
              <div key={s._id} className="flex items-center justify-between rounded-input border border-hairline-soft p-3 text-sm">
                <div>
                  <p className="font-medium text-ink">
                    {s.request?.requestNumber} - {s.request?.workType} ({s.section?.name})
                  </p>
                  <p className="text-xs text-steel">
                    {new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleTimeString()}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => handleSimulateFailure(s.request._id)}
                  disabled={failingId === s.request._id}
                >
                  {failingId === s.request._id ? "Simulating..." : "Simulate Failure"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card padding="md" className="mb-6">
        <h2 className="mb-3 text-base font-semibold text-ink">Day Simulation</h2>
        <SimulationPanel />
      </Card>

      <Card padding="md">
        <h2 className="mb-3 text-base font-semibold text-ink">Notifications</h2>
        <NotificationsPanel />
      </Card>
    </DashboardLayout>
  );
}
