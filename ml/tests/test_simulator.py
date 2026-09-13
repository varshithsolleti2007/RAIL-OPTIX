from datetime import datetime

from app.simulation.simulator import simulate


def test_sequential_tasks_complete_without_delay_when_capacity_allows():
    tasks = [
        {
            "task_id": "A",
            "block_id": "B1",
            "planned_start": datetime(2026, 9, 18, 10, 0),
            "planned_end": datetime(2026, 9, 18, 11, 0),
            "duration_minutes": 60,
            "block_duration_minutes": 180,
        },
        {
            "task_id": "B",
            "block_id": "B1",
            "planned_start": datetime(2026, 9, 18, 11, 0),
            "planned_end": datetime(2026, 9, 18, 12, 0),
            "duration_minutes": 60,
            "block_duration_minutes": 180,
        },
    ]

    results = {r["task_id"]: r for r in simulate(tasks)}

    assert results["A"]["status"] == "Completed"
    assert results["B"]["status"] == "Completed"
    assert results["B"]["delay_minutes"] == 0


def test_overlapping_tasks_cause_delay():
    tasks = [
        {
            "task_id": "A",
            "block_id": "B1",
            "planned_start": datetime(2026, 9, 18, 10, 0),
            "planned_end": datetime(2026, 9, 18, 11, 30),
            "duration_minutes": 90,
            "block_duration_minutes": 180,
        },
        {
            "task_id": "B",
            "block_id": "B1",
            "planned_start": datetime(2026, 9, 18, 11, 0),
            "planned_end": datetime(2026, 9, 18, 12, 0),
            "duration_minutes": 60,
            "block_duration_minutes": 180,
        },
    ]

    results = {r["task_id"]: r for r in simulate(tasks)}

    assert results["B"]["status"] == "Delayed"
    assert results["B"]["delay_minutes"] == 30


def test_failed_block_marks_tasks_blocked():
    tasks = [
        {
            "task_id": "A",
            "block_id": "B1",
            "planned_start": datetime(2026, 9, 18, 10, 0),
            "planned_end": datetime(2026, 9, 18, 11, 0),
            "duration_minutes": 60,
            "block_duration_minutes": 180,
        }
    ]

    results = simulate(tasks, failed_block_id="B1")

    assert results[0]["status"] == "Blocked"
    assert results[0]["replanning_required"] is True
