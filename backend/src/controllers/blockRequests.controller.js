import BlockRequest, { ACTIVE_STATUSES, PRIORITIES } from "../models/BlockRequest.js";
import Schedule from "../models/Schedule.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { detectConflictsForRequest } from "../services/conflict.service.js";
import { generateCandidateWindows } from "../services/candidateWindow.service.js";
import { getScheduleRecommendation } from "../services/mlGateway.service.js";
import { notifyDepartment, notifyRole } from "../services/notification.service.js";
import { recordAudit } from "../services/audit.service.js";
import { atomicTransition, POPULATE } from "../services/blockRequestState.service.js";

function computeDuration(startTime, endTime) {
  return Math.round((new Date(endTime) - new Date(startTime)) / 60000);
}

// POST /api/block-requests
export const createBlockRequest = asyncHandler(async (req, res) => {
  const { sectionId, workType, description, date, startTime, endTime, priority, requiredResources, constraints } =
    req.body;

  if (!sectionId || !workType || !date || !startTime || !endTime) {
    throw new ApiError(400, "sectionId, workType, date, startTime and endTime are required.", "VALIDATION_ERROR");
  }

  if (new Date(startTime) >= new Date(endTime)) {
    throw new ApiError(400, "startTime must be before endTime.", "VALIDATION_ERROR");
  }

  if (priority && !PRIORITIES.includes(priority)) {
    throw new ApiError(400, `priority must be one of: ${PRIORITIES.join(", ")}`, "VALIDATION_ERROR");
  }

  const request = await BlockRequest.create({
    department: req.user.department,
    requestedBy: req.user.id,
    section: sectionId,
    workType,
    description,
    date,
    startTime,
    endTime,
    durationMinutes: computeDuration(startTime, endTime),
    priority: priority || "MEDIUM",
    requiredResources: requiredResources || [],
    constraints: constraints || [],
    status: "DRAFT",
  });

  await recordAudit({ actor: req.user.id, action: "CREATE", entityType: "BlockRequest", entityId: request._id, after: request.toObject() });

  res.status(201).json({ success: true, message: "Block request created.", code: "CREATED", data: { request } });
});

// GET /api/block-requests
export const listBlockRequests = asyncHandler(async (req, res) => {
  const filter = {};

  // Department roles only ever see their own requests. Control/Admin see all.
  if (["engineering", "electrical", "snt"].includes(req.user.role)) {
    filter.department = req.user.department;
  }

  if (req.query.status) {
    filter.status = req.query.status;
  }

  const requests = await BlockRequest.find(filter).sort({ createdAt: -1 }).populate(POPULATE);
  res.json({ success: true, message: "OK", code: "OK", data: { requests } });
});

// GET /api/block-requests/:id
export const getBlockRequest = asyncHandler(async (req, res) => {
  const request = await BlockRequest.findById(req.params.id).populate(POPULATE);

  if (!request) {
    throw new ApiError(404, "Block request not found.", "NOT_FOUND");
  }

  if (
    ["engineering", "electrical", "snt"].includes(req.user.role) &&
    String(request.department._id || request.department) !== String(req.user.department)
  ) {
    throw new ApiError(403, "You cannot view another department's request.", "FORBIDDEN");
  }

  res.json({ success: true, message: "OK", code: "OK", data: { request } });
});

// PUT /api/block-requests/:id  (owner, DRAFT only)
export const updateBlockRequest = asyncHandler(async (req, res) => {
  const request = await BlockRequest.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, "Block request not found.", "NOT_FOUND");
  }

  if (String(request.requestedBy) !== String(req.user.id)) {
    throw new ApiError(403, "You can only edit your own request.", "FORBIDDEN");
  }

  if (request.status !== "DRAFT") {
    throw new ApiError(409, "Only DRAFT requests can be edited.", "INVALID_STATE");
  }

  const editable = ["workType", "description", "date", "startTime", "endTime", "priority", "requiredResources", "constraints", "section"];
  const before = request.toObject();

  for (const field of editable) {
    if (req.body[field] !== undefined) {
      request[field] = field === "section" ? req.body.sectionId ?? request.section : req.body[field];
    }
  }
  if (req.body.sectionId) request.section = req.body.sectionId;

  if (req.body.startTime || req.body.endTime) {
    request.durationMinutes = computeDuration(request.startTime, request.endTime);
  }

  await request.save();
  await recordAudit({ actor: req.user.id, action: "UPDATE", entityType: "BlockRequest", entityId: request._id, before, after: request.toObject() });

  res.json({ success: true, message: "Request updated.", code: "OK", data: { request } });
});

