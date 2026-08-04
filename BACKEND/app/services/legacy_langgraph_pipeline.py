import asyncio
import json
import os
import sys
import uuid
from pathlib import Path
from typing import Any, Literal

from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.types import Command

from app.core.config import get_settings
from app.services.ai_service import AIResult, PipelineRuntimeConfigurationError

BACKEND_ROOT = Path(__file__).resolve().parents[2]


def _ensure_playwright_compatible_event_loop() -> None:
    if sys.platform != "win32":
        return
    loop = asyncio.get_running_loop()
    if isinstance(loop, asyncio.SelectorEventLoop):
        raise PipelineRuntimeConfigurationError(
            "Playwright cannot run with Uvicorn reload mode on Windows. "
            "Stop the backend and restart it without --reload: "
            "uv run uvicorn app.main:app --host 127.0.0.1 --port 8000"
        )


def _as_dict(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if hasattr(value, "model_dump"):
        return value.model_dump()
    return {}


def _build_cards(result: dict[str, Any]) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []
    guidance = _as_dict(result.get("guidance_agent_output"))
    if guidance.get("steps"):
        cards.append(
            {
                "type": "step_plan",
                "steps": [
                    {
                        "id": str(step["step_number"]),
                        "label": step["title"],
                        "completed": False,
                        "current": step["step_number"] == 1,
                    }
                    for step in guidance["steps"]
                ],
            }
        )

    regulation = _as_dict(result.get("Regulation_agent_output"))
    documents = regulation.get("required_documents", [])
    if documents:
        cards.append(
            {
                "type": "document_request",
                "required": [
                    _as_dict(document).get("doc_name", "")
                    for document in documents
                    if _as_dict(document).get("doc_name")
                ],
            }
        )
    return cards


def _get_graph_definition():
    settings = get_settings()
    if settings.groq_api_key:
        os.environ.setdefault("GROQ_API_KEY", settings.groq_api_key)
    os.environ.setdefault("GROQ_MODEL", settings.groq_model)

    repository_root = Path(__file__).resolve().parents[3]
    genai_root = repository_root / "GenAI"
    if not genai_root.is_dir():
        raise RuntimeError(f"Legacy GenAI directory was not found at {genai_root}")
    genai_path = str(genai_root)
    if genai_path not in sys.path:
        sys.path.insert(0, genai_path)

    from workflows.graph import workflow_graph

    return workflow_graph


class LegacyGraphRuntime:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._context = None
        self._graph = None
        checkpoint_path = get_settings().checkpoint_database_path
        if not checkpoint_path.is_absolute():
            checkpoint_path = BACKEND_ROOT / checkpoint_path
        checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
        self._checkpoint_path = checkpoint_path

    async def get_graph(self):
        if self._graph is not None:
            return self._graph

        async with self._lock:
            if self._graph is not None:
                return self._graph

            context = AsyncSqliteSaver.from_conn_string(str(self._checkpoint_path))
            checkpointer = await context.__aenter__()
            try:
                await checkpointer.setup()
                graph = _get_graph_definition().compile(checkpointer=checkpointer)
            except Exception:
                await context.__aexit__(*sys.exc_info())
                raise

            self._context = context
            self._graph = graph
            return graph

    async def close(self) -> None:
        async with self._lock:
            if self._context is not None:
                await self._context.__aexit__(None, None, None)
            self._context = None
            self._graph = None


_runtime = LegacyGraphRuntime()


async def close_legacy_graph_runtime() -> None:
    await _runtime.close()


def _parse_result(result: dict[str, Any]) -> AIResult:
    interrupts = result.get("__interrupt__")
    if interrupts:
        value = interrupts[0].value
        question = value.get("question", "") if isinstance(value, dict) else str(value)
        return AIResult(
            status="clarification_required",
            content=question or "Please provide more details about the service you need.",
        )

    content = result.get("final_response")
    if isinstance(content, dict):
        content = json.dumps(content, ensure_ascii=False)
    if not isinstance(content, str) or not content.strip():
        content = "I could not generate guidance for this request."

    return AIResult(
        status="completed",
        content=content,
        cards=_build_cards(result),
    )


class LegacyLangGraphPipeline:
    """Compatibility bridge while the GenAI package is migrated into this backend."""

    async def run(
        self,
        *,
        session_id: uuid.UUID,
        message: str,
        language: Literal["en", "si", "ta"],
    ) -> AIResult:
        _ensure_playwright_compatible_event_loop()
        graph = await _runtime.get_graph()
        try:
            result = await graph.ainvoke(
                {
                    "messages": [message],
                    "session_id": str(session_id),
                    "language": language,
                },
                config={"configurable": {"thread_id": str(session_id)}},
            )
            return _parse_result(result)
        except Exception as exc:
            logger.error("AI pipeline execution failed for session %s: %s", session_id, exc)
            if "429" in str(exc) or "rate_limit" in str(exc).lower():
                return AIResult(
                    status="completed",
                    content=(
                        "I'm sorry, our AI model service is currently experiencing high demand rate limits. "
                        "Please wait a few moments and try your request again."
                    ),
                    cards=[],
                )
            return AIResult(
                status="completed",
                content=(
                    "I encountered a temporary service error while processing your request. "
                    "Please try again shortly."
                ),
                cards=[],
            )

    async def resume(
        self,
        *,
        session_id: uuid.UUID,
        answer: str,
    ) -> AIResult:
        _ensure_playwright_compatible_event_loop()
        graph = await _runtime.get_graph()
        try:
            result = await graph.ainvoke(
                Command(resume=answer),
                config={"configurable": {"thread_id": str(session_id)}},
            )
            return _parse_result(result)
        except Exception as exc:
            logger.error("AI pipeline resume failed for session %s: %s", session_id, exc)
            if "429" in str(exc) or "rate_limit" in str(exc).lower():
                return AIResult(
                    status="completed",
                    content=(
                        "I'm sorry, our AI model service is currently experiencing high demand rate limits. "
                        "Please wait a few moments and try your response again."
                    ),
                    cards=[],
                )
            return AIResult(
                status="completed",
                content=(
                    "I encountered a temporary service error while resuming your session. "
                    "Please try again shortly."
                ),
                cards=[],
            )
