import sys
import asyncio

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langgraph.types import Command
from workflows.graph import builder

app = FastAPI(title="GovPilot AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    query: str
    thread_id: str = "default-session"



class QueryResponse(BaseModel):
    final_response: str | None = None
    needs_clarification: bool = False
    clarification_question: str | None = None


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/query", response_model=QueryResponse)
async def query_govpilot(request: QueryRequest):
    print(f"thread_id received: {request.thread_id!r}")
    config = {"configurable": {"thread_id": request.thread_id}}

    result = await builder.ainvoke(
        {"messages": [request.query]},
        config=config,
    )

    if "__interrupt__" in result:
        question = result["__interrupt__"][0].value["question"]
        return QueryResponse(needs_clarification=True, clarification_question=question)

    return QueryResponse(final_response=result.get("final_response"))


class ResumeRequest(BaseModel):
    answer: str
    thread_id: str


@app.post("/resume", response_model=QueryResponse)
async def resume_query(request: ResumeRequest):
    print(f"Resume thread_id received: {request.thread_id!r}")
    config = {"configurable": {"thread_id": request.thread_id}}

    result = await builder.ainvoke(Command(resume=request.answer), config=config)

    if "__interrupt__" in result:
        question = result["__interrupt__"][0].value["question"]
        return QueryResponse(needs_clarification=True, clarification_question=question)

    return QueryResponse(final_response=result.get("final_response"))