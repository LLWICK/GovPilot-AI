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
from states.agent_state import GovPilotState



graph = StateGraph(GovPilotState)

graph.add_node("orchestrator_agent", orchestrator_agent)
graph.add_node("web_discovery_agent", discovery_agent)
graph.add_node("regulation_agent", regulation_agent)

graph.add_edge(START, "orchestrator_agent")

graph.add_conditional_edges(
        "orchestrator_agent",
        lambda state: state.get("next_agent") or END,
        {
            "web_discovery_agent": "web_discovery_agent",
            "regulation_agent": "regulation_agent",
            
            END: END
        }
    )


graph.add_edge("regulation_agent", "orchestrator_agent")

graph.add_edge("web_discovery_agent", "orchestrator_agent")


builder = graph.compile()

query = "Provide me with new identity card registration forms and regulations in Sri Lanka" 

res = asyncio.run(builder.ainvoke({"messages": [query]}))

print(res['Regulation_agent_output'])





    
    # All sub-agents return to CA
    

