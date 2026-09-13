from pathlib import Path

import pandas as pd


OUTPUT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = OUTPUT_DIR / "resources.csv"

records = [
    {
        "resource_id": "RES001",
        "resource_name": "TRD_TEAM_A",
        "department": "TRD",
        "resource_type": "Maintenance Team",
        "specialization": "Traction",
        "capacity_per_day": 3,
        "available_units": 1,
        "availability_status": "Available",
    },
    {
        "resource_id": "RES002",
        "resource_name": "TRD_TEAM_B",
        "department": "TRD",
        "resource_type": "Maintenance Team",
        "specialization": "Traction",
        "capacity_per_day": 2,
        "available_units": 1,
        "availability_status": "Available",
    },
    {
        "resource_id": "RES003",
        "resource_name": "ENG_TEAM_A",
        "department": "Engineering",
        "resource_type": "Maintenance Team",
        "specialization": "Track",
        "capacity_per_day": 3,
        "available_units": 1,
        "availability_status": "Available",
    },
    {
        "resource_id": "RES004",
        "resource_name": "ENG_TEAM_B",
        "department": "Engineering",
        "resource_type": "Maintenance Team",
        "specialization": "Bridge",
        "capacity_per_day": 2,
        "available_units": 1,
        "availability_status": "Available",
    },
    {
        "resource_id": "RES005",
        "resource_name": "SNT_TEAM_A",
        "department": "S&T",
        "resource_type": "Maintenance Team",
        "specialization": "Signalling",
        "capacity_per_day": 3,
        "available_units": 1,
        "availability_status": "Available",
    },
    {
        "resource_id": "RES006",
        "resource_name": "SNT_TEAM_B",
        "department": "S&T",
        "resource_type": "Maintenance Team",
        "specialization": "Telecommunication",
        "capacity_per_day": 2,
        "available_units": 1,
        "availability_status": "Available",
    },
    {
        "resource_id": "RES007",
        "resource_name": "TOWER_WAGON_01",
        "department": "TRD",
        "resource_type": "Equipment",
        "specialization": "Traction",
        "capacity_per_day": 2,
        "available_units": 1,
        "availability_status": "Available",
    },
    {
        "resource_id": "RES008",
        "resource_name": "TRACK_MACHINE_01",
        "department": "Engineering",
        "resource_type": "Equipment",
        "specialization": "Track",
        "capacity_per_day": 2,
        "available_units": 1,
        "availability_status": "Available",
    },
    {
        "resource_id": "RES009",
        "resource_name": "SIGNAL_TEST_KIT_01",
        "department": "S&T",
        "resource_type": "Equipment",
        "specialization": "Signalling",
        "capacity_per_day": 3,
        "available_units": 1,
        "availability_status": "Available",
    },
]

df = pd.DataFrame(records)

df.to_csv(OUTPUT_FILE, index=False)

print(f"Created: {OUTPUT_FILE}")
print(f"Total rows: {len(df)}")
print(f"Total columns: {len(df.columns)}")

print("\nResource type distribution:")
print(df["resource_type"].value_counts())