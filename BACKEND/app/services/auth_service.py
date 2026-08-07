from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.auth import AuthResponse, AuthUser
from app.services.otp_service import OTPService, OTPValidationError


class DuplicateUserError(ValueError):
    pass


class InvalidCredentialsError(ValueError):
    pass


class UserNotFoundError(ValueError):
    pass


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.settings = get_settings()
        self.otp_service = OTPService(db)

    async def register(self, *, name: str, nic: str, email: str, password: str) -> AuthResponse:
        normalized_email = email.strip().lower()
        normalized_nic = nic.strip().upper()

        existing_email = await self.db.scalar(select(User).where(User.email == normalized_email))
        if existing_email:
            raise DuplicateUserError("An account with this email address already exists.")

        existing_nic = await self.db.scalar(select(User).where(User.nic == normalized_nic))
        if existing_nic:
            raise DuplicateUserError("An account with this NIC number already exists.")

        user = User(
            name=name,
            nic=normalized_nic,
            email=normalized_email,
            password_hash=hash_password(password),
            is_verified=False,
            auth_provider="credentials",
        )
        self.db.add(user)
        try:
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise DuplicateUserError("An account with this email address or NIC already exists.") from exc
        await self.db.refresh(user)

        # Trigger OTP for email verification upon registration
        try:
            await self.otp_service.generate_and_send_otp(normalized_email, "email_verification")
        except Exception:
            pass

        return self._response(user)

    async def login(self, *, email: str, password: str) -> AuthResponse:
        user = await self.db.scalar(select(User).where(User.email == email.strip().lower()))
        if user is None or not user.password_hash or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")
        return self._response(user)

    async def google_login_or_register(self, *, email: str, name: str, google_id: str) -> AuthResponse:
        normalized_email = email.strip().lower()

        user = await self.db.scalar(select(User).where(User.email == normalized_email))

        if not user:
            user = User(
                name=name.strip(),
                email=normalized_email,
                nic=None,
                password_hash=None,
                is_verified=True,
                auth_provider="google",
                google_id=google_id,
            )
            self.db.add(user)
            await self.db.commit()
            await self.db.refresh(user)
        else:
            # Update existing user record with google_id and mark verified if needed
            if not user.google_id:
                user.google_id = google_id
            user.is_verified = True
            await self.db.commit()
            await self.db.refresh(user)

        return self._response(user)

    async def send_otp(self, email: str, purpose: str) -> bool:
        normalized_email = email.strip().lower()
        user = await self.db.scalar(select(User).where(User.email == normalized_email))
        if not user and purpose == "password_reset":
            raise UserNotFoundError("No account registered with this email address.")

        await self.otp_service.generate_and_send_otp(normalized_email, purpose)
        return True

    async def verify_email_otp(self, email: str, code: str) -> bool:
        normalized_email = email.strip().lower()
        await self.otp_service.verify_otp(normalized_email, code, "email_verification")

        user = await self.db.scalar(select(User).where(User.email == normalized_email))
        if user:
            user.is_verified = True
            await self.db.commit()
        return True

    async def reset_password(self, email: str, code: str, new_password: str) -> bool:
        normalized_email = email.strip().lower()
        user = await self.db.scalar(select(User).where(User.email == normalized_email))
        if not user:
            raise UserNotFoundError("No account registered with this email address.")

        await self.otp_service.verify_otp(normalized_email, code, "password_reset")

        user.password_hash = hash_password(new_password)
        await self.db.commit()
        return True

    def _response(self, user: User) -> AuthResponse:
        token = create_access_token(
            user.id,
            self.settings.auth_secret,
            self.settings.access_token_ttl_seconds,
        )
        return AuthResponse(
            access_token=token,
            user=AuthUser(
                id=user.id,
                name=user.name,
                email=user.email,
                nic=user.nic or "",
                is_verified=user.is_verified,
                auth_provider=user.auth_provider,
            ),
        )
