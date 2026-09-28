import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Tuple, Optional
from app.config import settings

logger = logging.getLogger("goveaseai.email")

def send_password_reset_email(
    to_email: str,
    recipient_name: str,
    otp: str,
    reset_token: str
) -> Tuple[bool, Optional[str]]:
    """
    Sends a security-verified password reset OTP email using Gmail SMTP.
    Includes the 6-digit OTP code and a one-click reset link.
    """
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Skipping email dispatch.")
        return False, "SMTP email service is not configured on the server."

    sender_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    reset_link = f"{frontend_url}/forgot-password?email={to_email}&token={reset_token}&otp={otp}"

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your GovEaseAI Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b1120; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 540px; background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);">
          
          <!-- Header Branding -->
          <tr>
            <td style="padding: 32px 36px 20px 36px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4); margin-bottom: 12px;">
                <span style="font-size: 24px;">🛡️</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">GovEaseAI</h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">AI-Powered Government Service Automation Platform</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 36px 24px 36px;">
              <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #f8fafc;">Password Reset Request</h2>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                Hello <strong style="color: #60a5fa;">{recipient_name}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1;">
                We received a request to reset your password for your GovEaseAI citizen account. Use the 6-digit verification code below to authorize this request:
              </p>

              <!-- OTP Code Display Card -->
              <div style="background: rgba(30, 41, 59, 0.85); border: 2px dashed rgba(59, 130, 246, 0.5); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="display: block; font-size: 11px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">Your One-Time Passcode (OTP)</span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; text-shadow: 0 0 12px rgba(56, 189, 248, 0.35);">{otp}</span>
                <span style="display: block; font-size: 12px; color: #f59e0b; margin-top: 8px;">⏱️ Valid for 15 minutes</span>
              </div>

              <!-- One-Click Reset Button -->
              <div style="text-align: center; margin: 28px 0 20px 0;">
                <a href="{reset_link}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 13px 32px; border-radius: 10px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 16px rgba(37, 99, 235, 0.35);">
                  Reset Password Directly &rarr;
                </a>
              </div>

              <p style="margin: 20px 0 0 0; font-size: 12px; line-height: 1.6; color: #94a3b8; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">
                <strong>Security Notice:</strong> If you did not initiate this password reset, please ignore this email or contact support. Your password will remain unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px 28px 36px; background-color: rgba(15, 23, 42, 0.6); text-align: center; font-size: 11px; color: #64748b;">
              <p style="margin: 0 0 6px 0;">GovEaseAI Digital Governance Directorate &copy; 2026. All rights reserved.</p>
              <p style="margin: 0;">This is an automated system email. Please do not reply directly to this message.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f'"{settings.SMTP_FROM_NAME}" <{sender_email}>'
        msg["To"] = to_email
        msg["Subject"] = f"GovEaseAI Password Reset Verification Code: {otp}"

        # Plain text fallback
        plain_text = f"Hello {recipient_name},\n\nYour GovEaseAI password reset verification code is: {otp}\n\nThis code expires in 15 minutes.\nOr reset directly at: {reset_link}\n\nIf you did not request this, please ignore this email."
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(sender_email, [to_email], msg.as_string())

        logger.info(f"Password reset email sent successfully to {to_email}")
        return True, None

    except Exception as e:
        logger.error(f"Failed to send password reset email to {to_email}: {e}")
        return False, str(e)


def send_password_changed_notification(
    to_email: str,
    recipient_name: str
) -> Tuple[bool, Optional[str]]:
    """
    Sends an immediate security confirmation when a user's password is changed.
    """
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        return False, "SMTP not configured"

    sender_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    html_content = f"""<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #0b1120; color: #f1f5f9; padding: 30px;">
  <div style="max-width: 500px; margin: 0 auto; background: #1e293b; padding: 30px; border-radius: 12px; border: 1px solid #334155;">
    <h2 style="color: #22c55e; margin-top: 0;">Password Successfully Changed</h2>
    <p>Hello <strong>{recipient_name}</strong>,</p>
    <p>Your GovEaseAI citizen portal account password was successfully updated.</p>
    <p style="color: #94a3b8; font-size: 13px;">If you made this change, no further action is required. If you did NOT make this change, please contact administration immediately.</p>
    <p style="font-size: 12px; color: #64748b; margin-top: 24px;">GovEaseAI Automated Security Service &copy; 2026</p>
  </div>
</body>
</html>"""

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f'"{settings.SMTP_FROM_NAME}" <{sender_email}>'
        msg["To"] = to_email
        msg["Subject"] = "Security Alert: Your GovEaseAI Password Has Been Reset"

        msg.attach(MIMEText(f"Hello {recipient_name},\n\nYour GovEaseAI password was successfully reset.\nIf you did not make this change, contact support.", "plain"))
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(sender_email, [to_email], msg.as_string())

        logger.info(f"Password changed confirmation sent to {to_email}")
        return True, None
    except Exception as e:
        logger.error(f"Failed to send confirmation email to {to_email}: {e}")
        return False, str(e)