// POST /api/block-requests/:id/submit  (owner)
export const submitBlockRequest = asyncHandler(async (req, res) => {
  const existing = await BlockRequest.findById(req.params.id);

  if (!existing) {
    throw new ApiError(404, "Block request not found.", "NOT_FOUND");
  }

  if (String(existing.requestedBy) !== String(req.user.id)) {
    throw new ApiError(403, "You can only submit your own request.", "FORBIDDEN");
  }

  const updated = await atomicTransition(req.params.id, ["DRAFT"], { status: "SUBMITTED" });

  if (!updated) {
    // Another call (double-click, retry) already submitted it - or it
    // was never a DRAFT to begin with. Report current state, do nothing else.
    const current = await BlockRequest.findById(req.params.id).populate(POPULATE);
    return res.json({
      success: true,
      message: `Request is already ${current.status}; nothing to submit.`,
      code: "OK",
      data: { request: current, idempotent: true, conflictsDetected: 0 },
    });
  }

  const conflicts = await detectConflictsForRequest(updated);

  await recordAudit({ actor: req.user.id, action: "SUBMIT", entityType: "BlockRequest", entityId: updated._id, after: updated.toObject() });
  await notifyRole("control", {
    type: "REQUEST_SUBMITTED",
    message: `${updated.requestNumber} (${updated.workType}) submitted for review.`,
    relatedRequest: updated._id,
  });

  res.json({
    success: true,
    message: "Request submitted.",
    code: "OK",
    data: { request: updated, conflictsDetected: conflicts.length },
  });
});

// POST /api/block-requests/:id/recommend  (control)
// Establishes candidate windows deterministically, then asks the
// Intelligence Service to score/rank them (§15-§16). Never auto-applies.
export const recommendForBlockRequest = asyncHandler(async (req, res) => {
  const request = await BlockRequest.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, "Block request not found.", "NOT_FOUND");
  }

  const candidateWindows = await generateCandidateWindows(request);

  const existingBookings = await BlockRequest.find({
    _id: { $ne: request._id },
    section: request.section,
    status: { $in: ACTIVE_STATUSES },
    date: request.date,
  }).select("startTime endTime");

  if (candidateWindows.length === 0) {
    return res.json({
      success: true,
      message: "No feasible candidate windows found for this section/day.",
      code: "OK",
      data: { available: false, recommendations: [], modelVersion: null },
    });
  }

  const result = await getScheduleRecommendation({ request, candidateWindows, existingBookings });

  if (result.available && result.recommendations?.length) {
    request.recommendation = { ...result.recommendations[0], modelVersion: result.modelVersion, generatedAt: new Date() };
    await request.save();
  }

  res.json({ success: true, message: "OK", code: "OK", data: result });
});

