from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.risk import score_application
from app.services.fraud import compute_fraud_score
from app.services.decision import get_decision, get_decision_explanation
from app.services.llm import generate_offer_narration
from app.adapters.dynamo import (
    write_audit_log,
    update_session_status,
    get_audit_logs
)

router = APIRouter()


def is_kyc_complete(session_id: str) -> bool:
    logs = get_audit_logs(session_id)
    events = {log.get("event") for log in logs}
    required_events = {"STT_COMPLETE", "CV_COMPLETE", "OCR_COMPLETE"}
    return required_events.issubset(events)


# -----------------------------
# Request Schema
# -----------------------------
class OfferRequest(BaseModel):
    session_id: str
    transcript: str | None = None
    declared_income: float = 300000
    employment_type: str = "Salaried"
    loan_purpose: str = "Personal"
    declared_age: int = 30
    deepface_age: int | None = None
    deepface_liveness: bool = True
    stt_name: str | None = None
    ocr_name: str | None = None
    ip_city: str | None = None
    declared_city: str | None = None
    vpn_detected: bool = False
    intent_inconsistent: bool = False


# -----------------------------
# Generate Offer
# -----------------------------
@router.post("/generate")
async def generate_offer(req: OfferRequest):

    # 🔴 STEP 0: GATING (VERY IMPORTANT)
    if not is_kyc_complete(req.session_id):
        raise HTTPException(status_code=400, detail="KYC incomplete")

    # 1. Score credit risk
    risk_result = score_application({
        "AMT_INCOME_TOTAL": req.declared_income,
        "AMT_CREDIT": req.declared_income * 3,
        "AMT_ANNUITY": req.declared_income * 0.15,
        "DAYS_EMPLOYED": -1000,
        "DAYS_BIRTH": -(req.declared_age * 365),
        "NAME_INCOME_TYPE": 1 if req.employment_type == "Salaried" else 2,
        "NAME_EDUCATION_TYPE": 2,
        "REGION_RATING_CLIENT": 2,
        "CODE_GENDER": 1,
        "EXT_SOURCE_1": 0.5,
        "EXT_SOURCE_2": 0.5,
        "EXT_SOURCE_3": 0.5,
    })

    # 2. Compute fraud score (ASYNC ✅)
    fraud_result = await compute_fraud_score(req.session_id, req.dict())

    # 3. Decision (FIXED: only 2 args)
    decision = get_decision(
        risk_result["risk_band"],
        fraud_result["fraud_band"]
    )

    explanation = get_decision_explanation(
        decision,
        risk_result["risk_band"],
        fraud_result["fraud_score"]
    )

    # 4. Generate offers (SYNC ✅)
    offer_narration = generate_offer_narration(
        risk_band=risk_result["risk_band"],
        fraud_score=fraud_result["fraud_score"],
        max_amount=risk_result["max_eligible_amount"],
        loan_purpose=req.loan_purpose,
        persona="Growth-Oriented Professional"
    )

    # 5. Audit logging (SAFE)
    try:
        write_audit_log(req.session_id, "OFFER_GENERATED", {
            "risk_band": risk_result["risk_band"],
            "fraud_score": fraud_result["fraud_score"],
            "decision": decision.value,
            "offers_count": len(offer_narration.get("offers", []))
        })
    except Exception:
        pass

    # 6. Update session (SAFE)
    try:
        update_session_status(req.session_id, "OFFER_GENERATED")
    except Exception:
        pass

    # 7. Response
    return {
        "session_id": req.session_id,
        "risk": risk_result,
        "fraud": fraud_result,
        "decision": decision.value,
        "decision_explanation": explanation,
        "offers": offer_narration.get("offers", []),
        "meta": {
            "confidence": offer_narration.get("confidence_percent"),
            "fallback": offer_narration.get("fallback", False)
        }
    }
