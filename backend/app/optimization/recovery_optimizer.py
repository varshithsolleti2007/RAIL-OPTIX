from pathlib import Path

import pandas as pd

from app.services.data_loader import load_and_validate_datasets


# ---------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = BASE_DIR / "backend" / "app" / "data"

ORIGINAL_PLAN_FILE = DATA_DIR / "optimized_plan.csv"
SIMULATION_FILE = DATA_DIR / "simulation_results_block_failure.csv"

OUTPUT_FILE = DATA_DIR / "recovery_plan.csv"


# ---------------------------------------------------------------------
# Identifier normalization
# ---------------------------------------------------------------------

SECTION_MAP = {
    "SEC_A_B": "S01",
    "SEC_B_C": "S02",
    "SEC_C_D": "S03",
    "SEC_D_E": "S04",
    "SEC_E_F": "S05",
    "SEC_F_G": "S06",
    "SEC_G_H": "S07",
    "SEC_H_I": "S08",
}


def normalize_corridor(value) -> str:
    value = str(value).strip().upper()

    if value.startswith("CORR_"):
        number = value.split("_")[-1].lstrip("0")

        if number == "":
            number = "0"

        return "C" + number

    return value


def normalize_section(value) -> str:
    value = str(value).strip().upper()
    return SECTION_MAP.get(value, value)


def normalize_block_type(value) -> str:
    value = str(value).strip().lower()

    aliases = {
        "engineering block": "engineering block",
        "traffic block": "traffic block",
        "signal block": "traffic block",
        "power block": "power block",
        "ohe block": "power block",
    }

    return aliases.get(value, value)


def normalize_approval_status(value) -> str:
    return str(value).strip().lower()


# ---------------------------------------------------------------------
# Data loading
# ---------------------------------------------------------------------

def load_data():
    datasets = load_and_validate_datasets()

    maintenance_tasks = datasets["maintenance_tasks"].copy()
    block_windows = datasets["block_windows"].copy()

    if not ORIGINAL_PLAN_FILE.exists():
        raise FileNotFoundError(
            f"Optimized plan not found: {ORIGINAL_PLAN_FILE}"
        )

    if not SIMULATION_FILE.exists():
        raise FileNotFoundError(
            f"Block failure simulation results not found: "
            f"{SIMULATION_FILE}"
        )

    original_plan = pd.read_csv(ORIGINAL_PLAN_FILE)
    simulation_results = pd.read_csv(SIMULATION_FILE)

    return (
        maintenance_tasks,
        original_plan,
        simulation_results,
        block_windows,
    )


# ---------------------------------------------------------------------
# Recovery task detection
# ---------------------------------------------------------------------

def get_failed_blocks(simulation_results: pd.DataFrame) -> list[str]:
    failed_rows = simulation_results[
        simulation_results["disruption_type"]
        .astype(str)
        .str.strip()
        .str.lower()
        .eq("block failure")
    ]

    return (
        failed_rows["block_id"]
        .dropna()
        .astype(str)
        .str.strip()
        .unique()
        .tolist()
    )


def get_tasks_requiring_recovery(
    simulation_results: pd.DataFrame,
) -> list[str]:
    recovery_rows = simulation_results[
        simulation_results["replanning_required"]
        .astype(str)
        .str.strip()
        .str.lower()
        .isin(["true", "1", "yes"])
    ]

    return (
        recovery_rows["task_id"]
        .dropna()
        .astype(str)
        .str.strip()
        .unique()
        .tolist()
    )


# ---------------------------------------------------------------------
# Compatibility checks
# ---------------------------------------------------------------------

def is_compatible(
    task: pd.Series,
    block: pd.Series,
    failed_blocks: set[str],
) -> tuple[bool, str]:

    block_id = str(block["block_id"]).strip()

    if block_id in failed_blocks:
        return False, "Failed Block"

    task_corridor = normalize_corridor(task["corridor_id"])
    block_corridor = normalize_corridor(block["corridor_id"])

    if task_corridor != block_corridor:
        return False, "Corridor Mismatch"

    task_section = normalize_section(task["section_id"])
    block_section = normalize_section(block["section_id"])

    if task_section != block_section:
        return False, "Section Mismatch"

    task_block_type = normalize_block_type(
        task["required_block_type"]
    )
    block_type = normalize_block_type(
        block["block_type"]
    )

    if task_block_type != block_type:
        return False, "Block Type Mismatch"

    approval_status = normalize_approval_status(
        block["approval_status"]
    )

    if approval_status not in {
        "approved",
        "yes",
        "true",
        "1",
    }:
        return False, "Block Not Approved"

    task_duration = float(task["planning_duration_minutes"])
    block_duration = float(block["duration_minutes"])

    if task_duration > block_duration:
        return False, "Insufficient Block Duration"

    return True, "Compatible"


# ---------------------------------------------------------------------
# Recovery candidate generation
# ---------------------------------------------------------------------

