import sys
import os
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)

from states.agent_state import GovPilotState


def route_to_next_agent(state: GovPilotState) -> dict:
    """Determines the next agent in the pipeline."""
    
    if state.get("pipeline_complete"):
        return {"next_agent": "followup_chat_agent"}

    if not state.get("web_discovery_agent_output"):
        return {"next_agent": "web_discovery_agent"}

    discovery = state.get("web_discovery_agent_output")
    discovery_status = (
        discovery.get("status") if isinstance(discovery, dict) else getattr(discovery, "status", None)
    )

    if not state.get("Regulation_agent_output"):
        if discovery_status == "not_found":
            return {"next_agent": None, "final_response": state.get("final_response")}
            
        return {"next_agent": "regulation_agent"}

    if not state.get("guidance_agent_output"):
        regulation = state["Regulation_agent_output"]
        retrieval_status = (
            regulation.get("retrieval_status")
            if isinstance(regulation, dict)
            else getattr(regulation, "retrieval_status", None)
        )
        if retrieval_status == "not_found":
            return {
                "next_agent": None,
                "final_response": (
                    "I found the responsible agency, but its official online resource "
                    "was not available, so I could not verify the current requirements. "
                    "Please try again later or contact the agency directly."
                ),
            }
        if retrieval_status == "error":
            return {
                "next_agent": None,
                "final_response": (
                    "I could not safely retrieve verified guidance from the official "
                    "source. Please try again later."
                ),
            }
        return {"next_agent": "guidance_agent"}

    return {"next_agent": None, "final_response": state.get("final_response")}
