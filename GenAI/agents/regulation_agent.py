import sys
import os
import json

from langchain_groq import ChatGroq
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)

from dotenv import load_dotenv
from states.agent_state import GovPilotState
from prompts.regulation_agent_prompt import RA_SYSTEM_PROMPT
from langchain.agents import create_agent
from tools.playwright_tools import RA_TOOLS ,  bind_session
from tools.browser_session import BrowserSession
from states.Regulation_agent_structure import RAOutput
from langchain_core.output_parsers import JsonOutputParser
from utills.loggers import get_logger
from config.llm_factory import get_llm

load_dotenv()

logger = get_logger("regulation_agent")

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0.0,
)
llm_tools = llm.bind_tools(RA_TOOLS)
#llm = ChatOpenRouter(model = "openai/gpt-oss-20b:free")

async def regulation_agent(state: GovPilotState) -> dict:
    logger.info("Executing RA Agent.....")
    llm = get_llm(temperature=0.0)
    llm_tools = llm.bind_tools(RA_TOOLS)
    session = BrowserSession()
    bind_session(session)
    try:
        

        discovery = state.get("web_discovery_agent_output")
        if not discovery or not discovery.best_match:
            logger.warning("No discovery result available — RA cannot proceed")
            return {
                "Regulation_agent_output": RAOutput(
                    retrieval_status="not_found",
                    notes="No discovery result available to navigate to.",
                ).model_dump()
            }
        
        system_prompt = RA_SYSTEM_PROMPT()

        match = discovery.best_match
        citizen_query = state["messages"][-1].content

        

        agent = create_agent(
            model=llm_tools,
            tools=RA_TOOLS,
            system_prompt=system_prompt,

        )

        task = f"""Navigate to the following government page and determine how the
                    citizen can access the form or service for their request.

                    Citizen's request: {citizen_query}
                    Target agency: {match.agency_name}
                    Target URL: {match.url}
                    Why this page was selected: {match.relevance_reason}

                    Determine whether this is a downloadable form, an online application portal, or
                    requires login/registration."""

        logger.info("Target URL: %s | Agency: %s", match.url, match.agency_name)
        result = await agent.ainvoke({
            "messages": [{"role": "user", "content": task}]
        })

        final_text = result["messages"][-1].content

        

        try:
            try:
                parsed = JsonOutputParser().parse(final_text)
            except Exception:
                json_start = final_text.find("{")
                json_end = final_text.rfind("}")
                if json_start < 0 or json_end <= json_start:
                    raise
                parsed = json.loads(final_text[json_start : json_end + 1])
            ra_output = RAOutput.model_validate(parsed)
        except Exception as e:
            logger.error(f"RA parse failed: {e}\nRaw output: {final_text}")
            ra_output = RAOutput(retrieval_status="error", notes=str(e))

        return {"Regulation_agent_output": ra_output.model_dump()}

    finally:
        await session.close()



    
