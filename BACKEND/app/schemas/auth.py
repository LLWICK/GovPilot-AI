import re
import uuid

from pydantic import Field, field_validator

from app.schemas.base import APIModel


class RegisterRequest(APIModel):
    name: str = Field(min_length=2, max_length=200)
    nic: str = Field(min_length=10, max_length=12)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name")
    @classmethod
    def validate_and_normalize_name(cls, value: str) -> str:
        normalized = " ".join(value.split())
        if len(normalized) < 2:
            raise ValueError("Full Name must contain at least 2 characters")
        if not re.match(r"^[A-Za-z\s\.\-']+$", normalized):
            raise ValueError("Full Name must only contain letters, spaces, dots, hyphens, or apostrophes")
        return normalized

    @field_validator("nic")
    @classmethod
    def validate_nic(cls, value: str) -> str:
        nic = value.strip().upper()
        old_format = len(nic) == 10 and nic[:9].isdigit() and nic[-1] in {"V", "X"}
        new_format = len(nic) == 12 and nic.isdigit()
        if not (old_format or new_format):
            raise ValueError("Enter a valid Sri Lankan National Identity Card (NIC) number (e.g. 198428109283 or 842810928V)")
        return nic

    @field_validator("email")
    @classmethod
    def validate_and_normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
            raise ValueError("Enter a valid email address")
        return email

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[\d\W]", value):
            raise ValueError("Password must contain at least one number or special character")
        return value


class LoginRequest(APIModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class AuthUser(APIModel):
    id: uuid.UUID
    name: str
    email: str
    nic: str
    is_verified: bool = False
    auth_provider: str = "credentials"


class AuthResponse(APIModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser


class GoogleAuthRequest(APIModel):
    email: str = Field(min_length=3, max_length=320)
    name: str = Field(min_length=1, max_length=200)
    google_id: str = Field(min_length=1, max_length=255)


class SendOTPRequest(APIModel):
    email: str = Field(min_length=3, max_length=320)
    purpose: str = Field(pattern="^(email_verification|password_reset)$")


class VerifyOTPRequest(APIModel):
    email: str = Field(min_length=3, max_length=320)
    code: str = Field(min_length=6, max_length=6)
    purpose: str = Field(pattern="^(email_verification|password_reset)$")


class ResetPasswordRequest(APIModel):
    email: str = Field(min_length=3, max_length=320)
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_complexity(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", value):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", value):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"[\d\W]", value):
            raise ValueError("Password must contain at least one number or special character")
        return value
