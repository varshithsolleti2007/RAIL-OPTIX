import { useState } from "react";
import { blockRequestsApi } from "../api/resources";
import { Badge, Button, STATUS_BADGE } from "./ui";

export default function BlockRequestsList({ requests, loading, onChanged }) {
  const [submittingId, setSubmittingId] = useState(null);

  async function handleSubmit(id) {
    setSubmittingId(id);
    try {
      await blockRequestsApi.submit(id);
      onChanged?.();
    } finally {
      setSubmittingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-steel">Loading requests...</p>;
  }

  if (requests.length === 0) {
    return <p className="text-sm text-steel">No requests yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-hairline text-left text-xs text-steel">
            <th className="py-2 pr-4">Request</th>
            <th className="py-2 pr-4">Work Type</th>
            <th className="py-2 pr-4">Section</th>
            <th className="py-2 pr-4">When</th>
            <th className="py-2 pr-4">Priority</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r._id} className="border-b border-hairline-soft">
              <td className="py-2 pr-4 font-medium text-ink">{r.requestNumber}</td>
              <td className="py-2 pr-4 text-slate">{r.workType}</td>
              <td className="py-2 pr-4 text-slate">{r.section?.name}</td>
              <td className="py-2 pr-4 whitespace-nowrap text-slate">
                {new Date(r.startTime).toLocaleString()} - {new Date(r.endTime).toLocaleTimeString()}
              </td>
              <td className="py-2 pr-4 text-slate">{r.priority}</td>
              <td className="py-2 pr-4">
                <Badge variant={STATUS_BADGE[r.status] || "neutral"}>{r.status}</Badge>
                {r.status === "REJECTED" && r.rejectionReason && (
                  <p className="mt-0.5 text-xs text-steel">{r.rejectionReason}</p>
                )}
              </td>
              <td className="py-2 pr-4">
                {r.status === "DRAFT" && (
                  <Button size="xs" disabled={submittingId === r._id} onClick={() => handleSubmit(r._id)}>
                    {submittingId === r._id ? "Submitting..." : "Submit"}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
