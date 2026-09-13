const STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-600",
  SUBMITTED: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  FAILED: "bg-red-100 text-red-700",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700",
  COMPLETED: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_STYLES[status] || "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

export default function BlockRequestsList({ requests, loading }) {
  if (loading) {
    return <p className="text-sm text-slate-500">Loading requests...</p>;
  }

  if (requests.length === 0) {
    return <p className="text-sm text-slate-500">No requests yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 border-b border-slate-200">
            <th className="py-2 pr-4">Request</th>
            <th className="py-2 pr-4">Work Type</th>
            <th className="py-2 pr-4">Section</th>
            <th className="py-2 pr-4">When</th>
            <th className="py-2 pr-4">Priority</th>
            <th className="py-2 pr-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r._id} className="border-b border-slate-100">
              <td className="py-2 pr-4 font-medium text-slate-900">{r.requestNumber}</td>
              <td className="py-2 pr-4">{r.workType}</td>
              <td className="py-2 pr-4">{r.section?.name}</td>
              <td className="py-2 pr-4 whitespace-nowrap">
                {new Date(r.startTime).toLocaleString()} - {new Date(r.endTime).toLocaleTimeString()}
              </td>
              <td className="py-2 pr-4">{r.priority}</td>
              <td className="py-2 pr-4">
                <StatusBadge status={r.status} />
                {r.status === "REJECTED" && r.rejectionReason && (
                  <p className="text-xs text-slate-500 mt-0.5">{r.rejectionReason}</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
