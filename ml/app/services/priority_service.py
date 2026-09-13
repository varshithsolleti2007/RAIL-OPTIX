"""
Priority scoring - combines risk, urgency and criticality into one score.

Formula matches the previous prototype's heuristic
(CLAUDE_CODE_PROJECT_CONTEXT.md §18): Priority = Work Importance + Urgency
+ Risk + Operational Factors. Kept as JSON in/out rather than CSV.
"""

SAFETY_WEIGHTS = {"High": 25, "Medium": 12, "Low": 5}
OPERATIONAL_WEIGHTS = {"High": 15, "Medium": 8, "Low": 3}


def score_priority(tasks: list[dict]) -> list[dict]:
    """
    tasks: list of dicts with task_id, risk_probability, overdue_days,
    condition_score, safety_criticality, operational_criticality.
    """
    results = []

    for task in tasks:
        score = task["risk_probability"] * 50
        score += max(0, task["overdue_days"]) * 0.5
        score += (100 - task["condition_score"]) * 0.2
        score += SAFETY_WEIGHTS.get(task["safety_criticality"], 0)
        score += OPERATIONAL_WEIGHTS.get(task["operational_criticality"], 0)
        score = round(score, 2)

        if score > 70:
            level = "Urgent"
        elif score > 40:
            level = "Important"
        else:
            level = "Normal"

        results.append({"task_id": task["task_id"], "priority_score": score, "priority_level": level})

    return results
