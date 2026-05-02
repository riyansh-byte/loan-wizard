import os
import httpx
from datetime import datetime, timedelta
from app.adapters.dynamo import write_audit_log

IPINFO_TOKEN = os.getenv("IPINFO_TOKEN", "")

async def get_ip_info(ip: str) -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            res = await client.get(
                f"https://ipinfo.io/{ip}/json?token={IPINFO_TOKEN}"
            )
            return res.json()
    except Exception:
        return {}

async def compute_fraud_score(session_id: str, payload: dict) -> dict:
    score = 0
    signals = {}
    signals.update({
        "name_mismatch": {"fired": False, "score": 0},
        "age_mismatch": {"fired": False, "score": 0},
        "dob_mismatch": {"fired": False, "score": 0},
        "income_override": {"fired": False, "score": 0},
    })
    edited_fields = payload.get("edited_fields", {})

    # Signal 1: Geo mismatch
    declared_city = payload.get("declared_city", "").lower()
    ip_city = payload.get("ip_city", "").lower()
    if declared_city and ip_city and declared_city not in ip_city:
        score += 25
        signals["geo_mismatch"] = {
            "fired": True,
            "score": 25,
            "detail": f"Declared: {declared_city}, IP: {ip_city}"
        }
    else:
        signals["geo_mismatch"] = {"fired": False, "score": 0}

    # Signal 2: VPN/Proxy detection
    vpn = payload.get("vpn_detected", False)
    proxy = payload.get("proxy_detected", False)
    if vpn or proxy:
        score += 20
        signals["vpn_proxy"] = {
            "fired": True,
            "score": 20,
            "detail": f"VPN: {vpn}, Proxy: {proxy}"
        }
    else:
        signals["vpn_proxy"] = {"fired": False, "score": 0}

    # Signal 3: Foreign IP
    country = payload.get("ip_country", "IN")
    if country != "IN":
        score += 100  # Hard block
        signals["foreign_ip"] = {
            "fired": True,
            "score": 100,
            "detail": f"Country: {country}"
        }
    else:
        signals["foreign_ip"] = {"fired": False, "score": 0}

    # Signal 4: Age mismatch
    declared_age = payload.get("declared_age")
    estimated_age = payload.get("deepface_age")
    if declared_age and estimated_age:
        diff = abs(int(declared_age) - int(estimated_age))
        if diff > 5:
            score += 30
            signals["age_mismatch"] = {
                "fired": True,
                "score": 30,
                "detail": f"Declared: {declared_age}, Estimated: {estimated_age}, Diff: {diff}"
            }
        else:
            signals["age_mismatch"] = {"fired": False, "score": 0}

    # Signal 5: Liveness failure
    liveness = payload.get("deepface_liveness", True)
    if not liveness:
        score += 40
        signals["liveness_failure"] = {
            "fired": True,
            "score": 40,
            "detail": "DeepFace liveness check failed"
        }
    else:
        signals["liveness_failure"] = {"fired": False, "score": 0}

    # Signal 6: Doc vs speech mismatch
    stt_name = payload.get("stt_name", "").lower().strip()
    doc_name = payload.get("ocr_name", "").lower().strip()
    if stt_name and doc_name:
        from difflib import SequenceMatcher
        ratio = SequenceMatcher(None, stt_name, doc_name).ratio()
        if ratio < 0.75:
            score += 35
            signals["doc_speech_mismatch"] = {
                "fired": True,
                "score": 35,
                "detail": f"STT: {stt_name}, OCR: {doc_name}, Similarity: {ratio:.2f}"
            }
        else:
            signals["doc_speech_mismatch"] = {"fired": False, "score": 0}

    # Signal 7: Income anomaly
    declared_income = payload.get("declared_income", 0)
    occupation = payload.get("employment_type", "")
    income_thresholds = {
        "salaried": 500000,
        "self-employed": 800000,
        "business": 1000000,
        "student": 50000,
    }
    threshold = income_thresholds.get(occupation.lower(), 600000)
    if declared_income > threshold:
        score += 20
        signals["income_anomaly"] = {
            "fired": True,
            "score": 20,
            "detail": f"Declared: ₹{declared_income}, Threshold: ₹{threshold}"
        }
    else:
        signals["income_anomaly"] = {"fired": False, "score": 0}

    # Signal 8: HITL over-correction
    original_income = payload.get("stt_income", 0)
    corrected_income = payload.get("hitl_income", 0)
    if original_income and corrected_income:
        delta = abs(corrected_income - original_income) / original_income
        if delta > 0.40:
            score += 30
            signals["hitl_overcorrection"] = {
                "fired": True,
                "score": 30,
                "detail": f"Original: ₹{original_income}, Corrected: ₹{corrected_income}, Delta: {delta:.0%}"
            }
        else:
            signals["hitl_overcorrection"] = {"fired": False, "score": 0}

    # Signal 9: Intent inconsistency (set by LLM)
    intent_flag = payload.get("intent_inconsistent", False)
    if intent_flag:
        score += 10
        signals["intent_inconsistency"] = {
            "fired": True,
            "score": 10,
            "detail": "LLM flagged vague or contradictory loan purpose"
        }
    else:
        signals["intent_inconsistency"] = {"fired": False, "score": 0}

    # Cap at 100
    score = min(score, 100)

    # Determine band
    if score <= 20:
        band = "CLEAN"
    elif score <= 45:
        band = "LOW_RISK"
    elif score <= 70:
        band = "MEDIUM_RISK"
    else:
        band = "HIGH_RISK"

    flagged_details = audit_edited_fields(session_id, edited_fields, payload)

    for entry in flagged_details:
        field = entry["field"]
        detail = entry["detail"]
        if field == "fullName":
            score += 30
            signals["name_mismatch"] = {
                "fired": True,
                "score": 30,
                "detail": detail
            }
        elif field == "declaredAge":
            score += 25
            signals["age_mismatch"] = {
                "fired": True,
                "score": 25,
                "detail": detail
            }
        elif field == "dateOfBirth":
            score += 15
            signals["dob_mismatch"] = {
                "fired": True,
                "score": 15,
                "detail": detail
            }
        elif field == "monthlyIncome":
            score += 30
            signals["income_override"] = {
                "fired": True,
                "score": 30,
                "detail": detail
            }

    return {
        "fraud_score": score,
        "fraud_band": band,
        "signals": signals,
        "computed_at": datetime.utcnow().isoformat()
    }


