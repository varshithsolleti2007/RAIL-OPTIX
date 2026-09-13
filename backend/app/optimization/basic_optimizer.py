from pathlib import Path
from itertools import combinations

import pandas as pd
from ortools.linear_solver import pywraplp

from app.services.data_loader import load_and_validate_datasets
DATA_DIR = (
    Path(__file__).resolve().parent.parent / "data"
)

TASKS_FILE = DATA_DIR / "prioritized_tasks.csv"
BLOCKS_FILE = DATA_DIR / "block_windows.csv"
TRAINS_FILE = DATA_DIR / "train_movements.csv"
OUTPUT_FILE = DATA_DIR / "optimized_plan.csv"


# Synthetic-data mapping between task requirements
# and available block types.
#
# In a real railway system, these mappings would
# come from engineering and operating rules.
BLOCK_TYPE_MAPPING = {
    "OHE Block": "Power Block",
    "Engineering Block": "Engineering Block",
    "Signal Block": "Traffic Block",
}


# Synthetic-data mapping between task sections
# and block-window sections.
#
# In a real railway system, this mapping would
# come from the railway's section and asset database.
TASK_TO_BLOCK_SECTION = {
    "SEC_A_B": "S01",
    "SEC_B_C": "S02",
    "SEC_C_D": "S03",
    "SEC_D_E": "S04",
    "SEC_E_F": "S05",
    "SEC_F_G": "S06",
    "SEC_G_H": "S07",
    "SEC_H_I": "S08",
}


def convert_task_corridor(task_corridor):
    """
    Convert synthetic task corridor IDs into the
    corridor format used by blocks and train movements.

    Example:
        CORR_01 -> C1
        CORR_02 -> C2
    """

    if pd.isna(task_corridor):
        return task_corridor

    task_corridor = str(task_corridor).strip()

    if task_corridor.startswith("CORR_"):
        corridor_number = task_corridor.replace(
            "CORR_",
            "",
        )

        corridor_number = int(corridor_number)

        return f"C{corridor_number}"

    return task_corridor


def convert_task_section(task_section):
    """
    Convert synthetic task section IDs into the
    section format used by block windows.

    Example:
        SEC_A_B -> S01
        SEC_H_I -> S08
    """

    if pd.isna(task_section):
        return task_section

    task_section = str(task_section).strip()

    return TASK_TO_BLOCK_SECTION.get(
        task_section,
        task_section,
    )


def parse_required_resources(resource_text):
    """
    Convert a pipe-separated resource string into
    a clean set of resource names.

    Example:
        TRD_TEAM_A|OHE_VEHICLE_01
        -> {"TRD_TEAM_A", "OHE_VEHICLE_01"}
    """

    if resource_text is None:
        return set()

    if pd.isna(resource_text):
        return set()

    text = str(resource_text).strip()

    if not text or text.lower() == "nan":
        return set()

    return {
        resource.strip()
        for resource in text.split("|")
        if resource.strip()
    }


def load_data():
    datasets = load_and_validate_datasets()

    tasks = datasets["maintenance_tasks"].copy()
    blocks = datasets["block_windows"].copy()
    trains = datasets["train_movements"].copy()

    # The optimizer uses prioritized task data.
    prioritized_tasks_file = DATA_DIR / "prioritized_tasks.csv"

    if prioritized_tasks_file.exists():
        tasks = pd.read_csv(prioritized_tasks_file)
    # Convert task corridor IDs to the format used
    # by block windows and train movements.
    tasks["planning_corridor_id"] = (
        tasks["corridor_id"].apply(
            convert_task_corridor
        )
    )

    # Convert task section IDs to the format used
    # by block windows.
    tasks["planning_section_id"] = (
        tasks["section_id"].apply(
            convert_task_section
        )
    )

    # Convert all time columns to datetime.
    blocks["start_datetime"] = pd.to_datetime(
        blocks["start_time"],
        errors="coerce",
    )

    blocks["end_datetime"] = pd.to_datetime(
        blocks["end_time"],
        errors="coerce",
    )

    trains["train_start_datetime"] = pd.to_datetime(
        trains["scheduled_departure"],
        errors="coerce",
    )

    trains["train_end_datetime"] = pd.to_datetime(
        trains["scheduled_arrival"],
        errors="coerce",
    )

    # Ensure numeric fields are numeric.
    tasks["estimated_duration_minutes"] = pd.to_numeric(
        tasks["estimated_duration_minutes"],
        errors="coerce",
    ).fillna(0)

    tasks["duration_buffer_minutes"] = pd.to_numeric(
        tasks["duration_buffer_minutes"],
        errors="coerce",
    ).fillna(0)

    tasks["priority_score"] = pd.to_numeric(
        tasks["priority_score"],
        errors="coerce",
    ).fillna(0)

    blocks["duration_minutes"] = pd.to_numeric(
        blocks["duration_minutes"],
        errors="coerce",
    ).fillna(0)

    # Duration used for planning includes the buffer.
    tasks["planning_duration_minutes"] = (
        tasks["estimated_duration_minutes"]
        + tasks["duration_buffer_minutes"]
    )

    return tasks, blocks, trains


