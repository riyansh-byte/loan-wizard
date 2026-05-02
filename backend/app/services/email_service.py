import smtplib
import random
import string
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def generate_temp_password(length=10) -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(random.choices(chars, k=length))


def send_temp_password_email(
    customer_email: str,
    customer_name: str,
    temp_password: str,
    session_id: str
) -> bool:
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASS", "")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Loan Wizard Application — Login Details"
    msg["From"] = smtp_user
    msg["To"] = customer_email

    html = f"""
    <div style="font-family: DM Sans, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #F9FAFB; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1A3F8F; font-weight: 700;">Loan Wizard</h2>
        <p style="color: #6B7280; font-size: 13px;">Powered by Poonawalla Fincorp</p>
      </div>
      <p style="color: #111827;">Dear {customer_name},</p>
      <p style="color: #374151; line-height: 1.6;">Your loan application has been successfully submitted. Use the credentials below to access your application portal.</p>
      <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em;">Temporary Password</p>
        <p style="font-size: 24px; font-weight: 700; color: #1A3F8F; font-family: monospace; letter-spacing: 0.1em;">{temp_password}</p>
        <p style="font-size: 12px; color: #DC2626;">⚠ Valid for 24 hours only</p>
      </div>
      <p style="color: #374151; line-height: 1.6;">Login at: <a href="http://localhost:5173/customer/login" style="color: #1A3F8F;">Loan Wizard Portal</a></p>
      <p style="color: #374151;">Application Reference: <strong style="font-family: monospace;">{session_id}</strong></p>
      <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;">
      <p style="font-size: 11px; color: #9CA3AF; text-align: center;">Poonawalla Fincorp Limited · NBFC regulated by RBI · This is an automated email.</p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, customer_email, msg.as_string())
        return True
    except Exception as exc:
        print(f"Email error: {exc}")
        return False
