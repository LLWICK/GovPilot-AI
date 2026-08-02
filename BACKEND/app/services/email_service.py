import asyncio
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def send_otp_email(self, to_email: str, code: str, purpose: str) -> bool:
        """Sends an OTP email for verification or password reset."""
        action_title = (
            "Email Verification" if purpose == "email_verification" else "Password Reset Request"
        )
        action_text = (
            "verify your email address" if purpose == "email_verification" else "reset your password"
        )

        subject = f"GovPilot AI - Your {action_title} OTP: {code}"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }}
            .container {{ max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
            .logo {{ display: flex; align-items: center; gap: 8px; margin-bottom: 24px; text-decoration: none; color: #0f172a; font-weight: 800; font-size: 18px; }}
            .code-box {{ background: #f1f5f9; border-radius: 12px; border: 1px border-slate-300; padding: 16px; text-align: center; letter-spacing: 8px; font-size: 32px; font-weight: 800; color: #d97706; margin: 24px 0; }}
            .footer {{ margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; line-height: 1.5; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">
              <span>GovPilot AI</span>
            </div>
            <h2>{action_title}</h2>
            <p>You requested an OTP code to {action_text} for your GovPilot AI account.</p>
            <div class="code-box">{code}</div>
            <p style="font-size: 13px; color: #64748b;">This code is valid for <strong>10 minutes</strong>. If you did not request this code, please ignore this email.</p>
            <div class="footer">
              <p>GovPilot AI — Built for Sri Lankan Government Services</p>
            </div>
          </div>
        </body>
        </html>
        """

        # Log OTP code to console for local testing visibility
        logger.info(f"--- [OTP EMAIL LOG] To: {to_email} | Purpose: {purpose} | Code: {code} ---")

        if not self.settings.smtp_password and not self.settings.smtp_user:
            logger.warning("SMTP credentials not configured. OTP printed to logs above.")
            return True

        return await asyncio.to_thread(self._send_smtp, to_email, subject, html_content)

    def _send_smtp(self, to_email: str, subject: str, html_content: str) -> bool:
        try:
            msg = MIMEMultipart("alternative")
            sender = self.settings.smtp_user or self.settings.emails_from_email
            msg["From"] = f"{self.settings.emails_from_name} <{sender}>"
            msg["To"] = to_email
            msg["Subject"] = subject

            msg.attach(MIMEText(html_content, "html"))

            server = smtplib.SMTP(self.settings.smtp_host, self.settings.smtp_port, timeout=10)
            server.starttls()
            if self.settings.smtp_password:
                user = self.settings.smtp_user or sender
                server.login(user, self.settings.smtp_password)
            server.sendmail(sender, [to_email], msg.as_string())
            server.quit()
            logger.info(f"OTP email successfully sent via SMTP to {to_email}")
            return True
        except Exception as exc:
            logger.error(f"Failed to send OTP email via SMTP to {to_email}: {exc}")
            return False
