"""
Synthetic historical training data for the risk model.

Per CLAUDE_CODE_PROJECT_CONTEXT.md §44, CSV stays in this repo only for
offline training/historical/demo purposes - it is never the live
integration path (that's JSON over the /api/* endpoints).
"""

import random
from pathlib import Path

import pandas as pd

random.seed(42)

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"

DEPARTMENTS = ["Engineering", "Electrical", "S&T"]
MAINTENANCE_TYPES = {
    "Engineering": ["Track Maintenance", "Track Inspection", "Civil Maintenance"],
    "Electrical": ["OHE Maintenance", "Electrical Inspection", "Traction Work"],
    "S&T": ["Signal Maintenance", "Interlocking Work", "Telecom Maintenance"],
}
CRITICALITY = ["Low", "Medium", "High"]


def generate_synthetic_maintenance_tasks(n: int = 300) -> pd.DataFrame:
    rows = []

    for i in range(n):
        department = random.choice(DEPARTMENTS)

        rows.append(
            {
                "task_id": f"TASK_{i + 1:04d}",
                "department": department,
                "maintenance_type": random.choice(MAINTENANCE_TYPES[department]),
                "condition_score": round(random.uniform(20, 100), 1),
                "asset_age_years": round(random.uniform(0, 40), 1),
                "failure_count_12m": random.randint(0, 6),
                "overdue_days": max(0, random.randint(-10, 90)),
                "safety_criticality": random.choice(CRITICALITY),
                "operational_criticality": random.choice(CRITICALITY),
            }
        )

    return pd.DataFrame(rows)


def write_training_csv(n: int = 300) -> Path:
    DATA_DIR.mkdir(exist_ok=True)
    df = generate_synthetic_maintenance_tasks(n)
    output_path = DATA_DIR / "maintenance_tasks_training.csv"
    df.to_csv(output_path, index=False)
    return output_path


if __name__ == "__main__":
    path = write_training_csv()
    print(f"Synthetic training data written to: {path}")
