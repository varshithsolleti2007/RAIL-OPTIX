from pathlib import Path

import joblib
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


DATA_DIR = (
    Path(__file__).resolve().parent.parent / "data"
)

MODEL_DIR = Path(__file__).resolve().parent / "saved_models"
MODEL_DIR.mkdir(exist_ok=True)

MODEL_FILE = MODEL_DIR / "maintenance_risk_model.joblib"


def load_training_data():
    file_path = DATA_DIR / "maintenance_tasks.csv"

    df = pd.read_csv(file_path)

    return df


def create_risk_target(df):
    """
    Create a prototype risk label from maintenance conditions.

    This rule is only for synthetic demonstration data.
    It is not an official railway risk standard.
    """

    risk_points = (
        (df["condition_score"] < 50).astype(int)
        + (df["overdue_days"] > 30).astype(int)
        + (df["failure_count_12m"] >= 3).astype(int)
        + (df["safety_criticality"] == "High").astype(int)
    )

    df["risk_label"] = (
        risk_points >= 3
    ).astype(int)

    return df


def train_model():
    df = load_training_data()
    df = create_risk_target(df)

    feature_columns = [
        "condition_score",
        "asset_age_years",
        "failure_count_12m",
        "overdue_days",
        "safety_criticality",
        "operational_criticality",
        "maintenance_type",
        "department",
    ]

    target_column = "risk_label"

    X = df[feature_columns]
    y = df[target_column]

    categorical_features = [
        "safety_criticality",
        "operational_criticality",
        "maintenance_type",
        "department",
    ]

    numerical_features = [
        "condition_score",
        "asset_age_years",
        "failure_count_12m",
        "overdue_days",
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore"
                ),
                categorical_features,
            ),
            (
                "numerical",
                "passthrough",
                numerical_features,
            ),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        class_weight="balanced",
    )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("model", model),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    pipeline.fit(X_train, y_train)

    predictions = pipeline.predict(X_test)

    print("Model evaluation:")
    print(classification_report(y_test, predictions))

    joblib.dump(
        pipeline,
        MODEL_FILE,
    )

    print(f"Model saved to: {MODEL_FILE}")

    return pipeline


if __name__ == "__main__":
    train_model()