def times_overlap(
    first_start,
    first_end,
    second_start,
    second_end,
):
    """
    Return True when two time intervals overlap.
    """

    if (
        pd.isna(first_start)
        or pd.isna(first_end)
        or pd.isna(second_start)
        or pd.isna(second_end)
    ):
        return False

    return (
        first_start < second_end
        and second_start < first_end
    )


def block_has_train_conflict(
    block,
    trains,
):
    """
    Check whether any train movement overlaps
    the proposed block on the same corridor.

    This is a corridor-level traffic constraint
    because the current train dataset does not
    contain section_id.
    """

    block_corridor = block["corridor_id"]
    block_start = block["start_datetime"]
    block_end = block["end_datetime"]

    corridor_trains = trains[
        trains["corridor_id"]
        == block_corridor
    ]

    for _, train in corridor_trains.iterrows():

        train_start = train[
            "train_start_datetime"
        ]

        train_end = train[
            "train_end_datetime"
        ]

        if times_overlap(
            block_start,
            block_end,
            train_start,
            train_end,
        ):
            return True

    return False


def tasks_have_resource_conflict(
    task_a,
    task_b,
):
    """
    Return True when two tasks require at least
    one common resource.

    Such tasks cannot be performed simultaneously
    in the same block window.
    """

    resources_a = parse_required_resources(
        task_a["required_resources"]
    )

    resources_b = parse_required_resources(
        task_b["required_resources"]
    )

    return bool(
        resources_a.intersection(resources_b)
    )


def tasks_are_compatible(
    task_a,
    task_b,
):
    """
    Check whether two tasks can be assigned
    to the same block window.
    """

    same_corridor = (
        task_a["planning_corridor_id"]
        == task_b["planning_corridor_id"]
    )

    if not same_corridor:
        return False

    same_section = (
        task_a["planning_section_id"]
        == task_b["planning_section_id"]
    )

    if not same_section:
        return False

    same_block_type = (
        task_a["required_block_type"]
        == task_b["required_block_type"]
    )

    if not same_block_type:
        return False

    if tasks_have_resource_conflict(
        task_a,
        task_b,
    ):
        return False

    return True


