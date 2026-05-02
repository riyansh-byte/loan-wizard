import boto3
import os
from passlib.context import CryptContext
from datetime import datetime
import uuid
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

dynamodb = boto3.resource(
    "dynamodb",
    endpoint_url=os.getenv("DYNAMO_ENDPOINT", "http://localhost:8001"),
    region_name="ap-south-1",
    aws_access_key_id="test",
    aws_secret_access_key="test"
)

def create_admin_users_table():
    existing = [table.name for table in dynamodb.tables.all()]
    if "admin_users" not in existing:
        dynamodb.create_table(
            TableName="admin_users",
            KeySchema=[{"AttributeName": "email", "KeyType": "HASH"}],
            AttributeDefinitions=[{"AttributeName": "email", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST"
        )
        print("Created: admin_users table")

def seed_admin(email: str, password: str, name: str, role: str = "admin"):
    table = dynamodb.Table("admin_users")
    hashed = pwd_context.hash(password)
    table.put_item(Item={
        "email": email,
        "password_hash": hashed,
        "name": name,
        "role": role,
        "created_at": datetime.utcnow().isoformat(),
        "admin_id": str(uuid.uuid4()),
        "active": True
    })
    print(f"Admin created: {email}")

if __name__ == "__main__":
    create_admin_users_table()
    seed_admin("admin@loanwizard.com", "Admin@2026", "System Admin", "superadmin")
    seed_admin("reviewer@poonawalla.com", "Review@2026", "Loan Reviewer", "reviewer")
    print("Seeding complete. Change passwords before production.")
