import mongoose from "mongoose";

const railwaySectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, // e.g. "KAK-RJY"
    corridorId: { type: String, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("RailwaySection", railwaySectionSchema);
