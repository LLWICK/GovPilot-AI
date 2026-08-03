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

from config.llm_factory import get_llm

load_dotenv()

logger = get_logger("discovery_agent")


async def discovery_agent(state: GovPilotState) -> dict:
    logger.info("executing the web discovery agent.....")
    query = state["messages"][-1].content
    llm = get_llm(temperature=0.2)

    directory_keys = "\n".join(f"- {k}" for k in FORM_DIRECTORY.keys())
    prompt = CLASSIFY_PROMPT.format(directory_keys=directory_keys, query=query)

    response = await llm.ainvoke([{"role": "user", "content": prompt}])
    matched_key = response.content.strip().lower()
    logger.info("Matched Service: %s", matched_key)

    if matched_key not in FORM_DIRECTORY:
        logger.info("Service not in curated directory. Executing Tier 2 search guidance...")
        search_results = await search_government_site.ainvoke({"query": query})
        
        guidance_prompt = f"""You are GovPilot AI, an expert, helpful civic assistant for Sri Lankan citizens.
A citizen asked the following question regarding a government procedure or service:
"{query}"

Here are relevant search results from official Sri Lankan government portals (.gov.lk):
{search_results}

Please provide a clear, step-by-step, comprehensive response explaining:
1. What official agency handles this process (if known).
2. Step-by-step instructions for completing the request.
3. Essential documents typically required.
4. Any relevant official website links from the search results above.

Ensure your response is clear, polite, and well-structured."""

        tier2_response = await llm.ainvoke([{"role": "user", "content": guidance_prompt}])
        final_text = tier2_response.content

        return {
            "web_discovery_agent_output": DiscoveryResult(
                status="not_found",
                best_match=None,
                alternatives=[],
                search_query_used=query,
            ),
            "final_response": final_text,
            "pipeline_complete": True,
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







    




 
