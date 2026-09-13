from itertools import combinations
from pathlib import Path

import pandas as pd

from backend.app.services.bundle_utils import (
    are_tasks_compatible,
    calculate_bundle_duration,
    normalize_corridor_id,
)
from backend.app.services.resource_utils import parse_required_resources


DATA_DIR = (
    Path(__file__).resolve().parent.parent / "data"
)

TASKS_FILE = DATA_DIR / "prioritized_tasks.csv"

MAX_BUNDLE_TASKS = 3
MAX_BLOCK_DURATION = 180


def has_resource_conflict(tasks):
    """
    Return True if any resource is required by more than one task.
    """

    all_resources = []

    for task in tasks:
        resources = parse_required_resources(
            task["required_resources"]
        )
        all_resources.extend(resources)

    return len(all_resources) != len(set(all_resources))


def generate_bundle_candidates():
    tasks = pd.read_csv(TASKS_FILE)

    tasks["normalized_corridor_id"] = (
        tasks["corridor_id"]
        .apply(normalize_corridor_id)
    )

    candidates = []

    # Group tasks by preliminary compatibility attributes.
    grouped = tasks.groupby(
        [
            "normalized_corridor_id",
            "section_id",
            "required_block_type",
        ]
    )

    for group_key, group in grouped:
        group_tasks = [
            row
            for _, row in group.iterrows()
        ]

        # Test bundles of size 2 and 3.
        for bundle_size in range(
            2,
            MAX_BUNDLE_TASKS + 1,
        ):
            for selected_tasks in combinations(
                group_tasks,
                bundle_size,
            ):
                # Confirm pairwise compatibility.
                compatible = True

                for task_a, task_b in combinations(
                    selected_tasks,
                    2,
                ):
                    if not are_tasks_compatible(
                        task_a,
                        task_b,
                    ):
                        compatible = False
                        break

                if not compatible:
                    continue

                # Reject overlapping resource requirements.
                if has_resource_conflict(
                    selected_tasks
                ):
                    continue

                combined_duration = (
                    calculate_bundle_duration(
                        list(selected_tasks)
                    )
                )

                # The largest available block is 180 minutes.
                if combined_duration > MAX_BLOCK_DURATION:
                    continue

                candidates.append(
                    {
                        "bundle_id": (
                            f"BUNDLE_{len(candidates) + 1:04d}"
                        ),
                        "task_ids": "|".join(
                            task["task_id"]
                            for task in selected_tasks
                        ),
                        "task_count": bundle_size,
                        "corridor_id": group_key[0],
                        "section_id": group_key[1],
                        "required_block_type": group_key[2],
                        "combined_duration_minutes": combined_duration,
                        "total_priority_score": round(
                            sum(
                                float(
                                    task["priority_score"]
                                )
                                for task in selected_tasks
                            ),
                            2,
                        ),
                    }
                )

    result = pd.DataFrame(candidates)

    output_file = DATA_DIR / "bundle_candidates.csv"
    result.to_csv(output_file, index=False)
    print(f"Saved bundle candidates to: {output_file}")
    print("Bundle candidate generation completed.")
    print("Bundle candidate generation completed.")
    
    print(f"Total maintenance tasks: {len(tasks)}")
    print(f"Candidate bundles: {len(result)}")

    if not result.empty:
        print("\nBundle size distribution:")
        print(
            result["task_count"]
            .value_counts()
            .sort_index()
            .to_string()
        )

        print("\nSample bundle candidates:")
        print(
            result.head(15).to_string(
                index=False
            )
        )
    else:
        print(
            "\nNo feasible bundle candidates found."
        )

    return result


if __name__ == "__main__":
    generate_bundle_candidates()