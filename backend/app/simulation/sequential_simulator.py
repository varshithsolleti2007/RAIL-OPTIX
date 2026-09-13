from pathlib import Path

import pandas as pd

from app.services.data_loader import load_and_validate_datasets


BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "backend" / "app" / "data"

PLAN_FILE = DATA_DIR / "optimized_plan.csv"
BLOCKS_FILE = DATA_DIR / "block_windows.csv"
TRAINS_FILE = DATA_DIR / "train_movements.csv"

RESULTS_FILE = DATA_DIR / "simulation_results.csv"


def load_data():
    """
    Validate source datasets and load simulation inputs.
    """

    # Validate the original planning datasets first.
    datasets = load_and_validate_datasets()

    plan = pd.read_csv(PLAN_FILE)

    # Use validated datasets instead of reading them again.
    blocks = datasets["block_windows"].copy()
    trains = datasets["train_movements"].copy()

    return plan, blocks, trains


def prepare_plan(plan: pd.DataFrame) -> pd.DataFrame:
    """
    Prepare the optimized plan for sequential execution.
    """

    required_columns = [
        "task_id",
        "block_id",
        "block_date",
        "start_time",
        "end_time",
        "planning_duration_minutes",
        "block_duration_minutes",
    ]

    missing_columns = [
        column
        for column in required_columns
        if column not in plan.columns
    ]

    if missing_columns:
        raise ValueError(
            "Missing required columns in optimized_plan.csv: "
            f"{missing_columns}"
        )

    if plan.empty:
        raise ValueError(
            "optimized_plan.csv is empty. "
            "Run the optimizer before starting simulation."
        )

    plan = plan.copy()

    plan["planned_start"] = pd.to_datetime(
        plan["start_time"],
        errors="coerce",
    )

    plan["planned_end"] = pd.to_datetime(
        plan["end_time"],
        errors="coerce",
    )

    if plan["planned_start"].isna().any():
        raise ValueError(
            "optimized_plan.csv contains invalid start_time values."
        )

    if plan["planned_end"].isna().any():
        raise ValueError(
            "optimized_plan.csv contains invalid end_time values."
        )

    plan["planning_duration_minutes"] = pd.to_numeric(
        plan["planning_duration_minutes"],
        errors="coerce",
    )

    plan["block_duration_minutes"] = pd.to_numeric(
        plan["block_duration_minutes"],
        errors="coerce",
    )

    if plan["planning_duration_minutes"].isna().any():
        raise ValueError(
            "optimized_plan.csv contains invalid planning durations."
        )

    if plan["block_duration_minutes"].isna().any():
        raise ValueError(
            "optimized_plan.csv contains invalid block durations."
        )

    plan = plan.sort_values(
        by=["planned_start", "block_id", "task_id"]
    ).reset_index(drop=True)

    plan["sequence_number"] = (
        plan.groupby("block_id").cumcount() + 1
    )

    return plan


def simulate_sequential_execution(
    plan: pd.DataFrame,
) -> pd.DataFrame:
    """
    Execute tasks sequentially within each block.

    Tasks in the same block cannot execute simultaneously.
    """

    results = []

    for block_id, block_tasks in plan.groupby(
        "block_id",
        sort=False,
    ):
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

            proposed_actual_end = (
                actual_start
                + pd.Timedelta(
                    minutes=planned_duration
                )
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

            elif proposed_actual_end > block_end:
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

            actual_end = proposed_actual_end

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
                    "planning_duration_minutes": (
                        planned_duration
                    ),
                    "actual_duration_minutes": (
                        planned_duration
                    ),
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


def print_summary(results: pd.DataFrame):
    print("\nSimulation summary:")

    print(
        f"Total simulated tasks: {len(results)}"
    )

    print(
        f"Completed tasks: "
        f"{(results['status'] == 'Completed').sum()}"
    )

    print(
        f"Delayed tasks: "
        f"{(results['status'] == 'Delayed').sum()}"
    )

    print(
        f"Tasks requiring replanning: "
        f"{results['replanning_required'].sum()}"
    )

    print(
        f"Total delay minutes: "
        f"{results['delay_minutes'].sum():.2f}"
    )

    print(
        f"Maximum task delay: "
        f"{results['delay_minutes'].max():.2f}"
    )

    print("\nSimulation results:")
    print(results.to_string(index=False))


def main():
    print("Validating and loading simulation inputs...")

    plan, blocks, trains = load_data()

    print("Source dataset validation passed.")

    print(
        f"Loaded optimized tasks: {len(plan)}"
    )

    print(
        f"Loaded block windows: {len(blocks)}"
    )

    print(
        f"Loaded train movements: {len(trains)}"
    )

    plan = prepare_plan(plan)

    print("\nStarting sequential simulation...")

    results = simulate_sequential_execution(plan)

    results.to_csv(
        RESULTS_FILE,
        index=False,
    )

    print(
        f"\nSimulation results saved to: "
        f"{RESULTS_FILE}"
    )

    print_summary(results)


if __name__ == "__main__":
    main()