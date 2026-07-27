from typing import Literal

import httpx
from fastapi import APIRouter, Response, status
from pydantic import BaseModel
from redis.asyncio import Redis
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import SessionFactory
from app.core.resources import get_redis

router = APIRouter(prefix="/health", tags=["health"])


class LivenessResponse(BaseModel):
    status: Literal["ok"]


class DependencyStatus(BaseModel):
    status: Literal["ok", "error"]
    detail: str | None = None


class ReadinessResponse(BaseModel):
    status: Literal["ok", "degraded"]
    dependencies: dict[str, DependencyStatus]


async def check_postgres() -> DependencyStatus:
    try:
        async with SessionFactory() as session:
            await session.execute(text("SELECT 1"))
        return DependencyStatus(status="ok")
    except Exception as exc:
        return DependencyStatus(status="error", detail=type(exc).__name__)


async def check_redis(redis: Redis) -> DependencyStatus:
    try:
        await redis.ping()
        return DependencyStatus(status="ok")
    except Exception as exc:
        return DependencyStatus(status="error", detail=type(exc).__name__)


async def check_object_storage() -> DependencyStatus:
    settings = get_settings()
    health_url = f"{str(settings.s3_endpoint_url).rstrip('/')}/minio/health/live"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(health_url)
            response.raise_for_status()
        return DependencyStatus(status="ok")
    except Exception as exc:
        return DependencyStatus(status="error", detail=type(exc).__name__)


@router.get("/live", response_model=LivenessResponse)
async def liveness() -> LivenessResponse:
    return LivenessResponse(status="ok")


@router.get("/ready", response_model=ReadinessResponse)
async def readiness(response: Response) -> ReadinessResponse:
    dependencies = {
        "postgres": await check_postgres(),
        "redis": await check_redis(get_redis()),
        "object_storage": await check_object_storage(),
    }
    ready = all(item.status == "ok" for item in dependencies.values())
    if not ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return ReadinessResponse(
        status="ok" if ready else "degraded",
        dependencies=dependencies,
    )
