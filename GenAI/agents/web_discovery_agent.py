import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)


import asyncio
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from states.agent_state import GovPilotState
from langchain.agents import create_agent
from tools.bs4_scrapper import search_government_site
from prompts.web_discovery_prompt import DISCOVERY_SYSTEM_PROMPT, CLASSIFY_PROMPT
from states.web_discovery_structure import DiscoveryResult, DiscoveredPage

from langchain_core.output_parsers import JsonOutputParser
from langchain_openrouter import ChatOpenRouter
from data.agency_directory import FORM_DIRECTORY
from utills.loggers import get_logger

load_dotenv()

logger = get_logger("discovery_agent")



llm = ChatGroq(model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"))


async def discovery_agent(state: GovPilotState) -> GovPilotState:
    logger.info("executing the web discovery agent.....")
    query = state["messages"][-1].content

    directory_keys = "\n".join(f"- {k}" for k in FORM_DIRECTORY.keys())
    prompt = CLASSIFY_PROMPT.format(directory_keys=directory_keys, query=query)

    response = await llm.ainvoke([{"role": "user", "content": prompt}])
    matched_key = response.content.strip().lower()
    logger.info("Matched Service: %s", matched_key)

    if matched_key not in FORM_DIRECTORY:
        logger.warning("Key not found !")
        return {
            "web_discovery_agent_output": DiscoveryResult(
                status="not_found",
                best_match=None,
                alternatives=[],
                search_query_used=query,
            ),
            "final_response":"Sorry, This service is still not implemented!"
        }

    entry = FORM_DIRECTORY[matched_key]
    return {
        "web_discovery_agent_output": DiscoveryResult(
            status="found",
            best_match=DiscoveredPage(
                agency_name=entry["agency_name"],
                url=entry["url"],
                relevance_reason=entry["relevance_reason"],
            ),
            alternatives=[],
            search_query_used=query,
        )
    }







    




 
