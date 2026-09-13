import mongoose from "mongoose";

export const CONFLICT_TYPES = ["TIME_OVERLAP", "RESOURCE_OVERLAP"];
export const SEVERITIES = ["LOW", "MEDIUM", "HIGH"];
export const CONFLICT_STATUSES = ["OPEN", "RESOLVED"];

const conflictSchema = new mongoose.Schema(
  {
    requests: [{ type: mongoose.Schema.Types.ObjectId, ref: "BlockRequest", required: true }],
    section: { type: mongoose.Schema.Types.ObjectId, ref: "RailwaySection", required: true },

    conflictType: { type: String, enum: CONFLICT_TYPES, required: true },
    severity: { type: String, enum: SEVERITIES, default: "MEDIUM" },
    description: { type: String, required: true },

    status: { type: String, enum: CONFLICT_STATUSES, default: "OPEN" },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolution: String,
    resolvedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Conflict", conflictSchema);
