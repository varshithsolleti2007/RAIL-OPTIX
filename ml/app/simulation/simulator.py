"""
Sequential execution replay, with an optional forced block failure.

JSON-based rebuild of the previous prototype's sequential_simulator.py /
block_failure_simulation.py (CLAUDE_CODE_PROJECT_CONTEXT.md §20/§21).
"""

from collections import defaultdict
from datetime import timedelta


def simulate(tasks: list[dict], failed_block_id: str | None = None) -> list[dict]:
    by_block = defaultdict(list)
    for task in tasks:
        by_block[task["block_id"]].append(task)

    results = []

    for block_id, block_tasks in by_block.items():
        block_tasks = sorted(block_tasks, key=lambda t: (t["planned_start"], t["task_id"]))

        if failed_block_id is not None and str(block_id) == str(failed_block_id):
            for task in block_tasks:
                results.append(
                    {
                        "task_id": task["task_id"],
                        "block_id": block_id,
                        "status": "Blocked",
                        "delay_minutes": 0.0,
                        "replanning_required": True,
                        "reason": f"Block {block_id} became unavailable before task execution.",
                    }
                )
            continue

        block_start = block_tasks[0]["planned_start"]
        block_duration = block_tasks[0]["block_duration_minutes"]
        block_end = block_start + _minutes(block_duration)

        current_time = block_start
        used_minutes = 0.0

        for task in block_tasks:
            planned_start = task["planned_start"]
            duration = task["duration_minutes"]

            actual_start = max(current_time, planned_start)
            delay_minutes = max(0.0, (actual_start - planned_start).total_seconds() / 60)
            actual_end = actual_start + _minutes(duration)
            used_after_task = used_minutes + duration

            status = "Completed"
            reason = ""
            replanning_required = False

            if used_after_task > block_duration:
                status = "Requires Replanning"
                reason = "Sequential task duration exceeds block capacity."
                replanning_required = True
            elif actual_end > block_end:
                status = "Requires Replanning"
                reason = "Task execution exceeds block end time."
                replanning_required = True
            elif delay_minutes > 0:
                status = "Delayed"
                reason = "Previous task caused a sequential delay."

            results.append(
                {
                    "task_id": task["task_id"],
                    "block_id": block_id,
                    "status": status,
                    "delay_minutes": round(delay_minutes, 2),
                    "replanning_required": replanning_required,
                    "reason": reason,
                }
            )

            current_time = actual_end
            used_minutes = used_after_task

    return results


def _minutes(value):
    return timedelta(minutes=value)