def create_optimization_model(
    tasks,
    blocks,
    trains,
):
    solver = pywraplp.Solver.CreateSolver(
        "SCIP"
    )

    if solver is None:
        raise RuntimeError(
            "SCIP solver could not be created."
        )

    decision_variables = {}

    rejected_due_to_traffic = 0
    rejected_due_to_type = 0
    rejected_due_to_duration = 0
    rejected_due_to_approval = 0
    rejected_due_to_corridor = 0
    rejected_due_to_section = 0

    # -------------------------------------------------
    # Create feasible task-block assignment variables.
    # -------------------------------------------------

    for task_index, task in tasks.iterrows():

        for block_index, block in blocks.iterrows():

            task_corridor = task[
                "planning_corridor_id"
            ]

            block_corridor = block[
                "corridor_id"
            ]

            same_corridor = (
                task_corridor
                == block_corridor
            )

            if not same_corridor:
                rejected_due_to_corridor += 1
                continue

            task_section = task[
                "planning_section_id"
            ]

            block_section = block[
                "section_id"
            ]

            same_section = (
                task_section
                == block_section
            )

            if not same_section:
                rejected_due_to_section += 1
                continue

            mapped_block_type = (
                BLOCK_TYPE_MAPPING.get(
                    task["required_block_type"]
                )
            )

            same_block_type = (
                mapped_block_type
                == block["block_type"]
            )

            if not same_block_type:
                rejected_due_to_type += 1
                continue

            approved_block = (
                block["approval_status"]
                == "Approved"
            )

            if not approved_block:
                rejected_due_to_approval += 1
                continue

            task_duration = task[
                "planning_duration_minutes"
            ]

            block_duration = block[
                "duration_minutes"
            ]

            duration_fits = (
                task_duration <= block_duration
            )

            if not duration_fits:
                rejected_due_to_duration += 1
                continue

            traffic_conflict = (
                block_has_train_conflict(
                    block,
                    trains,
                )
            )

            if traffic_conflict:
                rejected_due_to_traffic += 1
                continue

            decision_variables[
                (task_index, block_index)
            ] = solver.BoolVar(
                f"x_{task_index}_{block_index}"
            )

    print("\nCompatibility filtering summary:")

    print(
        f"Rejected due to corridor mismatch: "
        f"{rejected_due_to_corridor}"
    )

    print(
        f"Rejected due to section mismatch: "
        f"{rejected_due_to_section}"
    )

    print(
        f"Rejected due to block type mismatch: "
        f"{rejected_due_to_type}"
    )

    print(
        f"Rejected due to unapproved block: "
        f"{rejected_due_to_approval}"
    )

    print(
        f"Rejected due to duration: "
        f"{rejected_due_to_duration}"
    )

    print(
        f"Rejected due to train conflict: "
        f"{rejected_due_to_traffic}"
    )

    # -------------------------------------------------
    # Constraint 1:
    # Each maintenance task can be assigned
    # to at most one block.
    # -------------------------------------------------

    for task_index in tasks.index:

        task_variables = [
            variable
            for (
                t_index,
                b_index,
            ), variable in decision_variables.items()
            if t_index == task_index
        ]

        if task_variables:
            solver.Add(
                solver.Sum(task_variables) <= 1
            )

    # -------------------------------------------------
    # Constraint 2:
    # Each block has a total duration capacity.
    #
    # Multiple tasks can use the same block as long
    # as their combined duration fits.
    # -------------------------------------------------

    for block_index in blocks.index:

        block_variables = []

        for (
            task_index,
            b_index,
        ), variable in decision_variables.items():

            if b_index == block_index:

                task_duration = tasks.loc[
                    task_index,
                    "planning_duration_minutes",
                ]

                block_variables.append(
                    task_duration * variable
                )

        if block_variables:

            block_duration = blocks.loc[
                block_index,
                "duration_minutes",
            ]

            solver.Add(
                solver.Sum(block_variables)
                <= block_duration
            )

    # -------------------------------------------------
    # Constraint 3:
    # Prevent incompatible task pairs from being
    # assigned to the same block.
    # -------------------------------------------------

    for block_index in blocks.index:

        block_task_indices = [
            task_index
            for (
                task_index,
                b_index,
            ) in decision_variables.keys()
            if b_index == block_index
        ]

        for task_index_a, task_index_b in combinations(
            block_task_indices,
            2,
        ):

            task_a = tasks.loc[task_index_a]
            task_b = tasks.loc[task_index_b]

            if not tasks_are_compatible(
                task_a,
                task_b,
            ):

                variable_a = decision_variables.get(
                    (task_index_a, block_index)
                )

                variable_b = decision_variables.get(
                    (task_index_b, block_index)
                )

                if (
                    variable_a is not None
                    and variable_b is not None
                ):

                    solver.Add(
                        variable_a
                        + variable_b
                        <= 1
                    )

    # -------------------------------------------------
    # Objective:
    # Maximize total priority score.
    #
    # Urgent tasks receive an additional weight.
    # -------------------------------------------------

    priority_level_weights = {
        "Urgent": 3.0,
        "High": 2.0,
        "Medium": 1.0,
        "Low": 0.5,
    }

    objective_terms = []

    for (
        task_index,
        block_index,
    ), variable in decision_variables.items():

        priority_score = float(
            tasks.loc[
                task_index,
                "priority_score",
            ]
        )

        priority_level = str(
            tasks.loc[
                task_index,
                "priority_level",
            ]
        ).strip()

        urgency_weight = (
            priority_level_weights.get(
                priority_level,
                1.0,
            )
        )

        weighted_priority = (
            priority_score * urgency_weight
        )

        objective_terms.append(
            weighted_priority * variable
        )

    if objective_terms:
        solver.Maximize(
            solver.Sum(objective_terms)
        )

    return solver, decision_variables


