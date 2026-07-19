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
from prompts.web_discovery_prompt import DISCOVERY_SYSTEM_PROMPT
from states.web_discovery_structure import DiscoveryResult
from langchain_core.output_parsers import JsonOutputParser


load_dotenv()

llm = ChatGroq(model="llama-3.3-70b-versatile")


async def discovery_agent(state: GovPilotState) -> GovPilotState:

    print("executing the web discovery agent.....")

    DISCOVERY_TOOLS = [search_government_site]

    service_info = state['parsed_intent']

    info = state['messages'][-1].content
    
    discovery_agent = create_agent(
    model=llm,
    tools=DISCOVERY_TOOLS,
    system_prompt=DISCOVERY_SYSTEM_PROMPT,
   
)
    

    result = await discovery_agent.ainvoke({
            "messages": [{
                "role": "user",
                "content": (
                    f"Find the government page for: {info}"
                ),
            }]
        })
    final_text = result["messages"][-1].content

    parsed = JsonOutputParser().parse(final_text)
    final_output = DiscoveryResult.model_validate(parsed)

    #state['web_discovery_agent_output'] = final_output
    return {
        "web_discovery_agent_output": final_output,
        "final_response": final_output
    }








    




 
