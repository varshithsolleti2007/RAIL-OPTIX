import mongoose from "mongoose";
import { nextSequence } from "./Counter.js";

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

// See CLAUDE_CODE_PROJECT_CONTEXT.md §10/§26/§28 for the full status flow.
export const STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
];

// Statuses that participate in conflict detection / occupy the section.
export const ACTIVE_STATUSES = ["SUBMITTED", "APPROVED", "SCHEDULED", "IN_PROGRESS"];

const recommendationSchema = new mongoose.Schema(
  {
    startTime: Date,
    endTime: Date,
    conflictScore: Number,
    disruptionScore: Number,
    confidence: Number,
    reason: String,
    modelVersion: String,
    generatedAt: Date,
  },
  { _id: false }
);

const blockRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "RailwaySection", required: true },

    workType: { type: String, required: true, trim: true },
    description: { type: String, trim: true },

    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    durationMinutes: { type: Number, required: true, min: 1 },

    priority: { type: String, enum: PRIORITIES, default: "MEDIUM" },
    requiredResources: { type: [String], default: [] },
    constraints: { type: [String], default: [] },

    status: { type: String, enum: STATUSES, default: "DRAFT" },

    recommendation: recommendationSchema,

    rejectionReason: String,
  },
  { timestamps: true }
);

blockRequestSchema.pre("validate", async function assignRequestNumber() {
  if (!this.requestNumber) {
    const seq = await nextSequence("blockRequest");
    this.requestNumber = `BR-${String(seq).padStart(4, "0")}`;
  }
});

blockRequestSchema.methods.overlaps = function (other) {
  return this.startTime < other.endTime && other.startTime < this.endTime;
};

export default mongoose.model("BlockRequest", blockRequestSchema);
