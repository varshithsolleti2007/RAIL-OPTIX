from pathlib import Path

import pandas as pd


DATA_DIR = (
    Path(__file__).resolve().parent.parent / "data"
)

TASKS_FILE = DATA_DIR / "prioritized_tasks.csv"
BLOCKS_FILE = DATA_DIR / "block_windows.csv"
PLAN_FILE = DATA_DIR / "optimized_plan.csv"


def calculate_metrics():
    tasks = pd.read_csv(TASKS_FILE)
    blocks = pd.read_csv(BLOCKS_FILE)
    plan = pd.read_csv(PLAN_FILE)

    total_tasks = len(tasks)
    scheduled_tasks = len(plan)
    unscheduled_tasks = total_tasks - scheduled_tasks

    total_block_minutes = blocks[
        "duration_minutes"
    ].sum()

    if plan.empty:
        scheduled_maintenance_minutes = 0
    else:
        scheduled_maintenance_minutes = (
            plan["estimated_duration_minutes"]
            + plan["duration_buffer_minutes"]
        ).sum()

    if total_block_minutes > 0:
        utilization_percentage = (
            scheduled_maintenance_minutes
            / total_block_minutes
        ) * 100
    else:
        utilization_percentage = 0

    scheduled_high_risk = 0

    if not plan.empty and "priority_level" in plan.columns:
        scheduled_high_risk = (
            plan["priority_level"] == "Urgent"
        ).sum()

    metrics = {
        "total_tasks": total_tasks,
        "scheduled_tasks": scheduled_tasks,
        "unscheduled_tasks": unscheduled_tasks,
        "total_block_minutes": int(
            total_block_minutes
        ),
        "scheduled_maintenance_minutes": int(
            scheduled_maintenance_minutes
        ),
        "block_utilization_percentage": round(
            utilization_percentage,
            2,
        ),
        "urgent_tasks_scheduled": int(
            scheduled_high_risk
        ),
    }

    print("\nOptimization Metrics")
    print("=" * 40)

    for key, value in metrics.items():
        print(f"{key}: {value}")

    return metrics


if __name__ == "__main__":
    calculate_metrics()