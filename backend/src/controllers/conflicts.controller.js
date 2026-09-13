import Conflict from "../models/Conflict.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { resolveConflict as resolveConflictService } from "../services/conflict.service.js";
import { recordAudit } from "../services/audit.service.js";

const POPULATE = [
  { path: "requests", select: "requestNumber workType status priority startTime endTime department" },
  { path: "section", select: "name" },
];

export const listConflicts = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const conflicts = await Conflict.find(filter).sort({ createdAt: -1 }).populate(POPULATE);
  res.json({ success: true, message: "OK", code: "OK", data: { conflicts } });
});

export const getConflict = asyncHandler(async (req, res) => {
  const conflict = await Conflict.findById(req.params.id).populate(POPULATE);

  if (!conflict) {
    throw new ApiError(404, "Conflict not found.", "NOT_FOUND");
  }

  res.json({ success: true, message: "OK", code: "OK", data: { conflict } });
});

export const resolveConflict = asyncHandler(async (req, res) => {
  const { resolution } = req.body;

  const conflict = await resolveConflictService(req.params.id, { resolvedBy: req.user.id, resolution });

  if (!conflict) {
    throw new ApiError(404, "Conflict not found.", "NOT_FOUND");
  }

  await recordAudit({ actor: req.user.id, action: "RESOLVE_CONFLICT", entityType: "Conflict", entityId: conflict._id, after: conflict.toObject() });

  res.json({ success: true, message: "Conflict resolved.", code: "OK", data: { conflict } });
});
