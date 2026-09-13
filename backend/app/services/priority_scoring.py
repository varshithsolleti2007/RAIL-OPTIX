from pathlib import Path

import pandas as pd


DATA_DIR = (
    Path(__file__).resolve().parent.parent / "data"
)

INPUT_FILE = DATA_DIR / "maintenance_tasks_with_risk.csv"

OUTPUT_FILE = DATA_DIR / "prioritized_tasks.csv"


def calculate_priority():
    df = pd.read_csv(INPUT_FILE)

    # Start with the ML risk prediction
    df["priority_score"] = (
        df["risk_probability"] * 50
    )

    # Add points for overdue maintenance
    df["priority_score"] += (
        df["overdue_days"].clip(lower=0) * 0.5
    )

    # Add points for poor asset condition
    df["priority_score"] += (
        (100 - df["condition_score"]) * 0.2
    )

    # Add points for safety criticality
    df["priority_score"] += (
        df["safety_criticality"]
        .map(
            {
                "High": 25,
                "Medium": 12,
                "Low": 5,
            }
        )
        .fillna(0)
    )

    # Add points for operational criticality
    df["priority_score"] += (
        df["operational_criticality"]
        .map(
            {
                "High": 15,
                "Medium": 8,
                "Low": 3,
            }
        )
        .fillna(0)
    )

    # Round the score for readability
    df["priority_score"] = (
        df["priority_score"].round(2)
    )

    # Assign priority categories
    df["priority_level"] = pd.cut(
        df["priority_score"],
        bins=[
            -float("inf"),
            40,
            70,
            float("inf"),
        ],
        labels=[
            "Normal",
            "Important",
            "Urgent",
        ],
    )

    # Highest priority appears first
    df = df.sort_values(
        by="priority_score",
        ascending=False,
    )

    # Save the prioritized tasks
    df.to_csv(OUTPUT_FILE, index=False)

    print("Priority scoring completed.")
    print(f"Output saved to: {OUTPUT_FILE}")

    print("\nTop 10 prioritized tasks:")
    print(
        df[
            [
                "task_id",
                "asset_id",
                "risk_level",
                "risk_probability",
                "overdue_days",
                "safety_criticality",
                "operational_criticality",
                "priority_score",
                "priority_level",
            ]
        ]
        .head(10)
        .to_string(index=False)
    )

    return df


if __name__ == "__main__":
    calculate_priority()