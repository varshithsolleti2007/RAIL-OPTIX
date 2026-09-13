import { useEffect, useState } from "react";
import { blockRequestsApi, sectionsApi } from "../api/resources";

export default function BlockRequestForm({ workTypes, onCreated }) {
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({
    sectionId: "",
    workType: workTypes[0] || "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    priority: "MEDIUM",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    sectionsApi.list().then(({ sections }) => setSections(sections));
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { request } = await blockRequestsApi.create({
        sectionId: form.sectionId,
        workType: form.workType,
        description: form.description,
        date: form.date,
        startTime: `${form.date}T${form.startTime}:00`,
        endTime: `${form.date}T${form.endTime}:00`,
        priority: form.priority,
      });

      await blockRequestsApi.submit(request._id);
      onCreated();
      setForm((prev) => ({ ...prev, description: "", startTime: "", endTime: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Could not create request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {error && (
        <div className="md:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600">Section</label>
        <select
          required
          value={form.sectionId}
          onChange={(e) => update("sectionId", e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="">Select section</option>
          {sections.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Work Type</label>
        <select
          value={form.workType}
          onChange={(e) => update("workType", e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          {workTypes.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-xs font-medium text-slate-600">Description</label>
        <input
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Date</label>
        <input
          type="date"
          required
          value={form.date}
          onChange={(e) => update("date", e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Priority</label>
        <select
          value={form.priority}
          onChange={(e) => update("priority", e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">Start Time</label>
        <input
          type="time"
          required
          value={form.startTime}
          onChange={(e) => update("startTime", e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600">End Time</label>
        <input
          type="time"
          required
          value={form.endTime}
          onChange={(e) => update("endTime", e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
        />
      </div>

      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded px-4 py-2 text-sm font-medium"
        >
          {submitting ? "Submitting..." : "Create & Submit Request"}
        </button>
      </div>
    </form>
  );
}
