from pathlib import Path

import joblib
import pandas as pd


DATA_DIR = (
    Path(__file__).resolve().parent.parent / "data"
)

MODEL_FILE = (
    Path(__file__).resolve().parent
    / "saved_models"
    / "maintenance_risk_model.joblib"
)

OUTPUT_FILE = (
    DATA_DIR / "maintenance_tasks_with_risk.csv"
)


FEATURE_COLUMNS = [
    "condition_score",
    "asset_age_years",
    "failure_count_12m",
    "overdue_days",
    "safety_criticality",
    "operational_criticality",
    "maintenance_type",
    "department",
]


def predict_risk():
    # Load maintenance task data
    input_file = DATA_DIR / "maintenance_tasks.csv"
    df = pd.read_csv(input_file)

    # Load the trained machine learning model
    model = joblib.load(MODEL_FILE)

    # Select the same features used during training
    X = df[FEATURE_COLUMNS]

    # Predict risk class
    df["risk_prediction"] = model.predict(X)

    # Predict probability of high risk
    df["risk_probability"] = (
        model.predict_proba(X)[:, 1].round(4)
    )

    # Convert numeric prediction into readable text
    df["risk_level"] = df["risk_prediction"].map(
        {
            0: "Low",
            1: "High",
        }
    )

    # Save the enriched dataset
    df.to_csv(OUTPUT_FILE, index=False)

    print("Risk prediction completed.")
    print(f"Output saved to: {OUTPUT_FILE}")

    print("\nSample predictions:")
    print(
        df[
            [
                "task_id",
                "risk_prediction",
                "risk_probability",
                "risk_level",
            ]
        ]
        .head(10)
        .to_string(index=False)
    )

    return df


if __name__ == "__main__":
    predict_risk()