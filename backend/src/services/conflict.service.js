import BlockRequest, { ACTIVE_STATUSES } from "../models/BlockRequest.js";
import Conflict from "../models/Conflict.js";

function timesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function sharesResource(a, b) {
  const setA = new Set(a.requiredResources || []);
  return (b.requiredResources || []).some((resource) => setA.has(resource));
}

function severityFor(requestA, requestB) {
  if (requestA.priority === "URGENT" || requestB.priority === "URGENT") return "HIGH";
  if (requestA.priority === "HIGH" || requestB.priority === "HIGH") return "MEDIUM";
  return "LOW";
}

// Compares `request` against every other active request and creates/updates
// OPEN conflict records. See CLAUDE_CODE_PROJECT_CONTEXT.md §13 - basic
// time-overlap condition: A.start < B.end AND B.start < A.end.
export async function detectConflictsForRequest(request) {
  const candidates = await BlockRequest.find({
    _id: { $ne: request._id },
    status: { $in: ACTIVE_STATUSES },
    $or: [{ section: request.section }, { requiredResources: { $in: request.requiredResources || [] } }],
  });

  const createdConflicts = [];

  for (const other of candidates) {
    if (!timesOverlap(request.startTime, request.endTime, other.startTime, other.endTime)) {
      continue;
    }

    const sameSection = String(other.section) === String(request.section);
    const resourceOverlap = sharesResource(request, other);

    if (!sameSection && !resourceOverlap) {
      continue;
    }

    const requestIds = [request._id, other._id].sort();

    const existing = await Conflict.findOne({
      status: "OPEN",
      requests: { $all: requestIds, $size: 2 },
    });

    if (existing) {
      continue;
    }

    const conflictType = sameSection ? "TIME_OVERLAP" : "RESOURCE_OVERLAP";

    const conflict = await Conflict.create({
      requests: requestIds,
      section: request.section,
      conflictType,
      severity: severityFor(request, other),
      description: `${request.requestNumber} overlaps with ${other.requestNumber} (${conflictType.replace("_", " ").toLowerCase()}).`,
      status: "OPEN",
    });

    createdConflicts.push(conflict);
  }

  return createdConflicts;
}

export async function resolveConflict(conflictId, { resolvedBy, resolution }) {
  const conflict = await Conflict.findById(conflictId);

  if (!conflict) {
    return null;
  }

  conflict.status = "RESOLVED";
  conflict.resolvedBy = resolvedBy;
  conflict.resolution = resolution;
  conflict.resolvedAt = new Date();

  await conflict.save();
  return conflict;
}
