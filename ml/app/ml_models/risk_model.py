"""
Prototype task-risk model.

IMPORTANT (CLAUDE_CODE_PROJECT_CONTEXT.md §8.2 / §17.1): the training
label below is synthetic/rule-based, not a validated real-world railway
risk standard. Do not represent this model as operationally validated.
"""

import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from app.services.data_generation import write_training_csv, DATA_DIR

MODEL_VERSION = "v1"

MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
MODEL_FILE = MODEL_DIR / "maintenance_risk_model.joblib"
METADATA_FILE = MODEL_DIR / "maintenance_risk_model.metadata.json"

FEATURE_COLUMNS = [
    "condition_score",
    "asset_age_years",
    "failure_count_12m",
    "overdue_days",
    "safety_criticality",
    "operational_criticality",
    "department",
]
CATEGORICAL_FEATURES = ["safety_criticality", "operational_criticality", "department"]
NUMERICAL_FEATURES = ["condition_score", "asset_age_years", "failure_count_12m", "overdue_days"]

_cached_pipeline = None


def create_risk_target(df: pd.DataFrame) -> pd.DataFrame:
    risk_points = (
        (df["condition_score"] < 50).astype(int)
        + (df["overdue_days"] > 30).astype(int)
        + (df["failure_count_12m"] >= 3).astype(int)
        + (df["safety_criticality"] == "High").astype(int)
    )
    df["risk_label"] = (risk_points >= 3).astype(int)
    return df


def train_model() -> Pipeline:
    training_csv = DATA_DIR / "maintenance_tasks_training.csv"

    if not training_csv.exists():
        training_csv = write_training_csv()

    df = pd.read_csv(training_csv)
    df = create_risk_target(df)

    X = df[FEATURE_COLUMNS]
    y = df["risk_label"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("categorical", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
            ("numerical", "passthrough", NUMERICAL_FEATURES),
        ]
    )

    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
    pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("model", model)])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline.fit(X_train, y_train)
    predictions = pipeline.predict(X_test)
    report = classification_report(y_test, predictions, output_dict=True)

    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(pipeline, MODEL_FILE)

    METADATA_FILE.write_text(
        json.dumps({"model_version": MODEL_VERSION, "evaluation": report}, indent=2)
    )

    return pipeline


def _load_pipeline() -> Pipeline:
    global _cached_pipeline

    if _cached_pipeline is not None:
        return _cached_pipeline

    if not MODEL_FILE.exists():
        _cached_pipeline = train_model()
    else:
        _cached_pipeline = joblib.load(MODEL_FILE)

    return _cached_pipeline


def predict_risk(tasks: list[dict]) -> list[dict]:
    """
    tasks: list of dicts with FEATURE_COLUMNS + task_id.
    Returns: list of {task_id, risk_level, risk_probability, model_version}.
    """
    pipeline = _load_pipeline()

    df = pd.DataFrame(tasks)
    X = df[FEATURE_COLUMNS]

    probabilities = pipeline.predict_proba(X)[:, 1]
    predictions = pipeline.predict(X)

    results = []
    for task_id, prediction, probability in zip(df["task_id"], predictions, probabilities):
        results.append(
            {
                "task_id": task_id,
                "risk_level": "High" if prediction == 1 else "Low",
                "risk_probability": round(float(probability), 4),
                "model_version": MODEL_VERSION,
            }
        )

    return results


if __name__ == "__main__":
    train_model()
    print(f"Model trained and saved to: {MODEL_FILE}")
    print(f"Metadata saved to: {METADATA_FILE}")
