"""
Single source of truth for corridor/section/block-type normalization.

The previous prototype (see 11-ml-backend-audit-and-plan.md finding #12)
duplicated this table across optimizer, recovery optimizer and bundle
utils. This module is the one place it is defined; everything else
imports from here.
"""

SECTION_TO_CODE = {
    "SEC_A_B": "S01",
    "SEC_B_C": "S02",
    "SEC_C_D": "S03",
    "SEC_D_E": "S04",
    "SEC_E_F": "S05",
    "SEC_F_G": "S06",
    "SEC_G_H": "S07",
    "SEC_H_I": "S08",
}

BLOCK_TYPE_ALIASES = {
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


def normalize_corridor(value) -> str:
    if value is None:
        return value

    text = str(value).strip().upper()

    if text.startswith("CORR_"):
        number = text.replace("CORR_", "", 1).lstrip("0") or "0"
        return f"C{number}"

    if text.startswith("C") and text[1:].isdigit():
        return f"C{int(text[1:])}"

    return text


def normalize_section(value) -> str:
    if value is None:
        return value

    text = str(value).strip().upper()
    return SECTION_TO_CODE.get(text, text)


def normalize_block_type(value) -> str:
    if value is None:
        return value

    text = str(value).strip().lower()
    return BLOCK_TYPE_ALIASES.get(text, str(value).strip())
