import AuditLog from "../models/AuditLog.js";

export async function recordAudit({ actor, action, entityType, entityId, before, after, metadata }) {
  return AuditLog.create({ actor, action, entityType, entityId, before, after, metadata });
}
