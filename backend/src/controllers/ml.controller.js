import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getMlMetrics, getRecoveryRecommendation, simulatePlan } from "../services/mlGateway.service.js";

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