def find_recovery_candidates(
    task: pd.Series,
    block_windows: pd.DataFrame,
    failed_blocks: set[str],
) -> list[dict]:

    candidates = []

    for _, block in block_windows.iterrows():
        compatible, reason = is_compatible(
            task=task,
            block=block,
            failed_blocks=failed_blocks,
        )

        if not compatible:
            continue

        task_duration = float(task["planning_duration_minutes"])
        block_duration = float(block["duration_minutes"])

        remaining_capacity = block_duration - task_duration

        candidates.append(
            {
                "task_id": task["task_id"],
                "asset_id": task["asset_id"],
                "corridor_id": normalize_corridor(
                    task["corridor_id"]
                ),
                "section_id": normalize_section(
                    task["section_id"]
                ),
                "maintenance_type": task["maintenance_type"],
                "required_block_type": task["required_block_type"],
                "priority_score": task["priority_score"],
                "priority_level": task["priority_level"],
                "estimated_duration_minutes": task[
                    "estimated_duration_minutes"
                ],
                "duration_buffer_minutes": task[
                    "duration_buffer_minutes"
                ],
                "planning_duration_minutes": task[
                    "planning_duration_minutes"
                ],
                "block_id": block["block_id"],
                "block_date": block["block_date"],
                "start_time": block["start_time"],
                "end_time": block["end_time"],
                "block_duration_minutes": block[
                    "duration_minutes"
                ],
                "block_type": block["block_type"],
                "approval_status": block["approval_status"],
                "remaining_capacity": remaining_capacity,
                "recovery_status": "Candidate",
                "reason": reason,
            }
        )

    return candidates


# ---------------------------------------------------------------------
# Candidate ranking
# ---------------------------------------------------------------------

def rank_candidates(
    candidates: list[dict],
) -> list[dict]:

    if not candidates:
        return []

    candidates_df = pd.DataFrame(candidates)

    candidates_df["_priority_score"] = pd.to_numeric(
        candidates_df["priority_score"],
        errors="coerce",
    ).fillna(0)

    candidates_df["_remaining_capacity"] = pd.to_numeric(
        candidates_df["remaining_capacity"],
        errors="coerce",
    ).fillna(float("inf"))

    candidates_df["_block_date"] = pd.to_datetime(
        candidates_df["block_date"],
        errors="coerce",
    )

    candidates_df["_start_time"] = candidates_df[
        "start_time"
    ].astype(str)

    candidates_df = candidates_df.sort_values(
        by=[
            "_priority_score",
            "_remaining_capacity",
            "_block_date",
            "_start_time",
        ],
        ascending=[
            False,
            True,
            True,
            True,
        ],
    )

    candidates_df = candidates_df.drop(
        columns=[
            "_priority_score",
            "_remaining_capacity",
            "_block_date",
            "_start_time",
        ]
    )

    return candidates_df.to_dict(orient="records")


# ---------------------------------------------------------------------
# Recovery plan construction
# ---------------------------------------------------------------------

