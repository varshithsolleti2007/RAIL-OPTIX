import mongoose from "mongoose";

export const NOTIFICATION_TYPES = [
  "REQUEST_SUBMITTED",
  "REQUEST_APPROVED",
  "REQUEST_REJECTED",
  "REQUEST_RESCHEDULED",
  "SCHEDULE_PUBLISHED",
  "CONFLICT_DETECTED",
  "RECOVERY_NEEDED",
  "GENERAL",
];

const notificationSchema = new mongoose.Schema(
  {
    // A notification targets a whole department, a specific user, or every
    // user with a given role (e.g. broadcast to all Control Officers).
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String },

    type: { type: String, enum: NOTIFICATION_TYPES, default: "GENERAL" },
    message: { type: String, required: true },
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: "BlockRequest" },

    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
