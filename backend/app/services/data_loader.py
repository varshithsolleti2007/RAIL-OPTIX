from pathlib import Path

import pandas as pd

from app.validation.schema_validator import validate_all_datasets


DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def load_datasets():
    """
    Load all synthetic railway planning datasets.
    """

    datasets = {
        "maintenance_tasks": pd.read_csv(
            DATA_DIR / "maintenance_tasks.csv"
        ),
        "train_movements": pd.read_csv(
            DATA_DIR / "train_movements.csv"
        ),
        "goods_forecasts": pd.read_csv(
            DATA_DIR / "goods_forecasts.csv"
        ),
        "block_windows": pd.read_csv(
            DATA_DIR / "block_windows.csv"
        ),
        "resources": pd.read_csv(
            DATA_DIR / "resources.csv"
        ),
    }

    return datasets


def validate_datasets(datasets):
    """
    Run the central schema and data-quality validator.

    Returns:
        list[str]: Validation errors.
    """

    errors = validate_all_datasets(datasets)

    return errors


def load_and_validate_datasets():
    """
    Load datasets and validate them before planning starts.

    Returns:
        dict: Validated datasets.

    Raises:
        ValueError: If one or more datasets fail validation.
    """

    datasets = load_datasets()
    validation_errors = validate_datasets(datasets)

    if validation_errors:
        error_message = "\n".join(
            f"- {error}" for error in validation_errors
        )

        raise ValueError(
            "Dataset validation failed:\n"
            f"{error_message}"
        )

    return datasets


if __name__ == "__main__":
    try:
        datasets = load_and_validate_datasets()

        print("Datasets loaded and validated successfully.\n")

        for name, dataframe in datasets.items():
            print(
                f"{name}: "
                f"{len(dataframe)} rows, "
                f"{len(dataframe.columns)} columns"
            )

        print("\nAll datasets passed validation.")

    except ValueError as error:
        print(str(error))