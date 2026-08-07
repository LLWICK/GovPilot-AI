import random
import string
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.otp import OTPCode
from app.services.email_service import EmailService


class OTPValidationError(ValueError):
    pass


class OTPService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.email_service = EmailService()

    async def generate_and_send_otp(self, email: str, purpose: str) -> str:
        """Generates a 6-digit OTP code, stores it in DB, and emails it to user."""
        code = "".join(random.choices(string.digits, k=6))
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

        otp_entry = OTPCode(
            email=email.strip().lower(),
            code=code,
            purpose=purpose,
            expires_at=expires_at,
            is_used=False,
        )
        self.db.add(otp_entry)
        await self.db.commit()

        await self.email_service.send_otp_email(
            to_email=email.strip().lower(),
            code=code,
            purpose=purpose,
        )
        return code

    async def verify_otp(self, email: str, code: str, purpose: str) -> bool:
        """Verifies an OTP code for a given email and purpose."""
        normalized_email = email.strip().lower()
        now = datetime.now(timezone.utc)

        stmt = (
            select(OTPCode)
            .where(
                OTPCode.email == normalized_email,
                OTPCode.code == code.strip(),
                OTPCode.purpose == purpose,
                OTPCode.is_used == False,
                OTPCode.expires_at > now,
            )
            .order_by(OTPCode.created_at.desc())
        )
        result = await self.db.scalar(stmt)

        if not result:
            raise OTPValidationError("Invalid or expired OTP verification code.")

        result.is_used = True
        await self.db.commit()
        return True