def extract_solution(
    tasks,
    blocks,
    solver,
    decision_variables,
):
    scheduled_rows = []

    for (
        task_index,
        block_index,
    ), variable in decision_variables.items():

        if variable.solution_value() > 0.5:

            task = tasks.loc[task_index]
            block = blocks.loc[block_index]

            scheduled_rows.append(
                {
                    "task_id": task["task_id"],
                    "asset_id": task["asset_id"],
                    "corridor_id": task[
                        "corridor_id"
                    ],
                    "planning_corridor_id": task[
                        "planning_corridor_id"
                    ],
                    "section_id": task[
                        "section_id"
                    ],
                    "planning_section_id": task[
                        "planning_section_id"
                    ],
                    "maintenance_type": task[
                        "maintenance_type"
                    ],
                    "required_block_type": task[
                        "required_block_type"
                    ],
                    "priority_score": task[
                        "priority_score"
                    ],
                    "priority_level": task[
                        "priority_level"
                    ],
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
                    "block_date": block[
                        "block_date"
                    ],
                    "start_time": block[
                        "start_time"
                    ],
                    "end_time": block[
                        "end_time"
                    ],
                    "block_duration_minutes": block[
                        "duration_minutes"
                    ],
                    "block_type": block[
                        "block_type"
                    ],
                    "approval_status": block[
                        "approval_status"
                    ],
                    "status": "Scheduled",
                }
            )

    output_columns = [
        "task_id",
        "asset_id",
        "corridor_id",
        "planning_corridor_id",
        "section_id",
        "planning_section_id",
        "maintenance_type",
        "required_block_type",
        "priority_score",
        "priority_level",
        "estimated_duration_minutes",
        "duration_buffer_minutes",
        "planning_duration_minutes",
        "block_id",
        "block_date",
        "start_time",
        "end_time",
        "block_duration_minutes",
        "block_type",
        "approval_status",
        "status",
    ]

    return pd.DataFrame(
        scheduled_rows,
        columns=output_columns,
    )


def print_block_utilization(plan):
    """
    Display how many tasks were assigned to each block.
    """

    if plan.empty:
        print("\nNo block utilization data available.")
        return

    block_summary = (
        plan.groupby(
            [
                "block_id",
                "block_duration_minutes",
            ]
        )
        .agg(
            assigned_tasks=(
                "task_id",
                "count",
            ),
            used_minutes=(
                "planning_duration_minutes",
                "sum",
            ),
        )
        .reset_index()
    )

    block_summary["remaining_minutes"] = (
        block_summary["block_duration_minutes"]
        - block_summary["used_minutes"]
    )

    print("\nBlock utilization:")
    print(
        block_summary.to_string(
            index=False
        )
    )


def optimize_plan():
    tasks, blocks, trains = load_data()

    print(
        f"Loaded {len(tasks)} maintenance tasks."
    )

    print(
        f"Loaded {len(blocks)} block windows."
    )

    print(
        f"Loaded {len(trains)} train movements."
    )

    solver, decision_variables = (
        create_optimization_model(
            tasks,
            blocks,
            trains,
        )
    )

    print(
        f"\nCompatible task-block assignments: "
        f"{len(decision_variables)}"
    )

    print("Starting optimization...")

    result_status = solver.Solve()

    if result_status not in [
        pywraplp.Solver.OPTIMAL,
        pywraplp.Solver.FEASIBLE,
    ]:

        print(
            "No feasible optimization solution found."
        )

        empty_plan = extract_solution(
            tasks,
            blocks,
            solver,
            decision_variables,
        )

        empty_plan.to_csv(
            OUTPUT_FILE,
            index=False,
        )

        print(
            f"Empty output saved to: {OUTPUT_FILE}"
        )

        return empty_plan

    plan = extract_solution(
        tasks,
        blocks,
        solver,
        decision_variables,
    )

    plan.to_csv(
        OUTPUT_FILE,
        index=False,
    )

    print("\nOptimization completed.")

    print(
        f"Scheduled tasks: {len(plan)}"
    )

    print(
        f"Unscheduled tasks: "
        f"{len(tasks) - len(plan)}"
    )

    print(
        f"Output saved to: {OUTPUT_FILE}"
    )

    print_block_utilization(plan)

    if not plan.empty:
        print("\nFirst scheduled tasks:")
        print(
            plan.head(10).to_string(
                index=False
            )
        )
    else:
        print(
            "\nNo tasks were scheduled."
        )

    return plan


if __name__ == "__main__":
    optimize_plan()