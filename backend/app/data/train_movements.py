from pathlib import Path
from datetime import datetime, timedelta
import random

import pandas as pd


random.seed(42)

OUTPUT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = OUTPUT_DIR / "train_movements.csv"

START_DATE = datetime(2026, 9, 14)
NUM_DAYS = 30

train_types = [
    "Passenger",
    "Express",
    "Freight",
    "Superfast",
]

corridors = [
    "C1",
    "C2",
    "C3",
    "C4",
    "C5",
]

directions = [
    "UP",
    "DOWN",
]

records = []

for day_offset in range(NUM_DAYS):
    current_date = START_DATE + timedelta(days=day_offset)

    for train_number in range(1, 21):
        train_id = f"TRN{day_offset + 1:02d}{train_number:03d}"

        train_type = random.choice(train_types)
        corridor_id = random.choice(corridors)
        direction = random.choice(directions)

        departure_hour = random.randint(0, 22)
        departure_minute = random.choice([0, 15, 30, 45])

        departure_time = current_date.replace(
            hour=departure_hour,
            minute=departure_minute,
            second=0,
            microsecond=0,
        )

        duration_minutes = random.randint(30, 150)
        arrival_time = departure_time + timedelta(
            minutes=duration_minutes
        )

        speed_kmph = random.choice([45, 60, 75, 90, 110, 130])

        records.append(
            {
                "movement_id": f"MOV{len(records) + 1:05d}",
                "train_id": train_id,
                "train_type": train_type,
                "corridor_id": corridor_id,
                "direction": direction,
                "scheduled_departure": departure_time,
                "scheduled_arrival": arrival_time,
                "duration_minutes": duration_minutes,
                "speed_kmph": speed_kmph,
                "is_peak_period": (
                    departure_hour in [7, 8, 9, 17, 18, 19, 20]
                ),
                "operational_priority": (
                    "High"
                    if train_type in ["Express", "Superfast"]
                    else "Medium"
                ),
            }
        )


df = pd.DataFrame(records)

df["scheduled_departure"] = df["scheduled_departure"].dt.strftime(
    "%Y-%m-%d %H:%M:%S"
)
df["scheduled_arrival"] = df["scheduled_arrival"].dt.strftime(
    "%Y-%m-%d %H:%M:%S"
)

df.to_csv(OUTPUT_FILE, index=False)

print(f"Created: {OUTPUT_FILE}")
print(f"Total rows: {len(df)}")
print(f"Total columns: {len(df.columns)}")
print("\nTrain type distribution:")
print(df["train_type"].value_counts())