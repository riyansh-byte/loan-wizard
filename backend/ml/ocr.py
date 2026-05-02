import os
import re

import boto3

TEXTRACT_ENDPOINT = os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", "ap-south-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "test")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "test")

textract = boto3.client(
    "textract",
    endpoint_url=TEXTRACT_ENDPOINT,
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
)

DOB_PATTERN = re.compile(r"\b([0-3]\d[/-][0-1]\d[/-]\d{4})\b")
AADHAAR_PATTERN = re.compile(r"\b(\d{4}\s?\d{4}\s?\d{4})\b")
PAN_PATTERN = re.compile(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b")

INDIAN_NAME_HINTS = {
    "kumar",
    "kumari",
    "singh",
    "sharma",
    "patel",
    "reddy",
    "gupta",
    "yadav",
    "verma",
    "nair",
    "das",
    "rao",
    "kaur",
}

NON_NAME_MARKERS = {
    "government",
    "india",
    "male",
    "female",
    "dob",
    "date",
    "birth",
    "address",
    "aadhaar",
    "income",
    "permanent",
    "account",
    "number",
}


def _safe_defaults() -> dict:
    return {
        "name": "",
        "dob": "",
        "document_number": "",
        "document_type": "",
        "raw_text": "",
        "confidence": 0.0,
    }


def _extract_name(lines: list[str]) -> str:
    for line in lines:
        clean = re.sub(r"[^A-Za-z\s]", " ", line).strip()
        if not clean:
            continue
        lowered = clean.lower()
        if any(marker in lowered for marker in NON_NAME_MARKERS):
            continue

        words = [word for word in clean.split() if len(word) > 1]
        if len(words) < 2:
            continue

        if any(hint in lowered.split() for hint in INDIAN_NAME_HINTS):
            return " ".join(words[:4]).title()

        if all(word.isalpha() for word in words[:3]):
            return " ".join(words[:3]).title()
    return ""


def _extract_dob(lines: list[str]) -> str:
    for line in lines:
        match = DOB_PATTERN.search(line)
        if match:
            return match.group(1)
    return ""


def _extract_document_number(lines: list[str]) -> tuple[str, str]:
    for line in lines:
        pan_match = PAN_PATTERN.search(line.upper())
        if pan_match:
            return pan_match.group(1), "PAN"

        aadhaar_match = AADHAAR_PATTERN.search(line)
        if aadhaar_match:
            normalized = re.sub(r"\s+", "", aadhaar_match.group(1))
            if len(normalized) == 12:
                return normalized, "AADHAAR"

    return "", ""


def extract_document_fields(image_bytes: bytes) -> dict:
    defaults = _safe_defaults()

    try:
        response = textract.detect_document_text(Document={"Bytes": image_bytes})
        blocks = response.get("Blocks", [])

        line_blocks = [b for b in blocks if b.get("BlockType") == "LINE"]
        lines = [b.get("Text", "").strip() for b in line_blocks if b.get("Text")]
        raw_text = "\n".join(lines)

        confidences = [float(b.get("Confidence", 0.0)) for b in line_blocks]
        avg_confidence = round((sum(confidences) / len(confidences)) / 100, 2) if confidences else 0.0

        name = _extract_name(lines)
        dob = _extract_dob(lines)
        document_number, document_type = _extract_document_number(lines)

        return {
            "name": name,
            "dob": dob,
            "document_number": document_number,
            "document_type": document_type,
            "raw_text": raw_text,
            "confidence": avg_confidence,
        }
    except Exception:
        return defaults
