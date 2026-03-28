import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

SMTP_HOST  = os.getenv("SMTP_HOST",  "smtp.gmail.com")
SMTP_PORT  = int(os.getenv("SMTP_PORT", 587))
SMTP_USER  = os.getenv("SMTP_USER",  "")
SMTP_PASS  = os.getenv("SMTP_PASS",  "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@expenseai.com")

def send_notification(to_email: str, employee_name: str, status: str, reason: str, claim_id: int):
    status_label = {"APPROVED": "Approved", "REJECTED": "Rejected", "FLAGGED": "Flagged for Review"}.get(status, status)
    color        = {"APPROVED": "#4caf50", "REJECTED": "#ef5350", "FLAGGED": "#ffc107"}.get(status, "#888")

    html = f"""
    <div style="background:#0a0a0a;padding:40px;font-family:'Georgia',serif;">
      <div style="max-width:520px;margin:0 auto;background:#111;border-radius:14px;padding:32px;border:1px solid #1e1e1e;">
        <h2 style="color:#e0e0e0;margin:0 0 6px;">ExpenseAI Notification</h2>
        <p style="color:#444;font-size:13px;margin:0 0 24px;">Expense Claim Update</p>
        <p style="color:#aaa;font-size:14px;">Dear <strong style="color:#e0e0e0;">{employee_name}</strong>,</p>
        <p style="color:#aaa;font-size:14px;">Your expense claim <strong style="color:#e0e0e0;">#{claim_id}</strong> has been processed.</p>
        <div style="background:#141414;border-radius:10px;padding:16px;margin:20px 0;border-left:3px solid {color};">
          <p style="margin:0 0 6px;font-size:11px;color:#444;letter-spacing:1px;text-transform:uppercase;">Status</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:{color};">{status_label}</p>
        </div>
        <div style="background:#141414;border-radius:10px;padding:16px;margin:16px 0;">
          <p style="margin:0 0 6px;font-size:11px;color:#444;letter-spacing:1px;text-transform:uppercase;">Reason</p>
          <p style="margin:0;font-size:13px;color:#888;line-height:1.7;">{reason}</p>
        </div>
        <p style="color:#333;font-size:12px;margin-top:24px;">If you have questions, contact your finance team.</p>
        <p style="color:#222;font-size:11px;margin:0;">— ExpenseAI Automated Audit System</p>
      </div>
    </div>
    """

    if not SMTP_USER or not SMTP_PASS:
        print(f"[EMAIL SKIPPED] To: {to_email} | Claim #{claim_id} | Status: {status}")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"ExpenseAI — Claim #{claim_id} {status_label}"
        msg["From"]    = FROM_EMAIL
        msg["To"]      = to_email
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        print(f"[EMAIL SENT] To: {to_email} | Claim #{claim_id} | Status: {status}")
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")