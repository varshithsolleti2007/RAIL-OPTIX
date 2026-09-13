import { useCallback, useEffect, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import StatCard from "../../components/StatCard";
import NotificationsPanel from "../../components/NotificationsPanel";
import ControlRequestCard from "../../components/ControlRequestCard";
import SimulationPanel from "../../components/SimulationPanel";
import { blockRequestsApi, conflictsApi, schedulesApi } from "../../api/resources";

export default function ControlDashboard() {
  const [requests, setRequests] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolution, setResolution] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, conflictRes, scheduleRes] = await Promise.all([
        blockRequestsApi.list(),
        conflictsApi.list({ status: "OPEN" }),
        schedulesApi.list(),
      ]);
      setRequests(reqRes.requests);
      setConflicts(conflictRes.conflicts);
      setSchedules(scheduleRes.schedules);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const actionable = requests.filter((r) => ["SUBMITTED", "FAILED"].includes(r.status));
  const scheduled = schedules.filter((s) => s.status === "PUBLISHED");
  const today = new Date().toDateString();
  const todaysBlocks = scheduled.filter((s) => new Date(s.startTime).toDateString() === today).length;

  async function handleResolve(id) {
    await conflictsApi.resolve(id, resolution);
    setResolvingId(null);
    setResolution("");
    load();
  }

  async function handleSimulateFailure(requestId) {
    await blockRequestsApi.fail(requestId);
    load();
  }

  return (
    <DashboardLayout title="Control Center">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending Requests" value={actionable.length} />
        <StatCard label="Open Conflicts" value={conflicts.length} />
        <StatCard label="Today's Blocks" value={todaysBlocks} />
        <StatCard label="Upcoming Blocks" value={scheduled.length} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="font-medium text-slate-900 mb-3">Request Queue</h2>
          {loading && <p className="text-sm text-slate-500">Loading...</p>}
          {!loading && actionable.length === 0 && <p className="text-sm text-slate-500">No pending requests.</p>}
          <div className="space-y-3">
            {actionable.map((r) => (
              <ControlRequestCard key={r._id} request={r} onChanged={load} />
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="font-medium text-slate-900 mb-3">Conflicts</h2>
          {!loading && conflicts.length === 0 && <p className="text-sm text-slate-500">No open conflicts.</p>}
          <div className="space-y-3">
            {conflicts.map((c) => (
              <div key={c._id} className="border border-slate-200 rounded p-2 text-sm">
                <p className="font-medium text-slate-900">{c.section?.name}</p>
                <p className="text-xs text-slate-500">{c.description}</p>
                <div className="mt-1 space-y-0.5">
                  {c.requests.map((r) => (
                    <p key={r._id} className="text-xs text-slate-600">
                      {r.requestNumber} - {r.workType} ({r.status})
                    </p>
                  ))}
                </div>

                {resolvingId === c._id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      placeholder="Resolution note"
                      className="flex-1 text-xs rounded border border-slate-300 px-2 py-1"
                    />
                    <button
                      onClick={() => handleResolve(c._id)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded px-2 py-1"
                    >
                      Confirm
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setResolvingId(c._id)}
                    className="mt-2 text-xs text-blue-600 hover:underline"
                  >
                    Mark resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <h2 className="font-medium text-slate-900 mb-3">Schedule Timeline</h2>
        {scheduled.length === 0 ? (
          <p className="text-sm text-slate-500">No schedules published yet.</p>
        ) : (
          <div className="space-y-2">
            {scheduled.map((s) => (
              <div key={s._id} className="flex items-center justify-between border border-slate-100 rounded p-2 text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    {s.request?.requestNumber} - {s.request?.workType} ({s.section?.name})
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(s.startTime).toLocaleString()} - {new Date(s.endTime).toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={() => handleSimulateFailure(s.request._id)}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded px-2 py-1 shrink-0"
                >
                  Simulate Failure
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
        <h2 className="font-medium text-slate-900 mb-3">Day Simulation</h2>
        <SimulationPanel />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-medium text-slate-900 mb-3">Notifications</h2>
        <NotificationsPanel />
      </div>
    </DashboardLayout>
  );
}
