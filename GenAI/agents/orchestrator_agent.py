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
from prompts.orchestrator_prompt import orchestrator_prompt
from langgraph.types import interrupt
from langchain_core.output_parsers import JsonOutputParser
from utills.agent_routing import route_to_next_agent
from utills.loggers import get_logger

from langchain_core.messages import HumanMessage
from config.llm_factory import get_llm

load_dotenv()

logger = get_logger("orchestrator_agent")


def orchestrator_agent(state: GovPilotState) -> dict:
    llm = get_llm(temperature=0.0)

    last_msg = state["messages"][-1]
    user_query = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
    logger.info("Starting Orchestrator for query: %s", user_query)

    if not state.get("parsed_intent"):
        chain = orchestrator_prompt | llm | JsonOutputParser()
        intent = chain.invoke({"question": user_query})

        if intent.get("clarifications_needed"):
            question = intent["clarifications_needed"][0]

            citizen_answer = interrupt({"question": question})

            # only reached AFTER resume — re-parse with the citizen's answer
            combined_query = f"{user_query}\nClarification: {citizen_answer}"
            intent = chain.invoke({"question": combined_query})

            return {
                "messages": [HumanMessage(content=combined_query)],
                "parsed_intent": intent,
                "next_agent": "web_discovery_agent",
            }
        
        return {
            
            "parsed_intent": intent,
            "next_agent": "web_discovery_agent"  # start the pipeline
        }
    
    # Step 3: Route based on what's been completed
    return route_to_next_agent(state)

    






    




 
