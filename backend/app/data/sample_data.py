from datetime import date, timedelta
from pathlib import Path
import random

import pandas as pd


random.seed(42)

TODAY = date(2026, 9, 13)

OUTPUT_PATH = Path(__file__).parent / "maintenance_tasks.csv"


departments = [
    {
        "department": "Engineering",
        "asset_types": ["Track", "Bridge", "Drainage", "Points"],
        "teams": ["TRACK_TEAM_A", "TRACK_TEAM_B"],
        "block_type": "Engineering Block",
        "resources": [
            "TRACK_TEAM_A",
            "TRACK_TEAM_B",
            "TAMPER_MACHINE_01",
            "TOOLS_01",
        ],
    },
    {
        "department": "S&T",
        "asset_types": ["Signal", "Point Machine", "Relay", "Telecom"],
        "teams": ["SNT_TEAM_A", "SNT_TEAM_B"],
        "block_type": "Signal Block",
        "resources": [
            "SNT_TEAM_A",
            "SNT_TEAM_B",
            "TEST_EQUIPMENT_01",
            "TEST_EQUIPMENT_02",
        ],
    },
    {
        "department": "TRD",
        "asset_types": ["OHE", "Contact Wire", "Mast", "Electrical Equipment"],
        "teams": ["TRD_TEAM_A", "TRD_TEAM_B"],
        "block_type": "OHE Block",
        "resources": [
            "TRD_TEAM_A",
            "TRD_TEAM_B",
            "OHE_VEHICLE_01",
            "OHE_VEHICLE_02",
        ],
    },
]

sections = [
    "SEC_A_B",
    "SEC_B_C",
    "SEC_C_D",
    "SEC_D_E",
    "SEC_E_F",
    "SEC_F_G",
    "SEC_G_H",
    "SEC_H_I",
]

maintenance_types = [
    "Preventive",
    "Corrective",
    "Inspection",
    "Emergency",
]

defect_descriptions = [
    "Routine preventive maintenance",
    "Condition deterioration detected",
    "Repeated minor failure",
    "Inspection overdue",
    "Abnormal wear detected",
    "Safety-related defect",
    "Operational reliability issue",
    "Component replacement required",
]


def random_date(start_date, end_date):
    days = (end_date - start_date).days
    return start_date + timedelta(days=random.randint(0, days))


def create_task(task_number):
    department_info = random.choice(departments)

    department = department_info["department"]
    asset_type = random.choice(department_info["asset_types"])
    section_id = random.choice(sections)

    asset_id = f"{department[:3].upper()}_{random.randint(1, 80):03d}"
    task_id = f"T{task_number:04d}"

    maintenance_type = random.choices(
        maintenance_types,
        weights=[45, 30, 20, 5],
        k=1,
    )[0]

    # Most tasks are normal, but some are deliberately extreme.
    is_extreme = random.random() < 0.15

    if is_extreme:
        overdue_days = random.randint(120, 365)
        condition_score = round(random.uniform(0.5, 3.5), 2)
        failure_count = random.randint(4, 10)
        safety_criticality = random.randint(8, 10)
        operational_criticality = random.randint(8, 10)
        estimated_duration = random.choice([240, 300, 360, 420, 480])
        duration_buffer = random.choice([30, 45, 60])
    else:
        overdue_days = random.randint(0, 90)
        condition_score = round(random.uniform(2.5, 9.5), 2)
        failure_count = random.randint(0, 4)
        safety_criticality = random.randint(3, 10)
        operational_criticality = random.randint(3, 10)
        estimated_duration = random.choice(
            [30, 45, 60, 75, 90, 120, 150, 180]
        )
        duration_buffer = random.choice([10, 15, 20, 30])

    asset_age_years = round(random.uniform(1, 35), 1)

    last_maintenance_date = random_date(
        TODAY - timedelta(days=1200),
        TODAY - timedelta(days=30),
    )

    maintenance_interval_days = random.choice(
        [30, 60, 90, 120, 180, 365]
    )

    next_due_date = last_maintenance_date + timedelta(
        days=maintenance_interval_days
    )

    # Make overdue_days consistent with the due date.
    calculated_overdue = max(
        0,
        (TODAY - next_due_date).days,
    )

    # Occasionally create a task that is due in the future.
    if random.random() < 0.25:
        calculated_overdue = 0
        next_due_date = TODAY + timedelta(
            days=random.randint(1, 120)
        )

    required_team = random.choice(department_info["teams"])

    # Every task requires its team plus one equipment/resource.
    equipment_options = [
        resource
        for resource in department_info["resources"]
        if resource != required_team
    ]

    required_equipment = random.choice(equipment_options)

    required_resources = f"{required_team}|{required_equipment}"

    status = random.choices(
        ["Pending", "Deferred", "In Progress"],
        weights=[85, 10, 5],
        k=1,
    )[0]

    return {
        "task_id": task_id,
        "asset_id": asset_id,
        "asset_type": asset_type,
        "department": department,
        "corridor_id": "CORR_01",
        "section_id": section_id,
        "maintenance_type": maintenance_type,
        "defect_description": random.choice(defect_descriptions),
        "last_maintenance_date": last_maintenance_date.isoformat(),
        "maintenance_interval_days": maintenance_interval_days,
        "next_due_date": next_due_date.isoformat(),
        "overdue_days": calculated_overdue,
        "condition_score": condition_score,
        "asset_age_years": asset_age_years,
        "failure_count_12m": failure_count,
        "safety_criticality": safety_criticality,
        "operational_criticality": operational_criticality,
        "estimated_duration_minutes": estimated_duration,
        "duration_buffer_minutes": duration_buffer,
        "required_team": required_team,
        "required_block_type": department_info["block_type"],
        "required_resources": required_resources,
        "status": status,
    }


def main():
    records = [
        create_task(task_number)
        for task_number in range(1, 301)
    ]

    dataframe = pd.DataFrame(records)
    dataframe.to_csv(OUTPUT_PATH, index=False)

    print(f"Generated {len(dataframe)} maintenance records")
    print(f"Saved to: {OUTPUT_PATH}")
    print("\nRecords by department:")
    print(dataframe["department"].value_counts())

    print("\nRecords by maintenance type:")
    print(dataframe["maintenance_type"].value_counts())

    print("\nSample records:")
    print(
        dataframe[
            [
                "task_id",
                "department",
                "section_id",
                "overdue_days",
                "safety_criticality",
                "estimated_duration_minutes",
            ]
        ].head(10)
    )


if __name__ == "__main__":
    main()