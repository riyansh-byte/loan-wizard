from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime

from app.adapters.dynamo import write_audit_log, update_session_status

router = APIRouter()

# -----------------------------
# Request Schemas
# -----------------------------
class WebhookPayload(BaseModel):
    session_id: str
    data: dict


# -----------------------------
# STT COMPLETE
# -----------------------------
@router.post("/stt-complete")
def stt_complete(payload: WebhookPayload):
    write_audit_log(payload.session_id, "STT_COMPLETE", payload.data)
    update_session_status(payload.session_id, "STT_COMPLETE")

    return {"status": "ok", "event": "STT_COMPLETE"}


# -----------------------------
# CV COMPLETE
# -----------------------------
@router.post("/cv-complete")
def cv_complete(payload: WebhookPayload):
    write_audit_log(payload.session_id, "CV_COMPLETE", payload.data)
    update_session_status(payload.session_id, "CV_COMPLETE")

    return {"status": "ok", "event": "CV_COMPLETE"}


# -----------------------------
# OCR COMPLETE
# -----------------------------
@router.post("/ocr-complete")
def ocr_complete(payload: WebhookPayload):
    write_audit_log(payload.session_id, "OCR_COMPLETE", payload.data)
    update_session_status(payload.session_id, "OCR_COMPLETE")

    return {"status": "ok", "event": "OCR_COMPLETE"}