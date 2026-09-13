from pathlib import Path

import pandas as pd

from resource_utils import (
    parse_required_resources,
)


DATA_DIR = (
    Path(__file__).resolve().parent.parent / "data"
)

TASKS_FILE = DATA_DIR / "prioritized_tasks.csv"


def analyze_bundle_candidates():
    tasks = pd.read_csv(TASKS_FILE)

    # Normalize corridor IDs for comparison.
    tasks["normalized_corridor_id"] = (
        tasks["corridor_id"]
        .astype(str)
        .str.replace("CORR_", "C", regex=False)
    )

    # Parse resource requirements.
    tasks["resource_list"] = (
        tasks["required_resources"]
        .apply(parse_required_resources)
    )

    compatible_pairs = []

    for i in range(len(tasks)):
        task_a = tasks.iloc[i]

        for j in range(i + 1, len(tasks)):
            task_b = tasks.iloc[j]

            # Rule 1: Same corridor.
            if (
                task_a["normalized_corridor_id"]
                != task_b["normalized_corridor_id"]
            ):
                continue

            # Rule 2: Same required block type.
            if (
                task_a["required_block_type"]
                != task_b["required_block_type"]
            ):
                continue

            # Rule 3: Same section.
            if (
                task_a["section_id"]
                != task_b["section_id"]
            ):
                continue

            # Rule 4: No shared required resource.
            resources_a = set(task_a["resource_list"])
            resources_b = set(task_b["resource_list"])

            if resources_a.intersection(resources_b):
                continue

            combined_duration = (
                int(task_a["estimated_duration_minutes"])
                + int(task_b["estimated_duration_minutes"])
                + max(
                    int(task_a["duration_buffer_minutes"]),
                    int(task_b["duration_buffer_minutes"]),
                )
            )

            compatible_pairs.append(
                {
                    "task_a": task_a["task_id"],
                    "task_b": task_b["task_id"],
                    "corridor_id": task_a["normalized_corridor_id"],
                    "section_id": task_a["section_id"],
                    "required_block_type": task_a["required_block_type"],
                    "combined_duration_minutes": combined_duration,
                }
            )

    result = pd.DataFrame(compatible_pairs)

    print("Bundle candidate analysis completed.")
    print(f"Total maintenance tasks: {len(tasks)}")
    print(f"Compatible task pairs: {len(result)}")

    if not result.empty:
        print("\nSample compatible pairs:")
        print(result.head(10).to_string(index=False))
    else:
        print(
            "\nNo compatible pairs found using the current rules."
        )

    return result


if __name__ == "__main__":
    analyze_bundle_candidates()