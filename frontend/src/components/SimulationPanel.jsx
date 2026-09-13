import { useEffect, useState } from "react";
import { mlApi, sectionsApi } from "../api/resources";

const STATUS_STYLES = {
  Completed: "bg-green-100 text-green-700",
  Delayed: "bg-amber-100 text-amber-700",
  "Requires Replanning": "bg-red-100 text-red-700",
  Blocked: "bg-red-100 text-red-700",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function SimulationPanel() {
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today());
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    sectionsApi.list().then(({ sections }) => {
      setSections(sections);
      if (sections.length > 0) setSectionId(sections[0]._id);
    });
  }, []);

  async function handleRun() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await mlApi.simulateSectionDay(sectionId, date);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || "Simulation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="text-xs text-slate-500 mb-3">
        Replays every active request on a section's day, sequentially, against its real operating-hours close.
        Shows whether the plan holds up or a delay/overflow would force replanning.
      </p>

      <div className="flex flex-wrap items-end gap-2 mb-3">
        <div>
          <label className="block text-xs font-medium text-slate-600">Section</label>
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="mt-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            {sections.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          onClick={handleRun}
          disabled={loading || !sectionId}
          className="text-sm bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white rounded px-3 py-1.5"
        >
          {loading ? "Running..." : "Run Simulation"}
        </button>
      </div>

      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}

      {result && result.results.length === 0 && (
        <p className="text-sm text-slate-500">No active requests on {result.section} for {result.date}.</p>
      )}

      {result && result.results.length > 0 && (
        <div className="overflow-x-auto">
          <p className="text-xs text-slate-500 mb-2">
            {result.section} · {result.date} · window capacity from first booking to close: {result.capacityMinutes} min
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
                <th className="py-2 pr-4">Request</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Planned</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Delay</th>
                <th className="py-2 pr-4">Reason</th>
              </tr>
            </thead>
            <tbody>
              {result.results.map((r) => (
                <tr key={r.requestNumber} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">
                    {r.requestNumber}
                    <div className="text-xs text-slate-500 font-normal">{r.workType}</div>
                  </td>
                  <td className="py-2 pr-4">{r.department}</td>
                  <td className="py-2 pr-4 whitespace-nowrap text-xs">
                    {new Date(r.plannedStart).toLocaleTimeString()} - {new Date(r.plannedEnd).toLocaleTimeString()}
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLES[r.status] || "bg-slate-100 text-slate-600"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{r.delay_minutes > 0 ? `${r.delay_minutes} min` : "-"}</td>
                  <td className="py-2 pr-4 text-xs text-slate-500">{r.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
