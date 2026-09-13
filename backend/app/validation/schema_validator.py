from pathlib import Path
from typing import Dict, List, Any

import pandas as pd


# -------------------------------------------------------------------
# Dataset schemas
# -------------------------------------------------------------------

REQUIRED_COLUMNS = {
    "maintenance_tasks": [
        "task_id",
        "corridor_id",
        "section_id",
        "maintenance_type",
        "required_block_type",
        "estimated_duration_minutes",
    ],
    "block_windows": [
        "block_id",
        "corridor_id",
        "section_id",
        "block_type",
        "start_time",
        "end_time",
    ],
    "train_movements": [
        "movement_id",
        "train_id",
        "corridor_id",
        "scheduled_departure",
        "scheduled_arrival",
    ],
    "resources": [
        "resource_id",
    ],
    "goods_forecasts": [
        "corridor_id",
    ],
}


# -------------------------------------------------------------------
# Optional columns
# -------------------------------------------------------------------

OPTIONAL_COLUMNS = {
    "maintenance_tasks": [
        "asset_id",
        "asset_type",
        "department",
        "defect_description",
        "last_maintenance_date",
        "maintenance_interval_days",
        "next_due_date",
        "overdue_days",
        "condition_score",
        "asset_age_years",
        "failure_count_12m",
        "safety_criticality",
        "operational_criticality",
        "duration_buffer_minutes",
        "required_team",
        "required_resources",
        "status",
        "priority",
        "approval_status",
        "risk_score",
        "risk_level",
    ],
    "block_windows": [
        "approval_status",
        "available_capacity",
        "max_tasks",
    ],
    "train_movements": [
        "train_type",
        "direction",
        "duration_minutes",
        "speed_kmph",
        "is_peak_period",
        "operational_priority",
    ],
    "resources": [
        "resource_type",
        "quantity",
        "availability",
        "corridor_id",
    ],
    "goods_forecasts": [
        "forecast_date",
        "forecast_quantity",
        "goods_type",
        "volume",
    ],
}


# -------------------------------------------------------------------
# Dataset-specific column aliases
# -------------------------------------------------------------------

COLUMN_ALIASES = {
    "maintenance_tasks": {
        "taskid": "task_id",
        "maintenance_id": "task_id",
        "maintenance_task_id": "task_id",

        "corridor": "corridor_id",
        "corridorid": "corridor_id",

        "section": "section_id",
        "sectionid": "section_id",

        "task": "maintenance_type",
        "task_type": "maintenance_type",
        "taskcategory": "maintenance_type",
        "maintenance_category": "maintenance_type",

        "blocktype": "required_block_type",
        "requiredblock": "required_block_type",
        "required_block": "required_block_type",

        "duration": "estimated_duration_minutes",
        "durationmins": "estimated_duration_minutes",
        "duration_min": "estimated_duration_minutes",
        "duration_minutes": "estimated_duration_minutes",
        "estimated_duration": "estimated_duration_minutes",

        "approval": "approval_status",
        "approvalstate": "approval_status",
    },

    "block_windows": {
        "blockid": "block_id",
        "blockwindowid": "block_id",

        "corridor": "corridor_id",
        "corridorid": "corridor_id",

        "section": "section_id",
        "sectionid": "section_id",

        "blocktype": "block_type",
        "block_category": "block_type",

        "start": "start_time",
        "start_datetime": "start_time",
        "window_start": "start_time",

        "end": "end_time",
        "end_datetime": "end_time",
        "window_end": "end_time",

        "approval": "approval_status",
        "capacity": "available_capacity",
        "max_capacity": "available_capacity",
    },

    "train_movements": {
        "movementid": "movement_id",
        "trainid": "train_id",
        "train": "train_id",

        "corridor": "corridor_id",
        "corridorid": "corridor_id",

        "departure": "scheduled_departure",
        "departure_time": "scheduled_departure",
        "scheduled_departure_time": "scheduled_departure",

        "arrival": "scheduled_arrival",
        "arrival_time": "scheduled_arrival",
        "scheduled_arrival_time": "scheduled_arrival",

        "duration": "duration_minutes",
        "duration_min": "duration_minutes",

        "peak": "is_peak_period",
        "priority": "operational_priority",
    },

    "resources": {
        "resourceid": "resource_id",
        "resource": "resource_id",

        "type": "resource_type",
        "resourcecategory": "resource_type",

        "count": "quantity",
        "amount": "quantity",

        "status": "availability",

        "corridor": "corridor_id",
        "corridorid": "corridor_id",
    },

    "goods_forecasts": {
        "corridor": "corridor_id",
        "corridorid": "corridor_id",

        "date": "forecast_date",
        "forecasted_date": "forecast_date",

        "forecasted_quantity": "forecast_quantity",
        "forecast_qty": "forecast_quantity",
        "quantity": "forecast_quantity",

        "goods_category": "goods_type",
    },
}


