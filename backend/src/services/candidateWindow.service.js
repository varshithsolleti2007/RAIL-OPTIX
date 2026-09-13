import BlockRequest, { ACTIVE_STATUSES } from "../models/BlockRequest.js";

const DAY_START_HOUR = 6;
const DAY_END_HOUR = 22;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Establishes the basic feasible scheduling problem before the Intelligence
// Service is consulted (CLAUDE_CODE_PROJECT_CONTEXT.md §15). Scans the
// operational day for gaps, on the same section, big enough for the
// requested duration, that don't overlap any other active request.
export async function generateCandidateWindows(request, { limit = 3 } = {}) {
  const dayStart = startOfDay(request.date);
  const windowStart = new Date(dayStart);
  windowStart.setHours(DAY_START_HOUR, 0, 0, 0);
  const windowEnd = new Date(dayStart);
  windowEnd.setHours(DAY_END_HOUR, 0, 0, 0);

  // Query by the request's own stored `date` value, not the recomputed
  // `dayStart` - `date` is stored as UTC midnight (from a date-only input)
  // while `dayStart` is derived via local-timezone setHours(), so on a
  // non-UTC server the two are different instants and would never match.
  const others = await BlockRequest.find({
    _id: { $ne: request._id },
    section: request.section,
    status: { $in: ACTIVE_STATUSES },
    date: request.date,
  }).sort({ startTime: 1 });

  const busy = others.map((r) => ({ start: r.startTime, end: r.endTime }));
  const durationMs = request.durationMinutes * 60 * 1000;

  const candidates = [];
  let cursor = windowStart;

  for (const slot of [...busy, { start: windowEnd, end: windowEnd }]) {
    const gapMs = slot.start - cursor;

    if (gapMs >= durationMs) {
      candidates.push({ startTime: new Date(cursor), endTime: new Date(cursor.getTime() + durationMs) });
    }

    if (slot.end > cursor) {
      cursor = slot.end;
    }

    if (candidates.length >= limit) break;
  }

  return candidates.slice(0, limit);
}
