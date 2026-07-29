from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import DatabaseSession
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest
from app.services.auth_service import AuthService, DuplicateUserError, InvalidCredentialsError

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
