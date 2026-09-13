import BlockRequest, { ACTIVE_STATUSES } from "../models/BlockRequest.js";
import { DAY_END_HOUR } from "../config/operatingHours.js";

// Same calendar day, at the section's daily maintenance-window close
// (DAY_END_HOUR) - the real constraint candidate windows are already
// generated against, not an invented number.
function dayEndFor(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setHours(DAY_END_HOUR, 0, 0, 0);
  return d;
}

// Builds the Intelligence Service's `/simulate` input for one section's
// day: every active request on that section+date, in start-time order,
// sharing one notional "block" whose capacity is however many minutes
// remain between the first request's start and the operational window's
// close. This lets the existing sequential simulator answer a real
// question - "if today's bookings on this section ran slightly long,
// would the delay cascade past another department's window, or past
// the section's daily close?" - without fabricating a capacity number:
// the bound used is the same DAY_END_HOUR that already governs candidate
// window generation.
export async function buildDaySimulation(sectionId, date) {
  const requests = await BlockRequest.find({
    section: sectionId,
    date,
    status: { $in: ACTIVE_STATUSES },
  })
    .sort({ startTime: 1 })
    .select("requestNumber startTime endTime durationMinutes workType department")
    .populate("department", "name");

  if (requests.length === 0) {
    return { tasks: [], byRequestNumber: {} };
  }

  const dayEnd = dayEndFor(date);
  const capacityMinutes = Math.round((dayEnd - requests[0].startTime) / 60000);

  const sharedBlockId = `SECTION-DAY-${sectionId}`;

  const tasks = requests.map((r) => ({
    task_id: r.requestNumber,
    block_id: sharedBlockId,
    planned_start: r.startTime.toISOString(),
    planned_end: r.endTime.toISOString(),
    duration_minutes: r.durationMinutes,
    block_duration_minutes: capacityMinutes,
  }));

  const byRequestNumber = {};
  requests.forEach((r) => {
    byRequestNumber[r.requestNumber] = r;
  });

  return { tasks, byRequestNumber, capacityMinutes };
}
