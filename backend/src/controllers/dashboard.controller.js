import BlockRequest from "../models/BlockRequest.js";
import Conflict from "../models/Conflict.js";
import Schedule from "../models/Schedule.js";
import asyncHandler from "../utils/asyncHandler.js";

// "Today" in this app's own date convention: `date` fields are stored as
// UTC midnight of whatever calendar date a date-only input represented
// (see BlockRequest.date / Schedule.date) - so "today" is computed the
// same way, not via the browser's local toDateString().
function todayAsStoredDate() {
  return new Date(new Date().toISOString().slice(0, 10));
}

// GET /api/dashboard/control-metrics  (control/admin)
// One authoritative set of counts, computed here rather than the
// frontend deriving them by filtering full lists client-side.
export const getControlMetrics = asyncHandler(async (req, res) => {
  const today = todayAsStoredDate();
  const now = new Date();

  const [pendingRequests, openConflicts, todaysBlocks, upcomingBlocks, recoveryRequired] = await Promise.all([
    // Pending = awaiting Control action. Never DRAFT (not submitted yet),
    // never SCHEDULED/REJECTED (already decided), never FAILED (that's
    // a disruption needing recovery, not an ordinary pending approval).
    BlockRequest.countDocuments({ status: "SUBMITTED" }),
    Conflict.countDocuments({ status: "OPEN" }),
    // "Today's Blocks": published schedules dated today.
    Schedule.countDocuments({ status: "PUBLISHED", date: today }),
    // "Upcoming Blocks": published schedules that haven't started yet -
    // a real published block in the past is history, not upcoming.
    Schedule.countDocuments({ status: "PUBLISHED", startTime: { $gte: now } }),
    // Disrupted requests awaiting a recovery decision - deliberately not
    // folded into "Pending Requests".
    BlockRequest.countDocuments({ status: "FAILED" }),
  ]);

  res.json({
    success: true,
    message: "OK",
    code: "OK",
    data: { pendingRequests, openConflicts, todaysBlocks, upcomingBlocks, recoveryRequired },
  });
});
