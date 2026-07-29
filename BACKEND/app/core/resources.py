from redis.asyncio import Redis

from app.core.config import get_settings
from app.core.database import engine

_redis: Redis | None = None


def get_redis() -> Redis:
    global _redis
    if _redis is None:
        _redis = Redis.from_url(
            get_settings().redis_url,
            encoding="utf-8",
            decode_responses=True,
        )
    return _redis


async def close_resources() -> None:
    global _redis
    from app.services.legacy_langgraph_pipeline import close_legacy_graph_runtime

    await close_legacy_graph_runtime()
    if _redis is not None:
        await _redis.aclose()
        _redis = None
    await engine.dispose()