# -------------------------------------------------------------------
# Column-name normalization
# -------------------------------------------------------------------

def normalize_column_name(column_name: Any) -> str:
    """
    Normalize column names.

    Example:
        Scheduled Departure -> scheduled_departure
        duration-minutes    -> duration_minutes
    """
    value = str(column_name).strip().lower()

    for character in [
        " ",
        "-",
        "/",
        ".",
        "(",
        ")",
        "[",
        "]",
    ]:
        value = value.replace(character, "_")

    while "__" in value:
        value = value.replace("__", "_")

    return value.strip("_")


# -------------------------------------------------------------------
# Value normalization
# -------------------------------------------------------------------

def normalize_corridor(value: Any) -> Any:
    """
    Normalize corridor values.

    Examples:
        C1       -> C1
        c1       -> C1
        CORR_01  -> C1
        corr-01  -> C1
    """
    if pd.isna(value):
        return value

    text = str(value).strip().upper()

    prefixes = [
        "CORRIDOR_",
        "CORR_",
        "CORR-",
    ]

    for prefix in prefixes:
        if text.startswith(prefix):
            suffix = text.replace(prefix, "", 1)

            if suffix.isdigit():
                return f"C{int(suffix)}"

    if text.startswith("C") and text[1:].isdigit():
        return f"C{int(text[1:])}"

    return text


def normalize_section(value: Any) -> Any:
    """
    Normalize section values.
    """
    if pd.isna(value):
        return value

    text = str(value).strip().upper()

    replacements = {
        "SECTION_A_B": "SEC_A_B",
        "SECTION_B_C": "SEC_B_C",
        "SECTION_C_D": "SEC_C_D",
        "SECTION_D_E": "SEC_D_E",
        "SECTION_E_F": "SEC_E_F",
        "SECTION_F_G": "SEC_F_G",
        "SECTION_G_H": "SEC_G_H",
        "SECTION_H_I": "SEC_H_I",
    }

    return replacements.get(text, text)


def normalize_block_type(value: Any) -> Any:
    """
    Normalize block-type values.
    """
    if pd.isna(value):
        return value

    text = str(value).strip().lower()

    mappings = {
        "ohe": "Power Block",
        "ohe block": "Power Block",
        "power": "Power Block",
        "power block": "Power Block",

        "engineering": "Engineering Block",
        "engineering block": "Engineering Block",

        "signal": "Traffic Block",
        "signal block": "Traffic Block",
        "traffic": "Traffic Block",
        "traffic block": "Traffic Block",
    }

    return mappings.get(text, str(value).strip())


def normalize_approval_status(value: Any) -> Any:
    """
    Normalize approval-status values.
    """
    if pd.isna(value):
        return value

    text = str(value).strip().lower()

    mappings = {
        "approved": "Approved",
        "approve": "Approved",
        "yes": "Approved",
        "y": "Approved",
        "true": "Approved",
        "1": "Approved",

        "pending": "Pending",
        "awaiting approval": "Pending",

        "rejected": "Rejected",
        "reject": "Rejected",
        "not approved": "Rejected",
        "no": "Rejected",
        "n": "Rejected",
        "false": "Rejected",
        "0": "Rejected",
    }

    return mappings.get(text, str(value).strip())


