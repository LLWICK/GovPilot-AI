from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.models import User
from app.schemas.auth import AuthResponse, AuthUser


class DuplicateUserError(ValueError):
    pass


class InvalidCredentialsError(ValueError):
    pass


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.settings = get_settings()

    async def register(self, *, name: str, nic: str, email: str, password: str) -> AuthResponse:
        normalized_email = email.strip().lower()
        duplicate = await self.db.scalar(
            select(User).where(or_(User.email == normalized_email, User.nic == nic))
        )
        if duplicate:
            raise DuplicateUserError("An account with this email or NIC already exists")

        user = User(
            name=name,
            nic=nic,
            email=normalized_email,
            password_hash=hash_password(password),
        )
        self.db.add(user)
        try:
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise DuplicateUserError("An account with this email or NIC already exists") from exc
        await self.db.refresh(user)
        return self._response(user)

    async def login(self, *, email: str, password: str) -> AuthResponse:
        user = await self.db.scalar(select(User).where(User.email == email.strip().lower()))
        if user is None or not verify_password(password, user.password_hash):
            raise InvalidCredentialsError("Invalid email or password")
        return self._response(user)

    def _response(self, user: User) -> AuthResponse:
        token = create_access_token(
            user.id,
            self.settings.auth_secret,
            self.settings.access_token_ttl_seconds,
        )
        return AuthResponse(
            access_token=token,
            user=AuthUser(id=user.id, name=user.name, email=user.email, nic=user.nic or ""),
        )
