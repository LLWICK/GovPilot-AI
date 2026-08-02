from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import DatabaseSession
from app.schemas.auth import (
    AuthResponse,
    GoogleAuthRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    SendOTPRequest,
    VerifyOTPRequest,
)
from app.services.auth_service import (
    AuthService,
    DuplicateUserError,
    InvalidCredentialsError,
    UserNotFoundError,
)
from app.services.otp_service import OTPValidationError

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db: DatabaseSession) -> AuthResponse:
    try:
        return await AuthService(db).register(
            name=request.name,
            nic=request.nic,
            email=str(request.email),
            password=request.password,
        )
    except DuplicateUserError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db: DatabaseSession) -> AuthResponse:
    try:
        return await AuthService(db).login(email=str(request.email), password=request.password)
    except InvalidCredentialsError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc


@router.post("/google", response_model=AuthResponse)
async def google_auth(request: GoogleAuthRequest, db: DatabaseSession) -> AuthResponse:
    return await AuthService(db).google_login_or_register(
        email=str(request.email),
        name=request.name,
        google_id=request.google_id,
    )


@router.post("/send-otp")
async def send_otp(request: SendOTPRequest, db: DatabaseSession):
    try:
        await AuthService(db).send_otp(email=str(request.email), purpose=request.purpose)
        return {"message": "OTP verification code sent successfully."}
    except UserNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.post("/verify-otp")
async def verify_otp(request: VerifyOTPRequest, db: DatabaseSession):
    try:
        await AuthService(db).verify_email_otp(email=str(request.email), code=request.code)
        return {"message": "Email verified successfully."}
    except OTPValidationError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: DatabaseSession):
    try:
        await AuthService(db).reset_password(
            email=str(request.email),
            code=request.code,
            new_password=request.new_password,
        )
        return {"message": "Password reset successfully. You may now sign in with your new password."}
    except (OTPValidationError, UserNotFoundError) as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
