import { useState } from "react";
import { blockRequestsApi } from "../api/resources";
import { Badge, Button, STATUS_BADGE, TextField } from "./ui";

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
    <div className="rounded-input border border-hairline-soft p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">
            {request.requestNumber} - {request.workType}
          </p>
          <p className="text-xs text-steel">
            {request.department?.name} - {request.section?.name} - {request.priority}
          </p>
          <p className="text-xs text-steel">
            Requested: {fmt(request.startTime)} - {fmt(request.endTime)}
          </p>
        </div>
        <Badge variant={STATUS_BADGE[request.status] || "neutral"} className="shrink-0">
          {request.status}
        </Badge>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}

      {recommendation ? (
        <div className="mt-3 rounded-input border border-brand-blue/20 bg-blue-light p-2.5 text-xs text-charcoal">
          <p className="font-semibold text-brand-blue">AI Recommendation ({recommendation.modelVersion})</p>
          <p className="mt-0.5">
            {fmt(recommendation.startTime)} - {fmt(recommendation.endTime)}
          </p>
          <p className="mt-0.5">
            Conflict: {recommendation.conflictScore} · Disruption: {recommendation.disruptionScore} · Confidence:{" "}
            {Math.round(recommendation.confidence * 100)}%
          </p>
          <p className="mt-1 italic text-steel">{recommendation.reason}</p>
        </div>
      ) : (
        <Button variant="ghost" size="xs" className="mt-3 border border-hairline" disabled={loading} onClick={handleRecommend}>
          Get AI Recommendation
        </Button>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="xs" disabled={loading} onClick={handleAccept}>
          {recommendation ? "Accept Recommendation" : "Approve As Requested"}
        </Button>
        {recommendation && (
          <Button
            variant="secondary"
            size="xs"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                await blockRequestsApi.approve(request._id);
                onChanged();
              } finally {
                setLoading(false);
              }
            }}
          >
            Approve Original Instead
          </Button>
        )}
        <Button variant="danger" size="xs" onClick={() => setShowReject((s) => !s)}>
          Reject
        </Button>
      </div>

      {showReject && (
        <div className="mt-2 flex gap-2">
          <TextField
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection"
            className="flex-1 text-xs"
          />
          <Button variant="danger" size="xs" disabled={loading} onClick={handleReject}>
            Confirm Reject
          </Button>
        </div>
      )}
    </div>
  );
}
