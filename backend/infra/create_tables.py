import boto3
import time

dynamodb = boto3.resource(
    "dynamodb",
    endpoint_url="http://localhost:8001",
    region_name="ap-south-1",
    aws_access_key_id="test",
    aws_secret_access_key="test"
)

def wait_for_table(table_name):
    table = dynamodb.Table(table_name)
    table.wait_until_exists()
    print(f"✔ {table_name} is active")

def create_tables():
    existing = [t.name for t in dynamodb.tables.all()]

    # -------------------------
    # Sessions table
    # -------------------------
    if "sessions" not in existing:
        dynamodb.create_table(
            TableName="sessions",
            KeySchema=[
                {"AttributeName": "session_id", "KeyType": "HASH"}
            ],
            AttributeDefinitions=[
                {"AttributeName": "session_id", "AttributeType": "S"}
            ],
            BillingMode="PAY_PER_REQUEST"
        )
        print("🛠️ Creating: sessions table...")
        wait_for_table("sessions")
    else:
        print("✔ sessions already exists")

    # -------------------------
    # Audit table
    # -------------------------
    if "audit_log" not in existing:
        dynamodb.create_table(
            TableName="audit_log",
            KeySchema=[
                {"AttributeName": "session_id", "KeyType": "HASH"},
                {"AttributeName": "timestamp", "KeyType": "RANGE"}
            ],
            AttributeDefinitions=[
                {"AttributeName": "session_id", "AttributeType": "S"},
                {"AttributeName": "timestamp", "AttributeType": "S"}
            ],
            BillingMode="PAY_PER_REQUEST"
        )
        print("🛠️ Creating: audit_log table...")
        wait_for_table("audit_log")
    else:
        print("✔ audit_log already exists")

    # -------------------------
    # Admin users table
    # -------------------------
    if "admin_users" not in existing:
        dynamodb.create_table(
            TableName="admin_users",
            KeySchema=[
                {"AttributeName": "email", "KeyType": "HASH"}
            ],
            AttributeDefinitions=[
                {"AttributeName": "email", "AttributeType": "S"}
            ],
            BillingMode="PAY_PER_REQUEST"
        )
        print("🛠️ Creating: admin_users table...")
        wait_for_table("admin_users")
    else:
        print("✔ admin_users already exists")

    # -------------------------
    # Customer users table
    # -------------------------
    if "users" not in existing:
        dynamodb.create_table(
            TableName="users",
            KeySchema=[
                {"AttributeName": "email", "KeyType": "HASH"}
            ],
            AttributeDefinitions=[
                {"AttributeName": "email", "AttributeType": "S"}
            ],
            BillingMode="PAY_PER_REQUEST"
        )
        print("🛠️ Creating: users table...")
        wait_for_table("users")
    else:
        print("✔ users already exists")

    print("\n🎉 All tables ready.\n")


if __name__ == "__main__":
    create_tables()