// POST /api/block-requests/:id/approve  (control)
// body: { startTime?, endTime? } - omit to approve the originally requested window.
export const approveBlockRequest = asyncHandler(async (req, res) => {
  const existing = await BlockRequest.findById(req.params.id);

  if (!existing) {
    throw new ApiError(404, "Block request not found.", "NOT_FOUND");
  }

  const timeUpdate = {};

  if (req.body.startTime) timeUpdate.startTime = req.body.startTime;
  if (req.body.endTime) timeUpdate.endTime = req.body.endTime;

  if (timeUpdate.startTime || timeUpdate.endTime) {
    timeUpdate.durationMinutes = computeDuration(
      timeUpdate.startTime || existing.startTime,
      timeUpdate.endTime || existing.endTime
    );
  }

  const updated = await atomicTransition(req.params.id, ["SUBMITTED", "APPROVED", "FAILED"], {
    status: "SCHEDULED",
    ...timeUpdate,
  });

  if (!updated) {
    const current = await BlockRequest.findById(req.params.id).populate(POPULATE);
    return res.json({
      success: true,
      message: `Request is already ${current.status}; nothing to approve.`,
      code: "OK",
      data: { request: current, idempotent: true },
    });
  }

  const schedule = await Schedule.findOneAndUpdate(
    { request: updated._id },
    {
      request: updated._id,
      section: updated.section,
      date: updated.date,
      startTime: updated.startTime,
      endTime: updated.endTime,
      status: "PUBLISHED",
      approvedBy: req.user.id,
      approvalTimestamp: new Date(),
    },
    { upsert: true, returnDocument: "after" }
  );

  await recordAudit({
    actor: req.user.id,
    action: "APPROVE",
    entityType: "BlockRequest",
    entityId: updated._id,
    before: existing.toObject(),
    after: updated.toObject(),
  });

  await notifyDepartment(updated.department, {
    type: "SCHEDULE_PUBLISHED",
    message: `${updated.requestNumber} approved and scheduled for ${updated.startTime.toISOString()} - ${updated.endTime.toISOString()}.`,
    relatedRequest: updated._id,
  });

  res.json({ success: true, message: "Request approved and scheduled.", code: "OK", data: { request: updated, schedule } });
});

// POST /api/block-requests/:id/reject  (control)
export const rejectBlockRequest = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const existing = await BlockRequest.findById(req.params.id);

  if (!existing) {
    throw new ApiError(404, "Block request not found.", "NOT_FOUND");
  }

  const updated = await atomicTransition(req.params.id, ["SUBMITTED"], {
    status: "REJECTED",
    rejectionReason: reason || "",
  });

  if (!updated) {
    const current = await BlockRequest.findById(req.params.id).populate(POPULATE);
    return res.json({
      success: true,
      message: `Request is already ${current.status}; nothing to reject.`,
      code: "OK",
      data: { request: current, idempotent: true },
    });
  }

  await recordAudit({ actor: req.user.id, action: "REJECT", entityType: "BlockRequest", entityId: updated._id, before: existing.toObject(), after: updated.toObject() });
  await notifyDepartment(updated.department, {
    type: "REQUEST_REJECTED",
    message: `${updated.requestNumber} was rejected.${reason ? ` Reason: ${reason}` : ""}`,
    relatedRequest: updated._id,
  });

  res.json({ success: true, message: "Request rejected.", code: "OK", data: { request: updated } });
});

// POST /api/block-requests/:id/reschedule  (control)
export const rescheduleBlockRequest = asyncHandler(async (req, res) => {
  const { startTime, endTime } = req.body;

  if (!startTime || !endTime) {
    throw new ApiError(400, "startTime and endTime are required.", "VALIDATION_ERROR");
  }

  const request = await BlockRequest.findById(req.params.id);

  if (!request) {
    throw new ApiError(404, "Block request not found.", "NOT_FOUND");
  }

  if (!["APPROVED", "SCHEDULED", "SUBMITTED"].includes(request.status)) {
    throw new ApiError(409, "This request cannot be rescheduled from its current state.", "INVALID_STATE");
  }

  const before = request.toObject();
  request.startTime = startTime;
  request.endTime = endTime;
  request.durationMinutes = computeDuration(startTime, endTime);
  await request.save();

  const conflicts = await detectConflictsForRequest(request);

  if (request.status === "SCHEDULED") {
    await Schedule.findOneAndUpdate(
      { request: request._id },
      { startTime: request.startTime, endTime: request.endTime }
    );
  }

  await recordAudit({
    actor: req.user.id,
    action: "RESCHEDULE",
    entityType: "BlockRequest",
    entityId: request._id,
    before,
    after: request.toObject(),
    metadata: { old: { startTime: before.startTime, endTime: before.endTime }, new: { startTime, endTime } },
  });

  await notifyDepartment(request.department, {
    type: "REQUEST_RESCHEDULED",
    message: `${request.requestNumber} was rescheduled.`,
    relatedRequest: request._id,
  });

  res.json({ success: true, message: "Request rescheduled.", code: "OK", data: { request, conflictsDetected: conflicts.length } });
});

