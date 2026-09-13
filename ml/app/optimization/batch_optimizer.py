"""
MILP task-to-block assignment (OR-Tools/SCIP).

This is a clean, JSON-based rebuild of the previous prototype's
basic_optimizer.py. Per CLAUDE_CODE_PROJECT_CONTEXT.md §46/§19, the MILP
approach itself is preserved deliberately - it is the strongest part of
the original repository and must not be replaced with a fake heuristic.
"""

from itertools import combinations

from ortools.linear_solver import pywraplp

from app.core.mappings import normalize_block_type, normalize_corridor, normalize_section

MODEL_VERSION = "v1"

PRIORITY_LEVEL_WEIGHTS = {"Urgent": 3.0, "High": 2.0, "Medium": 1.0, "Low": 0.5}


def _tasks_have_resource_conflict(task_a: dict, task_b: dict) -> bool:
    resources_a = set(task_a.get("required_resources", []))
    resources_b = set(task_b.get("required_resources", []))
    return bool(resources_a.intersection(resources_b))


def _tasks_are_compatible(task_a: dict, task_b: dict) -> bool:
    if normalize_corridor(task_a["corridor_id"]) != normalize_corridor(task_b["corridor_id"]):
        return False
    if normalize_section(task_a["section_id"]) != normalize_section(task_b["section_id"]):
        return False
    if normalize_block_type(task_a["required_block_type"]) != normalize_block_type(task_b["required_block_type"]):
        return False
    return not _tasks_have_resource_conflict(task_a, task_b)


def optimize(tasks: list[dict], blocks: list[dict]) -> dict:
    solver = pywraplp.Solver.CreateSolver("SCIP")
    if solver is None:
        raise RuntimeError("SCIP solver could not be created.")

    decision_variables = {}

    for t_idx, task in enumerate(tasks):
        for b_idx, block in enumerate(blocks):
            if normalize_corridor(task["corridor_id"]) != normalize_corridor(block["corridor_id"]):
                continue
            if normalize_section(task["section_id"]) != normalize_section(block["section_id"]):
                continue
            if normalize_block_type(task["required_block_type"]) != normalize_block_type(block["block_type"]):
                continue
            if not block.get("approved", True):
                continue
            if task["duration_minutes"] > block["duration_minutes"]:
                continue

            decision_variables[(t_idx, b_idx)] = solver.BoolVar(f"x_{t_idx}_{b_idx}")

    # Constraint: each task assigned to at most one block.
    for t_idx in range(len(tasks)):
        task_vars = [v for (ti, _), v in decision_variables.items() if ti == t_idx]
        if task_vars:
            solver.Add(solver.Sum(task_vars) <= 1)

    # Constraint: block duration capacity.
    for b_idx, block in enumerate(blocks):
        block_vars = [
            tasks[ti]["duration_minutes"] * v for (ti, bi), v in decision_variables.items() if bi == b_idx
        ]
        if block_vars:
            solver.Add(solver.Sum(block_vars) <= block["duration_minutes"])

    # Constraint: incompatible task pairs cannot share a block.
    for b_idx in range(len(blocks)):
        block_task_indices = [ti for (ti, bi) in decision_variables.keys() if bi == b_idx]

        for t_idx_a, t_idx_b in combinations(block_task_indices, 2):
            if not _tasks_are_compatible(tasks[t_idx_a], tasks[t_idx_b]):
                var_a = decision_variables.get((t_idx_a, b_idx))
                var_b = decision_variables.get((t_idx_b, b_idx))
                if var_a is not None and var_b is not None:
                    solver.Add(var_a + var_b <= 1)

    # Objective: maximize priority-weighted assignment.
    objective_terms = []
    for (t_idx, b_idx), var in decision_variables.items():
        task = tasks[t_idx]
        weight = PRIORITY_LEVEL_WEIGHTS.get(task["priority_level"], 1.0)
        objective_terms.append(task["priority_score"] * weight * var)

    if objective_terms:
        solver.Maximize(solver.Sum(objective_terms))

    status = solver.Solve()

    assignments = []
    if status in (pywraplp.Solver.OPTIMAL, pywraplp.Solver.FEASIBLE):
        for (t_idx, b_idx), var in decision_variables.items():
            if var.solution_value() > 0.5:
                assignments.append({"task_id": tasks[t_idx]["task_id"], "block_id": blocks[b_idx]["block_id"]})

    scheduled_task_ids = {a["task_id"] for a in assignments}
    unscheduled_task_ids = [t["task_id"] for t in tasks if t["task_id"] not in scheduled_task_ids]

    return {
        "assignments": assignments,
        "unscheduled_task_ids": unscheduled_task_ids,
        "model_version": MODEL_VERSION,
    }
