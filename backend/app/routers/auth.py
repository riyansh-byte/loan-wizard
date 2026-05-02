import logging
import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from boto3.dynamodb.conditions import Attr

from app.adapters.dynamo import get_sessions_table, get_admin_table, create_or_update_user
from app.services.email_service import (
    generate_temp_password,
    send_temp_password_email,
)

logger = logging.getLogger("loan-wizard")

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRES_MINUTES = 8 * 60


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TempPasswordRequest(BaseModel):
    session_id: str
    customer_email: EmailStr
    customer_name: str


class ChangePasswordRequest(BaseModel):
    email: EmailStr
    temp_password: str
    new_password: str


def create_access_token(subject: str, session_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRES_MINUTES)
    payload = {"sub": subject, "session_id": session_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def find_session_by_email(email: str) -> dict | None:
    table = get_sessions_table()
    response = table.scan(
        FilterExpression=Attr("customer_email").eq(email),
        ProjectionExpression="#sid, customer_email, customer_name, password_hash, temp_password_hash, temp_password_expires",
        ExpressionAttributeNames={"#sid": "session_id"},
    )
    items = response.get("Items", [])
    return items[0] if items else None


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    table = get_admin_table()
    response = table.get_item(Key={"email": request.email})
    item = response.get("Item")
    if not item:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    stored_hash = item.get("password_hash")
    if not stored_hash or not pwd_context.verify(request.password, stored_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    session_id = item.get("admin_id") or str(uuid.uuid4())
    access_token = create_access_token(subject=request.email, session_id=session_id)
    return TokenResponse(access_token=access_token)


@router.post("/send-temp-password")
async def send_temp_password(request: TempPasswordRequest):
    temp_password = generate_temp_password()
    temp_password_hash = pwd_context.hash(temp_password)
    expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()

    create_or_update_user(
        request.customer_email,
        {
            "temp_password_hash": temp_password_hash,
            "temp_password_expiry": expires_at,
            "status": "TEMP_PASSWORD",
            "customer_name": request.customer_name,
            "created_at": datetime.utcnow().isoformat(),
        },
    )

    try:
        email_sent = send_temp_password_email(
            request.customer_email,
            request.customer_name,
            temp_password,
            request.session_id,
        )
    except Exception as exc:
        logger.warning(f"Temp password email failed: {exc}")
        email_sent = False

    return {"success": email_sent}


@router.post("/change-password")
async def change_password(request: ChangePasswordRequest):
    user = get_user_by_email(request.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    temp_hash = user.get("temp_password_hash")
    temp_expires = user.get("temp_password_expiry")
    if not temp_hash or not temp_expires:
        raise HTTPException(status_code=401, detail="Temporary password invalid")

    expire_ts = datetime.fromisoformat(temp_expires)
    if datetime.utcnow() > expire_ts:
        raise HTTPException(status_code=401, detail="Temporary password expired")

    if not pwd_context.verify(request.temp_password, temp_hash):
        raise HTTPException(status_code=401, detail="Temporary password invalid")

    new_password_hash = pwd_context.hash(request.new_password)

    create_or_update_user(
        request.email,
        {
            "password_hash": new_password_hash,
            "status": "ACTIVE",
            "temp_password_hash": None,
            "temp_password_expiry": None,
        },
    )

    return {"success": True}
