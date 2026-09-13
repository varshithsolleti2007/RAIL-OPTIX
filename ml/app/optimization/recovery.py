"""
Recovery re-assignment after a block failure/disruption.

JSON-based rebuild of the previous prototype's recovery_optimizer.py
(CLAUDE_CODE_PROJECT_CONTEXT.md §22). `tasks` here are already the ones
needing recovery (identified upstream, e.g. via the simulator's
`replanning_required` flag) - this module's job is only to find each one
a compatible alternate block.
"""

from app.core.mappings import normalize_block_type, normalize_corridor, normalize_section

MODEL_VERSION = "v1"


def _is_compatible(task: dict, block: dict, failed_block_ids: set[str]) -> bool:
    if str(block["block_id"]) in failed_block_ids:
        return False
    if not block.get("approved", True):
        return False
    if normalize_corridor(task["corridor_id"]) != normalize_corridor(block["corridor_id"]):
        return False
    if normalize_section(task["section_id"]) != normalize_section(block["section_id"]):
        return False
    if normalize_block_type(task["required_block_type"]) != normalize_block_type(block["block_type"]):
        return False
    return task["duration_minutes"] <= block["duration_minutes"]


def recommend_recovery(tasks: list[dict], available_blocks: list[dict], failed_block_ids: list[str]) -> dict:
    failed_ids = {str(b) for b in failed_block_ids}

    # Higher-priority tasks pick a replacement block first.
    ordered_tasks = sorted(tasks, key=lambda t: t.get("priority_score", 0), reverse=True)

    assignments = []

    for task in ordered_tasks:
        candidates = [
            block for block in available_blocks if _is_compatible(task, block, failed_ids)
        ]
        candidates.sort(key=lambda b: b["duration_minutes"] - task["duration_minutes"])

        if candidates:
            best = candidates[0]
            assignments.append(
                {
                    "task_id": task["task_id"],
                    "recovery_block_id": best["block_id"],
                    "status": "Reassigned",
                    "reason": "Compatible recovery block found.",
                }
            )
        else:
            assignments.append(
                {
                    "task_id": task["task_id"],
                    "recovery_block_id": None,
                    "status": "No Compatible Block",
                    "reason": "No compatible recovery block available.",
                }
            )

    return {"assignments": assignments, "model_version": MODEL_VERSION}
