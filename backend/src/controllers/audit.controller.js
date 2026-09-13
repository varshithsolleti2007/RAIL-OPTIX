import AuditLog from "../models/AuditLog.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listAuditLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.entityType) filter.entityType = req.query.entityType;
  if (req.query.action) filter.action = req.query.action;

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(200).populate("actor", "name role");

  res.json({ success: true, message: "OK", code: "OK", data: { logs } });
});
