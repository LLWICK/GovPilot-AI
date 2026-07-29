from fastapi import APIRouter
from sqlalchemy import select

from app.api.dependencies import DatabaseSession
from app.models import GovernmentService
from app.schemas.service import GovernmentServiceResponse

router = APIRouter(prefix="/services", tags=["services"])


@router.get("", response_model=list[GovernmentServiceResponse])
async def list_services(db: DatabaseSession) -> list[GovernmentService]:
    result = await db.scalars(
        select(GovernmentService)
        .where(GovernmentService.is_public.is_(True))
        .order_by(GovernmentService.name)
    )
    return list(result)
