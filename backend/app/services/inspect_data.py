from pathlib import Path

import pandas as pd


DATA_DIR = (
    Path(__file__).resolve().parent.parent / "data"
)


def inspect_file(filename):
    file_path = DATA_DIR / filename

    df = pd.read_csv(file_path)

    print(f"\n{'=' * 60}")
    print(f"FILE: {filename}")
    print(f"{'=' * 60}")

    print("\nColumns:")
    for column in df.columns:
        print(f"- {column}")

    print("\nFirst 3 rows:")
    print(df.head(3).to_string(index=False))


def main():
    inspect_file("prioritized_tasks.csv")
    inspect_file("block_windows.csv")


if __name__ == "__main__":
    main()