from datetime import datetime

from app.optimization.schedule_recommender import recommend_schedule


def test_prefers_window_far_from_existing_booking_and_off_peak():
    candidates = [
        {"startTime": datetime(2026, 9, 18, 9, 0), "endTime": datetime(2026, 9, 18, 12, 0)},  # peak, close to booking
        {"startTime": datetime(2026, 9, 18, 14, 0), "endTime": datetime(2026, 9, 18, 17, 0)},  # off-peak, far
    ]
    bookings = [{"startTime": datetime(2026, 9, 18, 8, 0), "endTime": datetime(2026, 9, 18, 9, 0)}]

    ranked = recommend_schedule(candidates, bookings, priority="HIGH")

    assert ranked[0]["startTime"] == datetime(2026, 9, 18, 14, 0)
    assert ranked[0]["conflictScore"] < ranked[1]["conflictScore"]
    assert 0 <= ranked[0]["confidence"] <= 1


def test_no_bookings_gives_zero_conflict_score():
    candidates = [{"startTime": datetime(2026, 9, 18, 14, 0), "endTime": datetime(2026, 9, 18, 16, 0)}]
    ranked = recommend_schedule(candidates, [], priority="MEDIUM")

    assert ranked[0]["conflictScore"] == 0.0
