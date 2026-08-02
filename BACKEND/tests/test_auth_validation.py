import pytest
from pydantic import ValidationError

from app.schemas.auth import RegisterRequest


def test_register_request_valid() -> None:
    req = RegisterRequest(
        name="  K. L. Perera  ",
        nic="198428109283",
        email="Perera@Example.COM ",
        password="SecurePassword123!",
    )
    assert req.name == "K. L. Perera"
    assert req.nic == "198428109283"
    assert req.email == "perera@example.com"
    assert req.password == "SecurePassword123!"


def test_register_request_old_nic_valid() -> None:
    req = RegisterRequest(
        name="Kamal Fernando",
        nic="842810928v",
        email="kamal@example.com",
        password="PassWord123!",
    )
    assert req.nic == "842810928V"


def test_register_request_invalid_name() -> None:
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(
            name="John123 #$",
            nic="198428109283",
            email="john@example.com",
            password="Password123!",
        )
    assert "Full Name must only contain letters" in str(exc.value)


def test_register_request_invalid_nic() -> None:
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(
            name="Kamal Silva",
            nic="1234567890",
            email="kamal@example.com",
            password="Password123!",
        )
    assert "Enter a valid Sri Lankan National Identity Card" in str(exc.value)


def test_register_request_invalid_email() -> None:
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(
            name="Kamal Silva",
            nic="198428109283",
            email="invalid-email-format",
            password="Password123!",
        )
    assert "Enter a valid email address" in str(exc.value)


def test_register_request_weak_password_no_uppercase() -> None:
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(
            name="Kamal Silva",
            nic="198428109283",
            email="kamal@example.com",
            password="password123!",
        )
    assert "uppercase" in str(exc.value)


def test_register_request_weak_password_short() -> None:
    with pytest.raises(ValidationError) as exc:
        RegisterRequest(
            name="Kamal Silva",
            nic="198428109283",
            email="kamal@example.com",
            password="Pass1!",
        )
    assert "8 characters" in str(exc.value)
