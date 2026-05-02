import boto3
import os
from datetime import datetime
from decimal import Decimal
from boto3.dynamodb.conditions import Key

# -------------------------
# DynamoDB Connection
# -------------------------
dynamodb = boto3.resource(
    "dynamodb",
    endpoint_url=os.getenv("DYNAMO_ENDPOINT", "http://localhost:8001"),
    region_name=os.getenv("DYNAMO_REGION", "ap-south-1"),
    aws_access_key_id="test",
    aws_secret_access_key="test"
)
def convert_floats_to_decimal(obj):
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: convert_floats_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_floats_to_decimal(i) for i in obj]
    else:
        return obj
# -------------------------
# Table Accessors
# -------------------------
def get_sessions_table():
    return dynamodb.Table("sessions")

def get_admin_table():
    return dynamodb.Table("admin_users")


def get_users_table():
    return dynamodb.Table("users")

def get_audit_table():
    return dynamodb.Table("audit_log")

# -------------------------
# WRITE OPERATIONS
# -------------------------
def write_session(session_id: str, data: dict):
    table = get_sessions_table()
    table.put_item(Item={
        "session_id": session_id,
        "created_at": datetime.utcnow().isoformat(),
        "status": "INITIATED",
        **data
    })

def update_session_status(session_id: str, status: str):
    table = get_sessions_table()
    table.update_item(
        Key={"session_id": session_id},
        UpdateExpression="SET #s = :s, updated_at = :u",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={
            ":s": status,
            ":u": datetime.utcnow().isoformat()
        }
    )

def write_audit_log(session_id: str, event: str, data: dict):
    table = get_audit_table()

    clean_data = convert_floats_to_decimal(data)  # ✅ FIX

    table.put_item(Item={
        "session_id": session_id,
        "timestamp": datetime.utcnow().isoformat(),
        "event": event,
        **clean_data
    })

# -------------------------
# READ OPERATIONS
# -------------------------

# Get all audit logs for a session
def get_audit_logs(session_id: str):
    table = get_audit_table()

    try:
        # Preferred: Query (requires sort key on timestamp)
        response = table.query(
            KeyConditionExpression=Key("session_id").eq(session_id)
        )
        return response.get("Items", [])

    except Exception:
        # Fallback: Scan (safe for hackathon)
        response = table.scan()
        items = response.get("Items", [])
        return [item for item in items if item.get("session_id") == session_id]


# Get all sessions (for dashboard)
def get_sessions():
    table = get_sessions_table()

    response = table.scan()

    return response.get("Items", [])


def create_or_update_user(email: str, data: dict):
    table = get_users_table()
    now = datetime.utcnow().isoformat()
    update_values = {
        "updated_at": now,
        **data,
        "email": email
    }
    table.put_item(Item=update_values)


def get_user_by_email(email: str):
    table = get_users_table()
    result = table.get_item(Key={"email": email})
    return result.get("Item")
