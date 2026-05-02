from fastapi import APIRouter, HTTPException, Query

from app.adapters.dynamo import get_sessions, get_audit_logs

router = APIRouter()


# -----------------------------
# SESSION LIST (PAGINATED)
# -----------------------------
@router.get("/sessions")
def list_sessions(limit: int = Query(10), offset: int = Query(0)):
    sessions = get_sessions()

    total = len(sessions)
    paginated = sessions[offset: offset + limit]

    return {
        "total": total,
        "count": len(paginated),
        "sessions": paginated
    }


# -----------------------------
# SESSION DETAIL
# -----------------------------
@router.get("/session/{session_id}")
def session_detail(session_id: str):
    logs = get_audit_logs(session_id)

    if not logs:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "audit": logs
    }