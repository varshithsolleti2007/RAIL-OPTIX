import { useEffect, useState } from "react";
import { mlApi, sectionsApi } from "../api/resources";
import { Badge, Button, SelectField, TextField } from "./ui";

const SIM_STATUS_BADGE = {
  Completed: "success",
  Delayed: "warning",
  "Requires Replanning": "danger",
  Blocked: "danger",
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
      <p className="mb-3 text-xs text-steel">
        Replays every active request on a section's day, sequentially, against its real operating-hours close.
        Shows whether the plan holds up or a delay/overflow would force replanning.
      </p>

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <SelectField label="Section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          {sections.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </SelectField>
        <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button variant="secondary" disabled={loading || !sectionId} onClick={handleRun}>
          {loading ? "Running..." : "Run Simulation"}
        </Button>
      </div>

      {error && <p className="mb-2 text-xs text-danger">{error}</p>}

      {result && result.results.length === 0 && (
        <p className="text-sm text-steel">
          No active requests on {result.section} for {result.date}.
        </p>
      )}

      {result && result.results.length > 0 && (
        <div className="overflow-x-auto">
          <p className="mb-2 text-xs text-steel">
            {result.section} · {result.date} · window capacity from first booking to close: {result.capacityMinutes} min
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-xs text-steel">
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
                <tr key={r.requestNumber} className="border-b border-hairline-soft">
                  <td className="py-2 pr-4 font-medium text-ink">
                    {r.requestNumber}
                    <div className="text-xs font-normal text-steel">{r.workType}</div>
                  </td>
                  <td className="py-2 pr-4 text-slate">{r.department}</td>
                  <td className="py-2 pr-4 whitespace-nowrap text-xs text-slate">
                    {new Date(r.plannedStart).toLocaleTimeString()} - {new Date(r.plannedEnd).toLocaleTimeString()}
                  </td>
                  <td className="py-2 pr-4">
                    <Badge variant={SIM_STATUS_BADGE[r.status] || "neutral"}>{r.status}</Badge>
                  </td>
                  <td className="py-2 pr-4 text-slate">{r.delay_minutes > 0 ? `${r.delay_minutes} min` : "-"}</td>
                  <td className="py-2 pr-4 text-xs text-steel">{r.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
