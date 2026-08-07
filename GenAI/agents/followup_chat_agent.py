import sys
import os
import asyncio
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)


# agents/followup_chat_agent.py
from langchain_groq import ChatGroq
from states.agent_state import GovPilotState
from prompts.followup_agent_prompt import FOLLOWUP_PROMPT
from utills.loggers import get_logger
from dotenv import load_dotenv
from config.llm_factory import get_llm

load_dotenv()

logger = get_logger("followup_chat_agent")
llm = ChatGroq(model="openai/gpt-oss-120b", temperature=0, max_retries=1, timeout=25)




async def followup_chat_agent(state: GovPilotState) -> dict:
    logger.info("Handling follow-up question")
    llm = get_llm(temperature=0.2, timeout=25)
    ra = state.get("Regulation_agent_output", {}) or {}
    
    last_msg = state["messages"][-1]
    question = last_msg.content if hasattr(last_msg, "content") else str(last_msg)

    prompt = FOLLOWUP_PROMPT.format(
        agency=ra.get("discovered_agency", "the agency"),
        regulations="\n".join(r["content"] for r in ra.get("regulations", [])) if ra.get("regulations") else "(none)",
        required_docs="\n".join(f"- {d['doc_name']}" for d in ra.get("required_documents", [])) if ra.get("required_documents") else "(none)",
        fees=str(ra.get("fees", {})) if ra.get("fees") else "(none)",
        guidance_text=state.get("final_response", ""),
        source_url=ra.get("source_url", ""),
        question=question,
    )

    try:
        response = await llm.ainvoke([{"role": "user", "content": prompt}])
        return {"final_response": response.content}
    except Exception as exc:
        logger.error("Followup chat agent failed: %s", exc)
        return {
            "final_response": (
                "I'm sorry, our AI model service is currently experiencing high demand rate limits. "
                "Please try your question again in a few minutes."
            )
        }