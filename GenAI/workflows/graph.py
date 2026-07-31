import sys
import os
import asyncio
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)

from langgraph import graph
from langgraph.graph import START, END, StateGraph
from agents.orchestrator_agent import orchestrator_agent
from agents.regulation_agent import regulation_agent
from agents.web_discovery_agent import discovery_agent
from agents.guidance_agent import guidance_agent
from agents.followup_chat_agent import followup_chat_agent
from states.agent_state import GovPilotState
from langgraph.checkpoint.memory import MemorySaver




graph = StateGraph(GovPilotState)

checkpointer = MemorySaver()


graph.add_node("orchestrator_agent", orchestrator_agent)
graph.add_node("web_discovery_agent", discovery_agent)
graph.add_node("regulation_agent", regulation_agent)
graph.add_node("guidance_agent", guidance_agent)
graph.add_node("followup_chat_agent", followup_chat_agent)
graph.add_edge(START, "orchestrator_agent")

graph.add_conditional_edges(
        "orchestrator_agent",
        lambda state: state.get("next_agent") or END,
        {
            "web_discovery_agent": "web_discovery_agent",
            "regulation_agent": "regulation_agent",
            "guidance_agent" : "guidance_agent",
            "followup_chat_agent" : "followup_chat_agent",
            
            END: END
        }
    )


graph.add_edge("regulation_agent", "orchestrator_agent")
graph.add_edge("web_discovery_agent", "orchestrator_agent")
graph.add_edge("guidance_agent", END)
graph.add_edge("followup_chat_agent", END)

# The active FastAPI backend compiles this graph with AsyncPostgresSaver.
# `builder` remains only for the deprecated standalone GenAI API.
workflow_graph = graph
builder = workflow_graph.compile(checkpointer=checkpointer)


async def run_workflow(query: str, thread_id: str = "default-session"):
    state = {
        "messages": [query]
    }
    config = {"configurable": {"thread_id": thread_id}}

    return await builder.ainvoke(state, config= config)



#query = "How to obtain an National Identity Card in Sri Lanka"
#result = asyncio.run(run_workflow(query))
#print(result['final_response'])




 

