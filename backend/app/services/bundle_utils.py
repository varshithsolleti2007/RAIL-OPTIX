from typing import Dict, List, Set

import pandas as pd

from backend.app.services.resource_utils import parse_required_resources


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


def normalize_corridor_id(corridor_id: str) -> str:
    value = str(corridor_id).strip()

    if value.startswith("CORR_"):
        number = value.replace("CORR_", "")
        number = number.lstrip("0") or "0"
        return f"C{number}"

    return value


def normalize_section_id(section_id: str) -> str:
    value = str(section_id).strip()

    if value in TASK_TO_BLOCK_SECTION:
        return TASK_TO_BLOCK_SECTION[value]

    return value


def get_task_resources(task: pd.Series) -> Set[str]:
    return set(
        parse_required_resources(
            task.get("required_resources")
        )
    )


def are_tasks_compatible(
    task_a: pd.Series,
    task_b: pd.Series,
) -> bool:
    corridor_a = normalize_corridor_id(
        task_a["corridor_id"]
    )
    corridor_b = normalize_corridor_id(
        task_b["corridor_id"]
    )

    if corridor_a != corridor_b:
        return False

    section_a = normalize_section_id(
        task_a["section_id"]
    )
    section_b = normalize_section_id(
        task_b["section_id"]
    )

    if section_a != section_b:
        return False

    if (
        task_a["required_block_type"]
        != task_b["required_block_type"]
    ):
        return False

    resources_a = get_task_resources(task_a)
    resources_b = get_task_resources(task_b)

    if resources_a.intersection(resources_b):
        return False

    return True


def calculate_bundle_duration(
    tasks: List[pd.Series],
) -> int:
    if not tasks:
        return 0

    work_duration = sum(
        int(task["estimated_duration_minutes"])
        for task in tasks
    )

    shared_buffer = max(
        int(task["duration_buffer_minutes"])
        for task in tasks
    )

    return work_duration + shared_buffer


def bundle_summary(
    tasks: List[pd.Series],
) -> Dict:
    if not tasks:
        return {
            "task_count": 0,
            "task_ids": [],
            "combined_duration_minutes": 0,
        }

    return {
        "task_count": len(tasks),
        "task_ids": [
            task["task_id"]
            for task in tasks
        ],
        "corridor_id": normalize_corridor_id(
            tasks[0]["corridor_id"]
        ),
        "section_id": normalize_section_id(
            tasks[0]["section_id"]
        ),
        "required_block_type": tasks[0][
            "required_block_type"
        ],
        "combined_duration_minutes": (
            calculate_bundle_duration(tasks)
        ),
    }