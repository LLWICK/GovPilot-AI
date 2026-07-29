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
    def normalize_name(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("nic")
    @classmethod
    def validate_nic(cls, value: str) -> str:
        nic = value.strip().upper()
        old_format = len(nic) == 10 and nic[:9].isdigit() and nic[-1] in {"V", "X"}
        new_format = len(nic) == 12 and nic.isdigit()
        if not (old_format or new_format):
            raise ValueError("Enter a valid Sri Lankan NIC number")
        return nic

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        local, separator, domain = email.partition("@")
        if not separator or not local or "." not in domain:
            raise ValueError("Enter a valid email address")
        return email


class LoginRequest(APIModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


class AuthUser(APIModel):
    id: uuid.UUID
    name: str
    email: str
    nic: str


class AuthResponse(APIModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
