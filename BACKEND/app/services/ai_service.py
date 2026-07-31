import uuid
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol


@dataclass(frozen=True)
class AIResult:
    status: Literal["completed", "clarification_required", "failed"]
    content: str
    cards: list[dict[str, Any]] = field(default_factory=list)


class AIPipeline(Protocol):
    async def run(
        self,
        *,
        session_id: uuid.UUID,
        message: str,
        language: Literal["en", "si", "ta"],
    ) -> AIResult: ...

    async def resume(
        self,
        *,
        session_id: uuid.UUID,
        answer: str,
    ) -> AIResult: ...


class PipelineNotConfiguredError(RuntimeError):
    pass


class PipelineRuntimeConfigurationError(RuntimeError):
    pass


class AIService:
    """Stable application boundary around the LangGraph implementation."""

    def __init__(self, pipeline: AIPipeline | None = None) -> None:
        self.pipeline = pipeline

    async def run(
        self,
        *,
        session_id: uuid.UUID,
        message: str,
        language: Literal["en", "si", "ta"],
    ) -> AIResult:
        if self.pipeline is None:
            raise PipelineNotConfiguredError(
                "The LangGraph pipeline adapter has not been registered yet."
            )
        return await self.pipeline.run(
            session_id=session_id,
            message=message,
            language=language,
        )

    async def resume(
        self,
        *,
        session_id: uuid.UUID,
        answer: str,
    ) -> AIResult:
        if self.pipeline is None:
            raise PipelineNotConfiguredError(
                "The LangGraph pipeline adapter has not been registered yet."
            )
        return await self.pipeline.resume(
            session_id=session_id,
            answer=answer,
        )