// POST /api/block-requests/:id/fail  (control)
// Simulates a disruption to an already-scheduled block
// (CLAUDE_CODE_PROJECT_CONTEXT.md §21/§22). Marks the request FAILED, then
// immediately re-runs the same candidate-window + Intelligence Service
// recommendation pathway used for initial scheduling to produce a
// recovery recommendation. Never auto-applies - Control Officer still
// has to call /approve on the outcome.
export const failBlockRequest = asyncHandler(async (req, res) => {
  const existing = await BlockRequest.findById(req.params.id);

  if (!existing) {
    throw new ApiError(404, "Block request not found.", "NOT_FOUND");
  }

  // The atomic guard: only the call that actually flips SCHEDULED->FAILED
  // proceeds to create the audit entry, the notifications, and to call
  // the Intelligence Service. A second concurrent call (double-click,
  // retry, duplicate request) will not match this filter and gets `null`
  // back instead of racing past the same check.
  const updated = await atomicTransition(req.params.id, ["SCHEDULED"], { status: "FAILED" });

  if (!updated) {
    const current = await BlockRequest.findById(req.params.id).populate(POPULATE);

    if (current.status === "FAILED") {
      return res.json({
        success: true,
        message: "Already failed - recovery already pending.",
        code: "OK",
        data: {
          request: current,
          idempotent: true,
          recovery: current.recommendation
            ? {
                available: true,
                recommendations: [current.recommendation],
                modelVersion: current.recommendation.modelVersion,
              }
            : { available: false, recommendations: [], modelVersion: null },
        },
      });
    }

    throw new ApiError(
      409,
      `Only a SCHEDULED request can be marked as failed (current status: ${current.status}).`,
      "INVALID_STATE"
    );
  }

  await Schedule.findOneAndUpdate({ request: updated._id }, { status: "FAILED" });

  await recordAudit({ actor: req.user.id, action: "FAIL", entityType: "BlockRequest", entityId: updated._id, before: existing.toObject(), after: updated.toObject() });
  await notifyDepartment(updated.department, {
    type: "RECOVERY_NEEDED",
    message: `${updated.requestNumber} was disrupted and needs a new block window.`,
    relatedRequest: updated._id,
  });
  await notifyRole("control", {
    type: "RECOVERY_NEEDED",
    message: `${updated.requestNumber} was disrupted. Recovery recommendation requested.`,
    relatedRequest: updated._id,
  });

  // Request is now FAILED (no longer ACTIVE), so it no longer occupies its
  // old window - candidate generation naturally finds it free again too.
  const candidateWindows = await generateCandidateWindows(updated);

  if (candidateWindows.length === 0) {
    return res.json({
      success: true,
      message: "Request marked failed. No feasible recovery windows found.",
      code: "OK",
      data: { request: updated, recovery: { available: false, recommendations: [], modelVersion: null } },
    });
  }

  const existingBookings = await BlockRequest.find({
    _id: { $ne: updated._id },
    section: updated.section,
    status: { $in: ACTIVE_STATUSES },
    date: updated.date,
  }).select("startTime endTime");

  const recovery = await getScheduleRecommendation({ request: updated, candidateWindows, existingBookings });

  if (recovery.available && recovery.recommendations?.length) {
    updated.recommendation = { ...recovery.recommendations[0], modelVersion: recovery.modelVersion, generatedAt: new Date() };
    await updated.save();
  }

  res.json({ success: true, message: "Request marked failed. Recovery recommendation generated.", code: "OK", data: { request: updated, recovery } });
});
