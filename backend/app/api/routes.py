from pathlib import Path

import pandas as pd
from fastapi import APIRouter, HTTPException


router = APIRouter(
    prefix="/api",
    tags=["Railway Planning"],
)


DATA_DIR = (
    Path(__file__).resolve().parent.parent / "data"
)


def read_csv_file(filename: str):
    """
    Read a CSV file and return its records as JSON-compatible data.
    """

    file_path = DATA_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {filename}",
        )

    try:
        df = pd.read_csv(file_path)

        # Convert NaN values to None for valid JSON.
        df = df.where(pd.notnull(df), None)

        return df.to_dict(orient="records")

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read {filename}: {str(error)}",
        )


def return_records(filename: str):
    """
    Return a consistent API response for a CSV file.
    """

    records = read_csv_file(filename)

    return {
        "count": len(records),
        "data": records,
    }


@router.get("/maintenance-tasks")
def get_maintenance_tasks():
    """
    Return maintenance tasks with risk predictions.
    """

    return return_records(
        "maintenance_tasks_with_risk.csv"
    )


@router.get("/prioritized-tasks")
def get_prioritized_tasks():
    """
    Return maintenance tasks after priority scoring.
    """

    return return_records(
        "prioritized_tasks.csv"
    )


@router.get("/train-movements")
def get_train_movements():
    """
    Return train movement data.
    """

    return return_records(
        "train_movements.csv"
    )


@router.get("/block-windows")
def get_block_windows():
    """
    Return available maintenance block windows.
    """

    return return_records(
        "block_windows.csv"
    )


@router.get("/optimized-plan")
def get_optimized_plan():
    """
    Return the optimized maintenance plan.
    """

    return return_records(
        "optimized_plan.csv"
    )


@router.get("/simulation-results")
def get_simulation_results():
    """
    Return normal sequential simulation results.
    """

    return return_records(
        "simulation_results.csv"
    )


@router.get("/block-failure-simulation")
def get_block_failure_simulation():
    """
    Return block failure simulation results.
    """

    return return_records(
        "simulation_results_block_failure.csv"
    )


@router.get("/recovery-plan")
def get_recovery_plan():
    """
    Return the recovery plan generated after block failure.
    """

    return return_records(
        "recovery_plan.csv"
    )


@router.get("/plan-metrics")
def get_plan_metrics():
    """
    Calculate and return basic plan metrics.
    """

    plan_file = DATA_DIR / "optimized_plan.csv"

    if not plan_file.exists():
        raise HTTPException(
            status_code=404,
            detail="optimized_plan.csv not found",
        )

    try:
        plan = pd.read_csv(plan_file)

        total_tasks = len(plan)

        if total_tasks == 0:
            return {
                "total_tasks": 0,
                "scheduled_tasks": 0,
                "total_maintenance_minutes": 0,
                "average_task_duration_minutes": 0,
                "urgent_tasks_scheduled": 0,
            }

        scheduled_tasks = len(plan)

        total_maintenance_minutes = int(
            pd.to_numeric(
                plan["estimated_duration_minutes"],
                errors="coerce",
            )
            .fillna(0)
            .sum()
        )

        average_task_duration_minutes = round(
            pd.to_numeric(
                plan["estimated_duration_minutes"],
                errors="coerce",
            )
            .fillna(0)
            .mean(),
            2,
        )

        urgent_tasks_scheduled = int(
            (
                plan["priority_level"]
                .astype(str)
                .str.lower()
                == "urgent"
            ).sum()
        )

        return {
            "total_tasks": total_tasks,
            "scheduled_tasks": scheduled_tasks,
            "total_maintenance_minutes": total_maintenance_minutes,
            "average_task_duration_minutes": average_task_duration_minutes,
            "urgent_tasks_scheduled": urgent_tasks_scheduled,
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not calculate plan metrics: {str(error)}",
        )