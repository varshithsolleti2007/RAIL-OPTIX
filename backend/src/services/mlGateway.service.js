import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const client = axios.create({ baseURL: ML_SERVICE_URL, timeout: 5000 });

// Calls the Python Intelligence Service for ranked scheduling
// recommendations (CLAUDE_CODE_PROJECT_CONTEXT.md §16/§25). Node is the
// gateway - the browser never calls this service directly.
//
// Returns { available: true, recommendations, modelVersion } on success,
// or { available: false, recommendations: [] } if the service is
// unreachable or returns an error - callers must fall back to the
// deterministic candidate windows and clearly mark ML as unavailable.
// Generic passthrough helper for the remaining Intelligence Service
// endpoints (§40 - Node owns ML integration, never duplicates the algorithm).
async function callMlService(path, body) {
  try {
    const { data } = await client.post(path, body);
    return { available: true, data };
  } catch (error) {
    console.error(`Intelligence Service call to ${path} failed:`, error.message);
    return { available: false, data: null };
  }
}

export function simulatePlan({ tasks, failedBlockId }) {
  return callMlService("/api/simulate", { tasks, failed_block_id: failedBlockId ?? null });
}

export function getRecoveryRecommendation({ tasks, availableBlocks, failedBlockIds }) {
  return callMlService("/api/recovery/recommend", {
    tasks,
    available_blocks: availableBlocks,
    failed_block_ids: failedBlockIds,
  });
}

export async function getMlMetrics() {
  try {
    const { data } = await client.get("/api/metrics");
    return { available: true, data };
  } catch (error) {
    console.error("Intelligence Service metrics call failed:", error.message);
    return { available: false, data: null };
  }
}

export async function getScheduleRecommendation({ request, candidateWindows, existingBookings }) {
  try {
    const { data } = await client.post("/api/schedule/recommend", {
      requestId: request._id.toString(),
      sectionId: request.section.toString(),
      priority: request.priority,
      durationMinutes: request.durationMinutes,
      candidateWindows: candidateWindows.map((w) => ({
        startTime: w.startTime.toISOString(),
        endTime: w.endTime.toISOString(),
      })),
      existingBookings: existingBookings.map((b) => ({
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
      })),
    });

    return { available: true, recommendations: data.recommendations, modelVersion: data.modelVersion };
  } catch (error) {
    console.error("Intelligence Service unavailable:", error.message);
    return { available: false, recommendations: [], modelVersion: null };
  }
}
