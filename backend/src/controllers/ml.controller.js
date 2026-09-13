import RailwaySection from "../models/RailwaySection.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getMlMetrics, getRecoveryRecommendation, simulatePlan } from "../services/mlGateway.service.js";
import { buildDaySimulation } from "../services/simulation.service.js";

// These are thin passthroughs to the Intelligence Service's batch
// endpoints (§43). They operate on whatever task/block lists the caller
// supplies - they are not yet wired into a specific BlockRequest UI
// action (that flow uses /block-requests/:id/recommend and /fail
// instead, which fits this app's one-request-per-window data model).
// Useful for Control/Admin what-if / batch analysis.

export const simulate = asyncHandler(async (req, res) => {
  const { tasks, failedBlockId } = req.body;

  if (!Array.isArray(tasks)) {
    throw new ApiError(400, "tasks must be an array.", "VALIDATION_ERROR");
  }

  const result = await simulatePlan({ tasks, failedBlockId });

  if (!result.available) {
    throw new ApiError(503, "Intelligence Service is unavailable.", "ML_SERVICE_UNAVAILABLE");
  }

  res.json({ success: true, message: "OK", code: "OK", data: result.data });
});

// GET /api/ml/simulate/section/:sectionId?date=YYYY-MM-DD
// Builds the day's task list from real scheduled/approved requests on
// that section and replays them sequentially through the Intelligence
// Service - see simulation.service.js for exactly what "block capacity"
// means here (the section's real operating-hours close, not an invented
// number).
export const simulateSectionDay = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;
  const { date } = req.query;

  if (!date) {
    throw new ApiError(400, "date query parameter is required (YYYY-MM-DD).", "VALIDATION_ERROR");
  }

  const section = await RailwaySection.findById(sectionId);

  if (!section) {
    throw new ApiError(404, "Section not found.", "NOT_FOUND");
  }

  const parsedDate = new Date(date);
  const { tasks, byRequestNumber, capacityMinutes } = await buildDaySimulation(sectionId, parsedDate);

  if (tasks.length === 0) {
    return res.json({
      success: true,
      message: "No active requests to simulate on this section/date.",
      code: "OK",
      data: { section: section.name, date, results: [] },
    });
  }

  const result = await simulatePlan({ tasks, failedBlockId: null });

  if (!result.available) {
    throw new ApiError(503, "Intelligence Service is unavailable.", "ML_SERVICE_UNAVAILABLE");
  }

  const results = result.data.results.map((r) => {
    const request = byRequestNumber[r.task_id];
    return {
      ...r,
      requestNumber: r.task_id,
      workType: request?.workType,
      department: request?.department?.name,
      plannedStart: request?.startTime,
      plannedEnd: request?.endTime,
    };
  });

  res.json({
    success: true,
    message: "OK",
    code: "OK",
    data: { section: section.name, date, capacityMinutes, results },
  });
});

export const recoveryRecommend = asyncHandler(async (req, res) => {
  const { tasks, availableBlocks, failedBlockIds } = req.body;

  if (!Array.isArray(tasks) || !Array.isArray(availableBlocks)) {
    throw new ApiError(400, "tasks and availableBlocks must be arrays.", "VALIDATION_ERROR");
  }

  const result = await getRecoveryRecommendation({ tasks, availableBlocks, failedBlockIds: failedBlockIds || [] });

  if (!result.available) {
    throw new ApiError(503, "Intelligence Service is unavailable.", "ML_SERVICE_UNAVAILABLE");
  }

  res.json({ success: true, message: "OK", code: "OK", data: result.data });
});

export const metrics = asyncHandler(async (req, res) => {
  const result = await getMlMetrics();

  if (!result.available) {
    throw new ApiError(503, "Intelligence Service is unavailable.", "ML_SERVICE_UNAVAILABLE");
  }

  res.json({ success: true, message: "OK", code: "OK", data: result.data });
});
