import { useState } from "react";
import { blockRequestsApi } from "../api/resources";

function fmt(dt) {
  return new Date(dt).toLocaleString();
}

export default function ControlRequestCard({ request, onChanged }) {
  const [recommendation, setRecommendation] = useState(request.recommendation || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  async function handleRecommend() {
    setLoading(true);
    setError("");
    try {
      const result = await blockRequestsApi.recommend(request._id);
      if (!result.available || !result.recommendations?.length) {
        setError("No recommendation available (Intelligence Service unavailable or no feasible window).");
        return;
      }
      setRecommendation({ ...result.recommendations[0], modelVersion: result.modelVersion });
    } catch (err) {
      setError(err.response?.data?.message || "Could not get recommendation.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept() {
    setLoading(true);
    setError("");
    try {
      if (recommendation) {
        await blockRequestsApi.approve(request._id, {
          startTime: recommendation.startTime,
          endTime: recommendation.endTime,
        });
      } else {
        await blockRequestsApi.approve(request._id);
      }
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || "Could not approve request.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    setError("");
    try {
      await blockRequestsApi.reject(request._id, rejectReason);
      onChanged();
    } catch (err) {
      setError(err.response?.data?.message || "Could not reject request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border border-slate-200 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {request.requestNumber} - {request.workType}
          </p>
          <p className="text-xs text-slate-500">
            {request.department?.name} - {request.section?.name} - {request.priority}
          </p>
          <p className="text-xs text-slate-500">
            Requested: {fmt(request.startTime)} - {fmt(request.endTime)}
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-700 shrink-0">
          {request.status}
        </span>
      </div>

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      {recommendation ? (
        <div className="mt-3 bg-blue-50 border border-blue-100 rounded p-2 text-xs text-slate-700">
          <p className="font-medium text-blue-900">AI Recommendation ({recommendation.modelVersion})</p>
          <p>
            {fmt(recommendation.startTime)} - {fmt(recommendation.endTime)}
          </p>
          <p>
            Conflict: {recommendation.conflictScore} · Disruption: {recommendation.disruptionScore} · Confidence:{" "}
            {Math.round(recommendation.confidence * 100)}%
          </p>
          <p className="italic mt-1">{recommendation.reason}</p>
        </div>
      ) : (
        <button
          onClick={handleRecommend}
          disabled={loading}
          className="mt-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded px-2 py-1"
        >
          Get AI Recommendation
        </button>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded px-3 py-1.5"
        >
          {recommendation ? "Accept Recommendation" : "Approve As Requested"}
        </button>
        {recommendation && (
          <button
            onClick={async () => {
              setLoading(true);
              try {
                await blockRequestsApi.approve(request._id);
                onChanged();
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-800 rounded px-3 py-1.5"
          >
            Approve Original Instead
          </button>
        )}
        <button
          onClick={() => setShowReject((s) => !s)}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded px-3 py-1.5"
        >
          Reject
        </button>
      </div>

      {showReject && (
        <div className="mt-2 flex gap-2">
          <input
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection"
            className="flex-1 text-xs rounded border border-slate-300 px-2 py-1"
          />
          <button
            onClick={handleReject}
            disabled={loading}
            className="text-xs bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1"
          >
            Confirm Reject
          </button>
        </div>
      )}
    </div>
  );
}
