import { useEffect, useState } from "react";
import { blockRequestsApi, sectionsApi } from "../api/resources";
import { Button, SelectField, TextField } from "./ui";

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
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {error && (
        <div className="rounded-input border border-danger/20 bg-danger-bg px-3 py-2 text-sm text-danger md:col-span-2">
          {error}
        </div>
      )}

      <SelectField label="Section" required value={form.sectionId} onChange={(e) => update("sectionId", e.target.value)}>
        <option value="">Select section</option>
        {sections.map((s) => (
          <option key={s._id} value={s._id}>
            {s.name}
          </option>
        ))}
      </SelectField>

      <SelectField label="Work Type" value={form.workType} onChange={(e) => update("workType", e.target.value)}>
        {workTypes.map((w) => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </SelectField>

      <div className="md:col-span-2">
        <TextField label="Description" value={form.description} onChange={(e) => update("description", e.target.value)} />
      </div>

      <TextField label="Date" type="date" required value={form.date} onChange={(e) => update("date", e.target.value)} />

      <SelectField label="Priority" value={form.priority} onChange={(e) => update("priority", e.target.value)}>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent</option>
      </SelectField>

      <TextField
        label="Start Time"
        type="time"
        required
        value={form.startTime}
        onChange={(e) => update("startTime", e.target.value)}
      />

      <TextField
        label="End Time"
        type="time"
        required
        value={form.endTime}
        onChange={(e) => update("endTime", e.target.value)}
      />

      <div className="md:col-span-2">
        <Button type="submit" variant="primary" disabled={submitting}>
          {submitting ? "Submitting..." : "Create & Submit Request"}
        </Button>
      </div>
    </form>
  );
}