# -------------------------------------------------------------------
# DataFrame transformations
# -------------------------------------------------------------------

def rename_columns(
    dataframe: pd.DataFrame,
    dataset_type: str,
) -> pd.DataFrame:
    """
    Normalize column names and apply aliases.
    """
    dataframe = dataframe.copy()

    dataframe.columns = [
        normalize_column_name(column)
        for column in dataframe.columns
    ]

    aliases = COLUMN_ALIASES.get(dataset_type, {})

    rename_map = {}

    for column in dataframe.columns:
        if column in aliases:
            rename_map[column] = aliases[column]

    return dataframe.rename(columns=rename_map)


def add_optional_defaults(
    dataframe: pd.DataFrame,
    dataset_type: str,
) -> pd.DataFrame:
    """
    Add defaults only for optional fields.
    Required fields are never silently created.
    """
    dataframe = dataframe.copy()

    if dataset_type == "maintenance_tasks":
        if "approval_status" not in dataframe.columns:
            dataframe["approval_status"] = "Approved"

        if "priority" not in dataframe.columns:
            dataframe["priority"] = "Medium"

    elif dataset_type == "block_windows":
        if "approval_status" not in dataframe.columns:
            dataframe["approval_status"] = "Approved"

        if "available_capacity" not in dataframe.columns:
            dataframe["available_capacity"] = 1

    elif dataset_type == "train_movements":
        if "operational_priority" not in dataframe.columns:
            dataframe["operational_priority"] = "Medium"

    return dataframe


