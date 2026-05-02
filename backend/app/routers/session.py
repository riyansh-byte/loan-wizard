import uuid
import os
from datetime import datetime

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field

from app.adapters.dynamo import (
    update_session_status,
    write_audit_log,
    write_session,
)
from app.services.email_service import generate_temp_password, send_temp_password_email

router = APIRouter()

class SessionStartRequest(BaseModel):
    customer_name: str | None = None

class SessionStartResponse(BaseModel):
    session_id: str
    room_url: str
    status: str


class UploadUrlRequest(BaseModel):
    file_type: str
    upload_type: str


class ConfirmRequest(BaseModel):
    customer_name: str
    declared_income: float
    employment_type: str
    loan_purpose: str
    declared_age: int
    flagged_fields: list[str] = Field(default_factory=list)


class ConsentRequest(BaseModel):
    customer_name: str
    customer_email: str
    offer_variant: str
    offer_amount: float
    consent_phrase: str
    has_signature: bool


def get_s3_client():
    return boto3.client(
        "s3",
        endpoint_url=os.getenv("AWS_ENDPOINT_URL", "http://localhost:4566"),
        region_name=os.getenv("AWS_DEFAULT_REGION", "ap-south-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test"),
    )


def ensure_bucket_exists(s3_client, bucket_name: str):
    try:
        s3_client.head_bucket(Bucket=bucket_name)
        return
    except ClientError:
        pass

    region = os.getenv("AWS_DEFAULT_REGION", "ap-south-1")
    if region == "us-east-1":
        s3_client.create_bucket(Bucket=bucket_name)
    else:
        s3_client.create_bucket(
            Bucket=bucket_name,
            CreateBucketConfiguration={"LocationConstraint": region},
        )


def send_temp_password_email_safe(
    customer_email: str,
    customer_name: str,
    session_id: str,
):
    try:
        temp_password = generate_temp_password()
        send_temp_password_email(
            customer_email=customer_email,
            customer_name=customer_name,
            temp_password=temp_password,
            session_id=session_id,
        )
    except Exception as exc:
        print(f"Consent email error: {exc}")


@router.post("/start", response_model=SessionStartResponse)
async def start_session(request: SessionStartRequest):
    session_id = str(uuid.uuid4())
    
    # For local dev — return a mock room URL
    # Replace with real 100ms or Agora API call when keys are ready
    room_url = f"http://localhost:5173/call/{session_id}"
    
    write_session(session_id, {
        "room_url": room_url,
        "customer_name": request.customer_name or "unknown",
        "status": "INITIATED"
    })
    
    write_audit_log(session_id, "SESSION_STARTED", {
        "room_url": room_url
    })
    
    return SessionStartResponse(
        session_id=session_id,
        room_url=room_url,
        status="INITIATED"
    )

@router.post("/{session_id}/update-geo")
async def update_geo(session_id: str, geo: dict):
    write_audit_log(session_id, "GEO_CAPTURED", geo)
    return {"status": "ok"}

@router.get("/{session_id}/status")
async def get_status(session_id: str):
    from app.adapters.dynamo import get_sessions_table
    table = get_sessions_table()
    result = table.get_item(Key={"session_id": session_id})
    if "Item" not in result:
        raise HTTPException(status_code=404, detail="Session not found")
    return result["Item"]


@router.post("/{session_id}/upload-url")
async def generate_upload_url(session_id: str, request: UploadUrlRequest):
    if request.file_type not in {"image/jpeg", "image/png"}:
        raise HTTPException(status_code=400, detail="Invalid file_type")
    if request.upload_type not in {"document", "frame"}:
        raise HTTPException(status_code=400, detail="Invalid upload_type")

    bucket_name = "loan-wizard-uploads"
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    key = f"{request.upload_type}/{session_id}/{timestamp}.jpg"

    s3_client = get_s3_client()
    ensure_bucket_exists(s3_client, bucket_name)

    upload_url = s3_client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": bucket_name,
            "Key": key,
            "ContentType": request.file_type,
        },
        ExpiresIn=900,
    )

    return {
        "upload_url": upload_url,
        "key": key,
        "expires_in": 900,
    }


@router.post("/{session_id}/confirm")
async def confirm_hitl(session_id: str, request: ConfirmRequest):
    payload = {
        "customer_name": request.customer_name,
        "declared_income": request.declared_income,
        "employment_type": request.employment_type,
        "loan_purpose": request.loan_purpose,
        "declared_age": request.declared_age,
        "flagged_fields": request.flagged_fields,
    }

    write_audit_log(session_id, "HITL_CONFIRMED", payload)

    if request.flagged_fields:
        write_audit_log(session_id, "HITL_FLAGS_RAISED", {
            "flagged_fields": request.flagged_fields
        })

    update_session_status(session_id, "REVIEWED")

    return {
        "status": "ok",
        "flagged_count": len(request.flagged_fields),
    }


@router.post("/{session_id}/consent")
async def log_consent(
    session_id: str,
    request: ConsentRequest,
    background_tasks: BackgroundTasks,
):
    write_audit_log(session_id, "CONSENT_LOGGED", {
        "consent_timestamp": datetime.utcnow().isoformat(),
        "customer_name": request.customer_name,
        "customer_email": request.customer_email,
        "offer_variant": request.offer_variant,
        "offer_amount": request.offer_amount,
        "consent_phrase": request.consent_phrase,
        "has_signature": request.has_signature,
    })

    update_session_status(session_id, "COMPLETED")

    try:
        background_tasks.add_task(
            send_temp_password_email_safe,
            customer_email=request.customer_email,
            customer_name=request.customer_name,
            session_id=session_id,
        )
    except Exception as exc:
        print(f"Background email scheduling error: {exc}")

    return {
        "status": "ok",
        "session_id": session_id,
        "reference_number": f"LW-2026-{session_id[:5].upper()}",
    }
