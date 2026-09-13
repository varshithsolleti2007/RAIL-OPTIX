"""
Ranks feasible candidate windows for a single block request.

The Node backend already excludes windows that literally overlap another
active request (CLAUDE_CODE_PROJECT_CONTEXT.md §15) before calling this
service, so `candidateWindows` here are all individually feasible. This
module's job is to RANK them - conflictScore reflects residual proximity
risk to other bookings, disruptionScore reflects operational peak-hour
impact. Every number returned is actually computed here; nothing is
invented (§46/§52.10).
"""

from datetime import datetime

MODEL_VERSION = "v1"

PEAK_WINDOWS = [(8, 11), (17, 20)]
PROXIMITY_BUFFER_MINUTES = 60


def _peak_overlap_fraction(start: datetime, end: datetime) -> float:
    total_minutes = (end - start).total_seconds() / 60
    if total_minutes <= 0:
        return 0.0

    overlap_minutes = 0.0

    for peak_start_hour, peak_end_hour in PEAK_WINDOWS:
        peak_start = start.replace(hour=peak_start_hour, minute=0, second=0, microsecond=0)
        peak_end = start.replace(hour=peak_end_hour, minute=0, second=0, microsecond=0)

        overlap_start = max(start, peak_start)
        overlap_end = min(end, peak_end)

        if overlap_end > overlap_start:
            overlap_minutes += (overlap_end - overlap_start).total_seconds() / 60

    return min(1.0, overlap_minutes / total_minutes)


def _nearest_gap_minutes(window_start: datetime, window_end: datetime, bookings: list[dict]) -> float:
    if not bookings:
        return float("inf")

    gaps = []
    for booking in bookings:
        gap_before = (window_start - booking["endTime"]).total_seconds() / 60
        gap_after = (booking["startTime"] - window_end).total_seconds() / 60
        gaps.append(max(gap_before, gap_after, 0))

    return min(gaps) if gaps else float("inf")


def recommend_schedule(
    candidate_windows: list[dict],
    existing_bookings: list[dict],
    priority: str,
) -> list[dict]:
    scored = []

    for window in candidate_windows:
        start, end = window["startTime"], window["endTime"]

        gap_minutes = _nearest_gap_minutes(start, end, existing_bookings)
        conflict_score = round(max(0.0, 1 - min(gap_minutes, PROXIMITY_BUFFER_MINUTES) / PROXIMITY_BUFFER_MINUTES), 2)

        disruption_score = round(_peak_overlap_fraction(start, end), 2)

        confidence = round(max(0.3, 0.95 - 0.3 * conflict_score - 0.2 * disruption_score), 2)

        reasons = []
        if conflict_score == 0:
            reasons.append("no nearby bookings on this section")
        else:
            reasons.append(f"closest existing booking is {int(gap_minutes)} min away")

        if disruption_score == 0:
            reasons.append("outside peak traffic hours")
        else:
            reasons.append("overlaps a peak traffic period")

        scored.append(
            {
                "startTime": start,
                "endTime": end,
                "conflictScore": conflict_score,
                "disruptionScore": disruption_score,
                "confidence": confidence,
                "reason": "; ".join(reasons).capitalize() + ".",
                "_rank": conflict_score * 0.6 + disruption_score * 0.4,
            }
        )

    scored.sort(key=lambda r: r["_rank"])
    for item in scored:
        item.pop("_rank")

    return scored
