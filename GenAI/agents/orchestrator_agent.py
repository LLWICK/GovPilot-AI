import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)

from langchain_groq import ChatGroq
from dotenv import load_dotenv
from states.agent_state import agent_state

load_dotenv()

llm = ChatGroq(model="openai/gpt-oss-120b")

def orchestrator_agent(state: agent_state)-> agent_state:

    user_query = state['query']

    result = llm.invoke(user_query)
    return({
        "response": result.content
    })

