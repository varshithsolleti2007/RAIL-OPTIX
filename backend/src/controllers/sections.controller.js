import RailwaySection from "../models/RailwaySection.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listSections = asyncHandler(async (req, res) => {
  const sections = await RailwaySection.find().sort({ name: 1 });
  res.json({ success: true, message: "OK", code: "OK", data: { sections } });
});

export const createSection = asyncHandler(async (req, res) => {
  const { name, corridorId, description } = req.body;

  if (!name) {
    throw new ApiError(400, "name is required.", "VALIDATION_ERROR");
  }

  const section = await RailwaySection.create({ name, corridorId, description });
  res.status(201).json({ success: true, message: "Section created.", code: "CREATED", data: { section } });
});

export const updateSection = asyncHandler(async (req, res) => {
  const section = await RailwaySection.findByIdAndUpdate(req.params.id, req.body, {
    returnDocument: "after",
    runValidators: true,
  });

  if (!section) {
    throw new ApiError(404, "Section not found.", "NOT_FOUND");
  }

  res.json({ success: true, message: "Section updated.", code: "OK", data: { section } });
});
