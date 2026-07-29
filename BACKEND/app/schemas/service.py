import uuid

from app.schemas.base import APIModel


class GovernmentServiceResponse(APIModel):
    id: uuid.UUID
    service_id: str
    name: str
    agency_name: str
    description: str
    fee: str
    processing_time: str
