import mongoose from "mongoose";

export const SCHEDULE_STATUSES = ["PUBLISHED", "IN_PROGRESS", "COMPLETED", "FAILED", "CANCELLED"];

const scheduleSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: "BlockRequest", required: true, unique: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "RailwaySection", required: true },

    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    status: { type: String, enum: SCHEDULE_STATUSES, default: "PUBLISHED" },

    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    approvalTimestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("Schedule", scheduleSchema);