def build_recovery_plan(
    maintenance_tasks: pd.DataFrame,
    original_plan: pd.DataFrame,
    simulation_results: pd.DataFrame,
    block_windows: pd.DataFrame,
) -> pd.DataFrame:

    failed_blocks = set(
        get_failed_blocks(simulation_results)
    )

    recovery_task_ids = get_tasks_requiring_recovery(
        simulation_results
    )

    print(f"Failed blocks: {sorted(failed_blocks)}")
    print(
        f"Tasks requiring recovery: "
        f"{len(recovery_task_ids)}"
    )

    if not recovery_task_ids:
        print("No tasks require recovery.")

        empty_columns = [
            "task_id",
            "asset_id",
            "corridor_id",
            "section_id",
            "maintenance_type",
            "required_block_type",
            "priority_score",
            "priority_level",
            "estimated_duration_minutes",
            "duration_buffer_minutes",
            "planning_duration_minutes",
            "original_block_id",
            "recovery_block_id",
            "block_date",
            "start_time",
            "end_time",
            "block_duration_minutes",
            "block_type",
            "approval_status",
            "recovery_status",
            "reason",
        ]

        return pd.DataFrame(columns=empty_columns)

    recovery_tasks = maintenance_tasks[
        maintenance_tasks["task_id"]
        .astype(str)
        .str.strip()
        .isin(recovery_task_ids)
    ].copy()

    plan_fields = [
        "task_id",
        "block_id",
        "priority_score",
        "priority_level",
        "planning_duration_minutes",
    ]

    available_plan_fields = [
        field
        for field in plan_fields
        if field in original_plan.columns
    ]

    original_plan_subset = original_plan[
        available_plan_fields
    ].copy()

    recovery_tasks = recovery_tasks.merge(
        original_plan_subset,
        on="task_id",
        how="left",
    )

    if "planning_duration_minutes" not in recovery_tasks:
        recovery_tasks["planning_duration_minutes"] = (
            pd.to_numeric(
                recovery_tasks[
                    "estimated_duration_minutes"
                ],
                errors="coerce",
            ).fillna(0)
            + pd.to_numeric(
                recovery_tasks[
                    "duration_buffer_minutes"
                ],
                errors="coerce",
            ).fillna(0)
        )

    recovery_results = []

    for _, task in recovery_tasks.iterrows():
        task_id = str(task["task_id"]).strip()

        original_block_id = task.get(
            "block_id",
            "",
        )

        candidates = find_recovery_candidates(
            task=task,
            block_windows=block_windows,
            failed_blocks=failed_blocks,
        )

        ranked_candidates = rank_candidates(candidates)

        if ranked_candidates:
            selected = ranked_candidates[0]

            recovery_results.append(
                {
                    "task_id": task_id,
                    "asset_id": task["asset_id"],
                    "corridor_id": normalize_corridor(
                        task["corridor_id"]
                    ),
                    "section_id": normalize_section(
                        task["section_id"]
                    ),
                    "maintenance_type": task[
                        "maintenance_type"
                    ],
                    "required_block_type": task[
                        "required_block_type"
                    ],
                    "priority_score": task.get(
                        "priority_score",
                        None,
                    ),
                    "priority_level": task.get(
                        "priority_level",
                        None,
                    ),
                    "estimated_duration_minutes": task[
                        "estimated_duration_minutes"
                    ],
                    "duration_buffer_minutes": task[
                        "duration_buffer_minutes"
                    ],
                    "planning_duration_minutes": task[
                        "planning_duration_minutes"
                    ],
                    "original_block_id": original_block_id,
                    "recovery_block_id": selected[
                        "block_id"
                    ],
                    "block_date": selected[
                        "block_date"
                    ],
                    "start_time": selected[
                        "start_time"
                    ],
                    "end_time": selected[
                        "end_time"
                    ],
                    "block_duration_minutes": selected[
                        "block_duration_minutes"
                    ],
                    "block_type": selected[
                        "block_type"
                    ],
                    "approval_status": selected[
                        "approval_status"
                    ],
                    "recovery_status": "Reassigned",
                    "reason": (
                        "Compatible recovery block "
                        "found"
                    ),
                }
            )

        else:
            recovery_results.append(
                {
                    "task_id": task_id,
                    "asset_id": task["asset_id"],
                    "corridor_id": normalize_corridor(
                        task["corridor_id"]
                    ),
                    "section_id": normalize_section(
                        task["section_id"]
                    ),
                    "maintenance_type": task[
                        "maintenance_type"
                    ],
                    "required_block_type": task[
                        "required_block_type"
                    ],
                    "priority_score": task.get(
                        "priority_score",
                        None,
                    ),
                    "priority_level": task.get(
                        "priority_level",
                        None,
                    ),
                    "estimated_duration_minutes": task[
                        "estimated_duration_minutes"
                    ],
                    "duration_buffer_minutes": task[
                        "duration_buffer_minutes"
                    ],
                    "planning_duration_minutes": task[
                        "planning_duration_minutes"
                    ],
                    "original_block_id": original_block_id,
                    "recovery_block_id": "",
                    "block_date": "",
                    "start_time": "",
                    "end_time": "",
                    "block_duration_minutes": "",
                    "block_type": "",
                    "approval_status": "",
                    "recovery_status": "No Compatible Block",
                    "reason": (
                        "No compatible recovery block "
                        "available"
                    ),
                }
            )

    return pd.DataFrame(recovery_results)


# ---------------------------------------------------------------------
# Main execution
# ---------------------------------------------------------------------

def main():
    (
        maintenance_tasks,
        original_plan,
        simulation_results,
        block_windows,
    ) = load_data()

    recovery_plan = build_recovery_plan(
        maintenance_tasks=maintenance_tasks,
        original_plan=original_plan,
        simulation_results=simulation_results,
        block_windows=block_windows,
    )

    recovery_plan.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    reassigned_count = int(
        (
            recovery_plan["recovery_status"]
            == "Reassigned"
        ).sum()
    )

    unresolved_count = int(
        (
            recovery_plan["recovery_status"]
            == "No Compatible Block"
        ).sum()
    )

    print(
        f"Tasks successfully reassigned: "
        f"{reassigned_count}"
    )

    print(
        f"Tasks without compatible recovery block: "
        f"{unresolved_count}"
    )

    print(
        f"Recovery plan saved to: {OUTPUT_FILE}"
    )

    if not recovery_plan.empty:
        print("\nRecovery plan:")
        print(
            recovery_plan[
                [
                    "task_id",
                    "original_block_id",
                    "recovery_block_id",
                    "recovery_status",
                    "reason",
                ]
            ].to_string(index=False)
        )


if __name__ == "__main__":
    main()