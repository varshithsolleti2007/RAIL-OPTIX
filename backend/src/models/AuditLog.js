import mongoose from "mongoose";

export const AUDIT_ACTIONS = [
  "CREATE",
  "UPDATE",
  "SUBMIT",
  "APPROVE",
  "REJECT",
  "RESCHEDULE",
  "PUBLISH",
  "RESOLVE_CONFLICT",
  "CANCEL",
  "COMPLETE",
  "FAIL",
];

const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: AUDIT_ACTIONS, required: true },
    entityType: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
