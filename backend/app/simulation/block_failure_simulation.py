from pathlib import Path

import pandas as pd

from app.services.data_loader import load_and_validate_datasets
from app.simulation.sequential_simulator import prepare_plan


BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "backend" / "app" / "data"

PLAN_FILE = DATA_DIR / "optimized_plan.csv"
RESULTS_FILE = DATA_DIR / "simulation_results_block_failure.csv"


def load_data():
    """
    Validate source datasets and load the optimized plan.
    """

    # Validate the original planning datasets first.
    load_and_validate_datasets()

    if not PLAN_FILE.exists():
        raise FileNotFoundError(
            f"Optimized plan not found: {PLAN_FILE}"
        )

    plan = pd.read_csv(PLAN_FILE)

    return plan


def select_failed_block(plan: pd.DataFrame) -> str:
    """
    Select a scheduled block for the failure simulation.

    Preference is given to a block containing multiple tasks,
    so the disruption affects more than one task.
    """

    block_counts = (
        plan.groupby("block_id")
        .size()
        .sort_values(ascending=False)
    )

    if block_counts.empty:
        raise ValueError(
            "No scheduled blocks available."
        )

    return str(block_counts.index[0])


def simulate_block_failure(
    plan: pd.DataFrame,
    failed_block_id: str,
) -> pd.DataFrame:
    """
    Simulate sequential task execution while treating one
    block as unavailable.

    Tasks assigned to the failed block are marked as Blocked
    and require replanning. Tasks in unaffected blocks are
    executed sequentially.
    """

    results = []

    for block_id, block_tasks in plan.groupby(
        "block_id",
        sort=False,
    ):
        block_id = str(block_id)

        block_tasks = block_tasks.sort_values(
            by=["planned_start", "task_id"]
        ).copy()

        block_start = block_tasks["planned_start"].min()

        block_duration = float(
            block_tasks[
                "block_duration_minutes"
            ].iloc[0]
        )

        block_end = block_start + pd.Timedelta(
            minutes=block_duration
        )

        # Failed block handling.
        if block_id == str(failed_block_id):
            for _, task in block_tasks.iterrows():
                results.append(
                    {
                        "task_id": task["task_id"],
                        "block_id": block_id,
                        "sequence_number": int(
                            task["sequence_number"]
                        ),
                        "planned_start": task["planned_start"],
                        "planned_end": task["planned_end"],
                        "actual_start": pd.NaT,
                        "actual_end": pd.NaT,
                        "planning_duration_minutes": float(
                            task["planning_duration_minutes"]
                        ),
                        "actual_duration_minutes": 0.0,
                        "delay_minutes": 0.0,
                        "status": "Blocked",
                        "disruption_type": "Block Failure",
                        "failure_reason": (
                            f"Block {block_id} became unavailable "
                            "before task execution"
                        ),
                        "replanning_required": True,
                    }
                )

            continue

        # Normal sequential execution for unaffected blocks.
        current_time = block_start
        used_minutes = 0.0

        for _, task in block_tasks.iterrows():
            planned_start = task["planned_start"]
            planned_end = task["planned_end"]

            planned_duration = float(
                task["planning_duration_minutes"]
            )

            actual_start = max(
                current_time,
                planned_start,
            )

            delay_minutes = max(
                0.0,
                (
                    actual_start - planned_start
                ).total_seconds() / 60,
            )

            actual_end = actual_start + pd.Timedelta(
                minutes=planned_duration
            )

            used_after_task = (
                used_minutes + planned_duration
            )

            status = "Completed"
            failure_reason = ""
            replanning_required = False

            if used_after_task > block_duration:
                status = "Requires Replanning"
                failure_reason = (
                    "Sequential task duration exceeds "
                    "block capacity"
                )
                replanning_required = True

            elif actual_end > block_end:
                status = "Requires Replanning"
                failure_reason = (
                    "Task execution exceeds block end time"
                )
                replanning_required = True

            elif delay_minutes > 0:
                status = "Delayed"
                failure_reason = (
                    "Previous task caused a sequential delay"
                )

            results.append(
                {
                    "task_id": task["task_id"],
                    "block_id": block_id,
                    "sequence_number": int(
                        task["sequence_number"]
                    ),
                    "planned_start": planned_start,
                    "planned_end": planned_end,
                    "actual_start": actual_start,
                    "actual_end": actual_end,
                    "planning_duration_minutes": planned_duration,
                    "actual_duration_minutes": planned_duration,
                    "delay_minutes": round(
                        delay_minutes,
                        2,
                    ),
                    "status": status,
                    "disruption_type": "",
                    "failure_reason": failure_reason,
                    "replanning_required": (
                        replanning_required
                    ),
                }
            )

            current_time = actual_end
            used_minutes = used_after_task

    return pd.DataFrame(results)


def print_summary(
    results: pd.DataFrame,
    failed_block_id: str,
):
    print("\nBlock-failure simulation summary")
    print("--------------------------------")

    print(f"Failed block: {failed_block_id}")
    print(f"Total simulated tasks: {len(results)}")

    print(
        f"Completed tasks: "
        f"{(results['status'] == 'Completed').sum()}"
    )

    print(
        f"Delayed tasks: "
        f"{(results['status'] == 'Delayed').sum()}"
    )

    print(
        f"Blocked tasks: "
        f"{(results['status'] == 'Blocked').sum()}"
    )

    print(
        f"Tasks requiring replanning: "
        f"{results['replanning_required'].sum()}"
    )

    print(
        f"Total delay minutes: "
        f"{results['delay_minutes'].sum():.2f}"
    )

    print("\nBlocked task results:")

    blocked_tasks = results[
        results["status"] == "Blocked"
    ]

    if blocked_tasks.empty:
        print("No blocked tasks found.")
    else:
        print(
            blocked_tasks[
                [
                    "task_id",
                    "block_id",
                    "sequence_number",
                    "status",
                    "disruption_type",
                    "failure_reason",
                    "replanning_required",
                ]
            ].to_string(index=False)
        )


def main():
    print(
        "Validating source datasets and loading optimized plan..."
    )

    raw_plan = load_data()
    plan = prepare_plan(raw_plan)

    print(
        "Source dataset validation passed."
    )

    print(
        f"Loaded optimized tasks: {len(plan)}"
    )

    failed_block_id = select_failed_block(plan)

    affected_tasks = plan[
        plan["block_id"].astype(str)
        == failed_block_id
    ]

    print("\nBlock-failure scenario")
    print("----------------------")
    print(f"Failed block: {failed_block_id}")

    print("Affected tasks:")
    print(
        affected_tasks[
            [
                "task_id",
                "block_id",
                "sequence_number",
                "planning_duration_minutes",
            ]
        ].to_string(index=False)
    )

    print("\nStarting disruption simulation...")

    results = simulate_block_failure(
        plan=plan,
        failed_block_id=failed_block_id,
    )

    results.to_csv(
        RESULTS_FILE,
        index=False,
    )

    print(
        "\nBlock-failure simulation completed."
    )

    print(
        f"Results saved to: {RESULTS_FILE}"
    )

    print_summary(
        results,
        failed_block_id,
    )


if __name__ == "__main__":
    main()