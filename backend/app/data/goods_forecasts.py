from pathlib import Path
from datetime import datetime, timedelta
import random

import pandas as pd


random.seed(42)

OUTPUT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = OUTPUT_DIR / "goods_forecasts.csv"

START_DATE = datetime(2026, 9, 14)
NUM_DAYS = 30

corridors = [
    "C1",
    "C2",
    "C3",
    "C4",
    "C5",
]

records = []

for day_offset in range(NUM_DAYS):
    forecast_date = START_DATE + timedelta(days=day_offset)

    for corridor_id in corridors:
        expected_goods_trains = random.randint(8, 35)

        expected_tonnage = expected_goods_trains * random.randint(
            800, 1800
        )

        peak_hour = random.choice(
            [
                "06:00-09:00",
                "09:00-12:00",
                "12:00-15:00",
                "15:00-18:00",
                "18:00-21:00",
                "21:00-00:00",
            ]
        )

        demand_level = (
            "High"
            if expected_goods_trains >= 25
            else "Medium"
            if expected_goods_trains >= 15
            else "Low"
        )

        records.append(
            {
                "forecast_id": f"FC{len(records) + 1:05d}",
                "forecast_date": forecast_date.strftime("%Y-%m-%d"),
                "corridor_id": corridor_id,
                "expected_goods_trains": expected_goods_trains,
                "expected_tonnage": expected_tonnage,
                "peak_goods_window": peak_hour,
                "demand_level": demand_level,
            }
        )


df = pd.DataFrame(records)

df.to_csv(OUTPUT_FILE, index=False)

print(f"Created: {OUTPUT_FILE}")
print(f"Total rows: {len(df)}")
print(f"Total columns: {len(df.columns)}")

print("\nDemand level distribution:")
print(df["demand_level"].value_counts())