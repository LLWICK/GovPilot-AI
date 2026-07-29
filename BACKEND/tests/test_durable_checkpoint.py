from pathlib import Path

from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt
from typing_extensions import TypedDict


class ClarificationState(TypedDict):
    question: str
    answer: str


def ask_for_clarification(state: ClarificationState) -> dict[str, str]:
    answer = interrupt({"question": state["question"]})
    return {"answer": answer}


def build_graph(checkpointer: AsyncSqliteSaver):
    builder = StateGraph(ClarificationState)
    builder.add_node("ask", ask_for_clarification)
    builder.add_edge(START, "ask")
    builder.add_edge("ask", END)
    return builder.compile(checkpointer=checkpointer)


async def test_clarification_survives_checkpointer_recreation(
    tmp_path: Path,
) -> None:
    checkpoint_path = tmp_path / "checkpoints.sqlite3"
    config = {"configurable": {"thread_id": "restart-test"}}

    async with AsyncSqliteSaver.from_conn_string(str(checkpoint_path)) as saver:
        await saver.setup()
        first_graph = build_graph(saver)
        interrupted = await first_graph.ainvoke(
            {"question": "Which service?", "answer": ""},
            config=config,
        )
        assert interrupted["__interrupt__"][0].value == {
            "question": "Which service?"
        }

    async with AsyncSqliteSaver.from_conn_string(str(checkpoint_path)) as saver:
        second_graph = build_graph(saver)
        resumed = await second_graph.ainvoke(
            Command(resume="Passport renewal"),
            config=config,
        )
        assert resumed["answer"] == "Passport renewal"
