import pytest
from app.schemas.auth import GoogleAuthRequest, SendOTPRequest, VerifyOTPRequest, ResetPasswordRequest
from app.services.auth_service import AuthService
from app.services.otp_service import OTPService, OTPValidationError


def test_send_and_verify_otp_request_schemas() -> None:
    send_req = SendOTPRequest(email="test@domain.lk", purpose="email_verification")
    assert send_req.email == "test@domain.lk"
    assert send_req.purpose == "email_verification"

    verify_req = VerifyOTPRequest(email="test@domain.lk", code="123456", purpose="email_verification")
    assert verify_req.code == "123456"

    reset_req = ResetPasswordRequest(email="test@domain.lk", code="123456", new_password="NewPassword123!")
    assert reset_req.new_password == "NewPassword123!"


def test_google_auth_request_schema() -> None:
    req = GoogleAuthRequest(email="user@gmail.com", name="Google User", google_id="1234567890")
    assert req.google_id == "1234567890"
