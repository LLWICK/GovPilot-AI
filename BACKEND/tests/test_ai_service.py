import uuid

import pytest

from app.services.ai_service import AIService, PipelineNotConfiguredError


async def test_ai_service_fails_explicitly_without_pipeline() -> None:
    service = AIService()

    with pytest.raises(PipelineNotConfiguredError):
        await service.run(
            session_id=uuid.uuid4(),
            message="I need a passport",
            language="en",
        )
