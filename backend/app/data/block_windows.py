from pathlib import Path
from datetime import datetime, timedelta
import random

import pandas as pd


random.seed(42)

OUTPUT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = OUTPUT_DIR / "block_windows.csv"

START_DATE = datetime(2026, 9, 14)
NUM_DAYS = 30

corridors = [
    "C1",
    "C2",
    "C3",
    "C4",
    "C5",
]

block_types = [
    "Traffic Block",
    "Power Block",
    "Engineering Block",
]

records = []

for day_offset in range(NUM_DAYS):
    current_date = START_DATE + timedelta(days=day_offset)

    for corridor_id in corridors:
        window_starts = [
            (0, 3),
            (3, 6),
            (10, 13),
            (13, 16),
            (22, 24),
        ]

        for window_number, (start_hour, end_hour) in enumerate(
            window_starts,
            start=1,
        ):
            start_time = current_date.replace(
                hour=start_hour,
                minute=0,
                second=0,
                microsecond=0,
            )

            if end_hour == 24:
                end_time = current_date + timedelta(days=1)
            else:
                end_time = current_date.replace(
                    hour=end_hour,
                    minute=0,
                    second=0,
                    microsecond=0,
                )

            duration_minutes = int(
                (end_time - start_time).total_seconds() / 60
            )

            records.append(
                {
                    "block_id": f"BLK{len(records) + 1:05d}",
                    "block_date": current_date.strftime("%Y-%m-%d"),
                    "corridor_id": corridor_id,
                    "section_id": f"S{random.randint(1, 20):02d}",
                    "start_time": start_time.strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                    "end_time": end_time.strftime(
                        "%Y-%m-%d %H:%M:%S"
                    ),
                    "duration_minutes": duration_minutes,
                    "block_type": random.choice(block_types),
                    "approval_status": random.choice(
                        ["Approved", "Approved", "Pending"]
                    ),
                    "capacity_level": random.choice(
                        ["Full", "Partial"]
                    ),
                }
            )


df = pd.DataFrame(records)

df.to_csv(OUTPUT_FILE, index=False)

print(f"Created: {OUTPUT_FILE}")
print(f"Total rows: {len(df)}")
print(f"Total columns: {len(df.columns)}")

print("\nApproval status distribution:")
print(df["approval_status"].value_counts())