def audit_edited_fields(session_id: str, edited_fields: dict, payload: dict):
    flagged = []
    for field, edited_value in edited_fields.items():
        stt_key = f"stt_{field}"
        ocr_key = f"ocr_{field}"
        stt_value = payload.get(stt_key)
        ocr_value = payload.get(ocr_key)
        mismatch = False

        def safe_int(value):
            try:
                return int(value)
            except (TypeError, ValueError):
                return None

        def safe_float(value):
            try:
                return float(value)
            except (TypeError, ValueError):
                return None

        if field == "fullName":
            mismatch = (
                edited_value
                and stt_value
                and edited_value.strip().lower() != stt_value.strip().lower()
                and ocr_value
                and edited_value.strip().lower() != ocr_value.strip().lower()
            )
        elif field == "dateOfBirth":
            mismatch = edited_value not in {stt_value, ocr_value}
        elif field == "declaredAge":
            age_edited = safe_int(edited_value)
            age_stt = safe_int(stt_value)
            age_ocr = safe_int(ocr_value)
            diff_stt = abs(age_edited - age_stt) if (age_edited is not None and age_stt is not None) else 0
            diff_ocr = abs(age_edited - age_ocr) if (age_edited is not None and age_ocr is not None) else 0
            mismatch = (diff_stt > 5 if age_stt is not None else False) and (diff_ocr > 5 if age_ocr is not None else False)
        elif field == "monthlyIncome":
            income_edited = safe_float(edited_value)
            income_stt = safe_float(stt_value)
            income_ocr = safe_float(ocr_value)
            ratio_stt = abs(income_edited - income_stt) / (income_stt or income_edited or 1) if (income_edited is not None and income_stt is not None) else 0
            ratio_ocr = abs(income_edited - income_ocr) / (income_ocr or income_edited or 1) if (income_edited is not None and income_ocr is not None) else 0
            mismatch = ratio_stt > 0.4 and ratio_ocr > 0.4
        else:
            mismatch = (
                edited_value
                and stt_value
                and edited_value.strip().lower() != stt_value.strip().lower()
                and ocr_value
                and edited_value.strip().lower() != ocr_value.strip().lower()
            )

        if mismatch:
            write_audit_log(
                session_id,
                f"FIELD_EDIT_FLAGGED_{field.upper()}",
                {
                    "field": field,
                    "edited": edited_value,
                    "stt_original": stt_value,
                    "ocr_original": ocr_value,
                },
            )
            flagged.append({
                "field": field,
                "detail": {
                    "edited": edited_value,
                    "stt_original": stt_value,
                    "ocr_original": ocr_value,
                }
            })
    return flagged