def convert_numeric_columns(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:
    """
    Convert numeric columns only when they exist.
    """
    dataframe = dataframe.copy()

    numeric_columns = [
        "duration_minutes",
        "estimated_duration_minutes",
        "duration_buffer_minutes",
        "maintenance_interval_days",
        "overdue_days",
        "condition_score",
        "asset_age_years",
        "failure_count_12m",
        "speed_kmph",
        "risk_score",
        "available_capacity",
        "max_tasks",
        "quantity",
        "volume",
        "forecast_quantity",
        "priority_score",
        "delay_minutes",
    ]

    for column in numeric_columns:
        if column in dataframe.columns:
            dataframe[column] = pd.to_numeric(
                dataframe[column],
                errors="coerce",
            )

    return dataframe


def normalize_values(
    dataframe: pd.DataFrame,
    dataset_type: str,
) -> pd.DataFrame:
    """
    Normalize values only when the columns exist.
    """
    dataframe = dataframe.copy()

    if "corridor_id" in dataframe.columns:
        dataframe["corridor_id"] = dataframe["corridor_id"].apply(
            normalize_corridor
        )

    if "section_id" in dataframe.columns:
        dataframe["section_id"] = dataframe["section_id"].apply(
            normalize_section
        )

    if "block_type" in dataframe.columns:
        dataframe["block_type"] = dataframe["block_type"].apply(
            normalize_block_type
        )

    if "required_block_type" in dataframe.columns:
        dataframe["required_block_type"] = dataframe[
            "required_block_type"
        ].apply(normalize_block_type)

    if "approval_status" in dataframe.columns:
        dataframe["approval_status"] = dataframe[
            "approval_status"
        ].apply(normalize_approval_status)

    if "is_peak_period" in dataframe.columns:
        dataframe["is_peak_period"] = (
            dataframe["is_peak_period"]
            .astype(str)
            .str.strip()
            .str.lower()
            .map(
                {
                    "true": True,
                    "1": True,
                    "yes": True,
                    "y": True,
                    "false": False,
                    "0": False,
                    "no": False,
                    "n": False,
                }
            )
            .fillna(False)
        )

    return dataframe


def convert_dates(
    dataframe: pd.DataFrame,
) -> pd.DataFrame:
    """
    Convert date/time columns only when they exist.
    """
    dataframe = dataframe.copy()

    date_columns = [
        "scheduled_date",
        "start_time",
        "end_time",
        "scheduled_departure",
        "scheduled_arrival",
        "forecast_date",
        "last_maintenance_date",
        "next_due_date",
        "date",
    ]

    for column in date_columns:
        if column in dataframe.columns:
            dataframe[column] = pd.to_datetime(
                dataframe[column],
                errors="coerce",
            )

    return dataframe


# -------------------------------------------------------------------
# Required-column validation
# -------------------------------------------------------------------

def validate_required_columns(
    dataframe: pd.DataFrame,
    dataset_type: str,
) -> List[str]:
    """
    Validate required columns for the selected dataset.
    """
    errors = []

    required_columns = REQUIRED_COLUMNS.get(dataset_type)

    if required_columns is None:
        errors.append(
            f"Unknown dataset type: {dataset_type}"
        )
        return errors

    missing_columns = [
        column
        for column in required_columns
        if column not in dataframe.columns
    ]

    if missing_columns:
        errors.append(
            "Missing required columns: "
            + ", ".join(missing_columns)
        )

    return errors


# -------------------------------------------------------------------
# Value validation
# -------------------------------------------------------------------

def validate_values(
    dataframe: pd.DataFrame,
    dataset_type: str,
) -> List[str]:
    """
    Validate dataset values without assuming optional columns exist.
    """
    errors = []

    if dataframe.empty:
        errors.append("Dataset contains no rows.")
        return errors

    if dataframe.columns.duplicated().any():
        duplicate_columns = dataframe.columns[
            dataframe.columns.duplicated()
        ].tolist()

        errors.append(
            "Duplicate columns found: "
            + ", ".join(duplicate_columns)
        )

    # ---------------------------------------------------------------
    # Maintenance tasks
    # ---------------------------------------------------------------

    if dataset_type == "maintenance_tasks":
        if "task_id" in dataframe.columns:
            if dataframe["task_id"].isna().any():
                errors.append(
                    "task_id contains missing values."
                )

            if dataframe["task_id"].duplicated().any():
                errors.append(
                    "task_id contains duplicate values."
                )

        if "estimated_duration_minutes" in dataframe.columns:
            duration = dataframe["estimated_duration_minutes"]

            if duration.isna().any():
                errors.append(
                    "estimated_duration_minutes contains "
                    "missing or invalid values."
                )
            elif (duration <= 0).any():
                errors.append(
                    "estimated_duration_minutes must be "
                    "greater than zero."
                )

        if "scheduled_date" in dataframe.columns:
            if dataframe["scheduled_date"].isna().any():
                errors.append(
                    "scheduled_date contains missing or "
                    "invalid values."
                )

        if "next_due_date" in dataframe.columns:
            if dataframe["next_due_date"].isna().any():
                errors.append(
                    "next_due_date contains missing or "
                    "invalid values."
                )

        if "approval_status" in dataframe.columns:
            allowed_statuses = {
                "Approved",
                "Pending",
                "Rejected",
            }

            invalid_statuses = set(
                dataframe["approval_status"]
                .dropna()
                .unique()
            ) - allowed_statuses

            if invalid_statuses:
                errors.append(
                    "Invalid approval_status values: "
                    + ", ".join(map(str, invalid_statuses))
                )

    # ---------------------------------------------------------------
    # Block windows
    # ---------------------------------------------------------------

    elif dataset_type == "block_windows":
        if "block_id" in dataframe.columns:
            if dataframe["block_id"].isna().any():
                errors.append(
                    "block_id contains missing values."
                )

            if dataframe["block_id"].duplicated().any():
                errors.append(
                    "block_id contains duplicate values."
                )

        if "start_time" in dataframe.columns:
            if dataframe["start_time"].isna().any():
                errors.append(
                    "start_time contains missing or "
                    "invalid values."
                )

        if "end_time" in dataframe.columns:
            if dataframe["end_time"].isna().any():
                errors.append(
                    "end_time contains missing or "
                    "invalid values."
                )

        if (
            "start_time" in dataframe.columns
            and "end_time" in dataframe.columns
        ):
            invalid_ranges = (
                dataframe["end_time"]
                <= dataframe["start_time"]
            ).any()

            if invalid_ranges:
                errors.append(
                    "end_time must be later than start_time."
                )

        if "available_capacity" in dataframe.columns:
            capacity = dataframe["available_capacity"]

            if capacity.isna().any():
                errors.append(
                    "available_capacity contains "
                    "invalid values."
                )
            elif (capacity <= 0).any():
                errors.append(
                    "available_capacity must be "
                    "greater than zero."
                )

    # ---------------------------------------------------------------
    # Train movements
    # ---------------------------------------------------------------

    elif dataset_type == "train_movements":
        if "movement_id" in dataframe.columns:
            if dataframe["movement_id"].isna().any():
                errors.append(
                    "movement_id contains missing values."
                )

            if dataframe["movement_id"].duplicated().any():
                errors.append(
                    "movement_id contains duplicate values."
                )

        if "scheduled_departure" in dataframe.columns:
            if dataframe["scheduled_departure"].isna().any():
                errors.append(
                    "scheduled_departure contains missing "
                    "or invalid values."
                )

        if "scheduled_arrival" in dataframe.columns:
            if dataframe["scheduled_arrival"].isna().any():
                errors.append(
                    "scheduled_arrival contains missing "
                    "or invalid values."
                )

        if (
            "scheduled_departure" in dataframe.columns
            and "scheduled_arrival" in dataframe.columns
        ):
            invalid_ranges = (
                dataframe["scheduled_arrival"]
                <= dataframe["scheduled_departure"]
            ).any()

            if invalid_ranges:
                errors.append(
                    "scheduled_arrival must be later than "
                    "scheduled_departure."
                )

        if "duration_minutes" in dataframe.columns:
            duration = dataframe["duration_minutes"]

            if duration.isna().any():
                errors.append(
                    "duration_minutes contains invalid values."
                )
            elif (duration <= 0).any():
                errors.append(
                    "duration_minutes must be "
                    "greater than zero."
                )

    # ---------------------------------------------------------------
    # Resources
    # ---------------------------------------------------------------

    elif dataset_type == "resources":
        if "resource_id" in dataframe.columns:
            if dataframe["resource_id"].isna().any():
                errors.append(
                    "resource_id contains missing values."
                )

            if dataframe["resource_id"].duplicated().any():
                errors.append(
                    "resource_id contains duplicate values."
                )

        if "quantity" in dataframe.columns:
            quantity = dataframe["quantity"]

            if quantity.isna().any():
                errors.append(
                    "quantity contains invalid values."
                )
            elif (quantity < 0).any():
                errors.append(
                    "quantity cannot be negative."
                )

    # ---------------------------------------------------------------
    # Goods forecasts
    # ---------------------------------------------------------------

    elif dataset_type == "goods_forecasts":
        if "forecast_date" in dataframe.columns:
            if dataframe["forecast_date"].isna().any():
                errors.append(
                    "forecast_date contains missing or "
                    "invalid values."
                )

        if "forecast_quantity" in dataframe.columns:
            quantity = dataframe["forecast_quantity"]

            if quantity.isna().any():
                errors.append(
                    "forecast_quantity contains invalid values."
                )
            elif (quantity < 0).any():
                errors.append(
                    "forecast_quantity cannot be negative."
                )

        if "volume" in dataframe.columns:
            volume = dataframe["volume"]

            if volume.isna().any():
                errors.append(
                    "volume contains invalid values."
                )
            elif (volume < 0).any():
                errors.append(
                    "volume cannot be negative."
                )

    return errors


# -------------------------------------------------------------------
# Complete validation pipeline
# -------------------------------------------------------------------

def validate_dataset(
    dataframe: pd.DataFrame,
    dataset_type: str,
    file_path: str = "",
) -> Dict[str, Any]:
    """
    Normalize and validate one dataset.
    """
    normalized_dataframe = rename_columns(
        dataframe,
        dataset_type,
    )

    normalized_dataframe = add_optional_defaults(
        normalized_dataframe,
        dataset_type,
    )

    normalized_dataframe = convert_numeric_columns(
        normalized_dataframe,
    )

    normalized_dataframe = normalize_values(
        normalized_dataframe,
        dataset_type,
    )

    normalized_dataframe = convert_dates(
        normalized_dataframe,
    )

    column_errors = validate_required_columns(
        normalized_dataframe,
        dataset_type,
    )

    value_errors = validate_values(
        normalized_dataframe,
        dataset_type,
    )

    errors = column_errors + value_errors

    return {
        "dataset_type": dataset_type,
        "file_path": str(file_path),
        "rows": len(normalized_dataframe),
        "columns": list(normalized_dataframe.columns),
        "dataframe": normalized_dataframe,
        "valid": len(errors) == 0,
        "errors": errors,
    }
def load_and_validate_csv(
    file_path: str | Path,
    dataset_type: str,
) -> Dict[str, Any]:
    """
    Load a CSV file and validate it.
    """
    file_path = Path(file_path)

    if not file_path.exists():
        return {
            "dataset_type": dataset_type,
            "file_path": str(file_path),
            "rows": 0,
            "columns": [],
            "dataframe": None,
            "valid": False,
            "errors": [
                f"File not found: {file_path}"
            ],
        }

    try:
        dataframe = pd.read_csv(file_path)
    except Exception as error:
        return {
            "dataset_type": dataset_type,
            "file_path": str(file_path),
            "rows": 0,
            "columns": [],
            "dataframe": None,
            "valid": False,
            "errors": [
                f"Could not read CSV: {error}"
            ],
        }

    return validate_dataset(
        dataframe=dataframe,
        dataset_type=dataset_type,
        file_path=file_path,
    )


def print_validation_report(
    report: Dict[str, Any],
) -> None:
    """
    Print a readable validation report.
    """
    print("=" * 60)
    print(f"Dataset: {report['dataset_type']}")
    print(f"File: {report['file_path']}")
    print(f"Rows: {report['rows']}")
    print(f"Valid: {report['valid']}")

    if report["errors"]:
        print("Validation errors:")

        for error in report["errors"]:
            print(f" - {error}")
    else:
        print("No validation errors found.")

    print("=" * 60)
    print()


# -------------------------------------------------------------------
# Standalone execution
# -------------------------------------------------------------------

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parents[3]
    data_dir = base_dir / "backend" / "app" / "data"

    dataset_files = {
        "maintenance_tasks": data_dir / "maintenance_tasks.csv",
        "block_windows": data_dir / "block_windows.csv",
        "train_movements": data_dir / "train_movements.csv",
        "resources": data_dir / "resources.csv",
        "goods_forecasts": data_dir / "goods_forecasts.csv",
    }

    all_valid = True

    for dataset_type, file_path in dataset_files.items():
        report = load_and_validate_csv(
            file_path=file_path,
            dataset_type=dataset_type,
        )

        print_validation_report(report)

        if not report["valid"]:
            all_valid = False

    print("Overall validation result:", all_valid)
def validate_all_datasets(datasets):
    """
    Compatibility wrapper used by data_loader.py.

    Returns:
        list[str]: Validation errors.
    """

    errors = []

    for dataset_name, dataframe in datasets.items():
        if dataframe is None:
            errors.append(
                f"{dataset_name} is missing"
            )
            continue

        if dataframe.empty:
            errors.append(
                f"{dataset_name} is empty"
            )

    return errors
