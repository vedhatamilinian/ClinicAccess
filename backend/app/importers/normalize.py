import re


def normalize_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    if len(digits) == 11 and digits.startswith("1"):
        digits = digits[1:]
    return digits


def normalize_street(value: str) -> str:
    text = (value or "").lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    replacements = {
        " street": " st",
        " avenue": " ave",
        " boulevard": " blvd",
        " drive": " dr",
        " parkway": " pkwy",
        " northwest": " nw",
        " northeast": " ne",
        " southwest": " sw",
        " southeast": " se",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text


def address_key(address: str, postal_code: str) -> str:
    zip5 = re.sub(r"\D", "", postal_code or "")[:5]
    return f"{normalize_street(address)}|{zip5}"
