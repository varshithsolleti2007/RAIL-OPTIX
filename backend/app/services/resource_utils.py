from typing import List


def parse_required_resources(resource_text) -> List[str]:
    """
    Convert a pipe-separated resource string into a clean list.

    Example:
        "TRD_TEAM_A|OHE_VEHICLE_01"
        -> ["TRD_TEAM_A", "OHE_VEHICLE_01"]
    """

    if resource_text is None:
        return []

    text = str(resource_text).strip()

    if not text or text.lower() == "nan":
        return []

    return [
        resource.strip()
        for resource in text.split("|")
        if resource.strip()
    ]


if __name__ == "__main__":
    examples = [
        "TRD_TEAM_A|OHE_VEHICLE_01",
        "SNT_TEAM_A|SNT_TEAM_B",
        "TRACK_TEAM_B|TAMPER_MACHINE_01",
        "",
        None,
    ]

    for example in examples:
        print(f"{example!r} -> {parse_required_resources(example)}")