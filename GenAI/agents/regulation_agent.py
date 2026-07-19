import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)

from langchain_groq import ChatGroq
from dotenv import load_dotenv
from states.agent_state import GovPilotState
from prompts.regulation_agent_prompt import RA_SYSTEM_PROMPT
from langchain.agents import create_agent
from tools.playwright_tools import RA_TOOLS ,  bind_session
#from tools.bs4_scrapper import HTTP_RA_TOOLS, HttpSession, bind_http_session
from tools.browser_session import BrowserSession
from states.Regulation_agent_structure import RAOutput
from langchain_core.output_parsers import JsonOutputParser

load_dotenv()

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0) 

async def regulation_agent(state: GovPilotState) -> dict:
    session = BrowserSession()
    bind_session(session)
    try:
        print("executing the Regulation agent.....")

        discovery = state.get("web_discovery_agent_output")
        if not discovery or not discovery.best_match:
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
            model=llm,
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
requires login/registration. Respond only with plain JSON matching your schema —
no markdown fences, no extra text."""

        result = await agent.ainvoke({
            "messages": [{"role": "user", "content": task}]
        })

        final_text = result["messages"][-1].content

        try:
            parsed = JsonOutputParser().parse(final_text)
            ra_output = RAOutput.model_validate(parsed)
        except Exception as e:
            print(f"RA parse failed: {e}\nRaw output: {final_text}")
            ra_output = RAOutput(retrieval_status="error", notes=str(e))

        return {"Regulation_agent_output": ra_output.model_dump()}

    finally:
        await session.close()



    