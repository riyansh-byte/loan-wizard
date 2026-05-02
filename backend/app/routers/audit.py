from fastapi import APIRouter, HTTPException

from app.adapters.dynamo import get_audit_logs

router = APIRouter()


# -----------------------------
# FULL AUDIT TRAIL
# -----------------------------
@router.get("/{session_id}")
def get_audit(session_id: str):
    logs = get_audit_logs(session_id)

    if not logs:
        raise HTTPException(status_code=404, detail="No audit logs found")

    # Sort by timestamp
    logs_sorted = sorted(logs, key=lambda x: x.get("timestamp", ""))

    return {
        "session_id": session_id,
        "events": logs_sorted
    }


# -----------------------------
# CONSENT ONLY
# -----------------------------
@router.get("/{session_id}/consent")
def get_consent(session_id: str):
    logs = get_audit_logs(session_id)

    consent_events = [
        log for log in logs
        if log.get("event") == "CONSENT_LOGGED"
    ]

    if not consent_events:
        raise HTTPException(status_code=404, detail="Consent not found")

    return {
        "session_id": session_id,
        "consent": consent_events[-1]  # latest
    }