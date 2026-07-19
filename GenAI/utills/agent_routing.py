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
    
    # No eligibility check yet → Regulation Agent

    if not state.get("web_discovery_agent_output"):
        return {"next_agent": "web_discovery_agent"}


    if not state.get("Regulation_agent_output"):
        return {"next_agent": "regulation_agent"}

    
    return {"next_agent": None, "final_response": state['final_response']}

    
    
    """ # Not eligible → stop and explain
    if not state["eligibility"]["eligible"]:
        response = compose_ineligibility_explanation(state)
        return {"next_agent": None, "final_response": response}
    
    # Documents not validated yet → Document Agent
    if state.get("uploaded_doc_paths") and not state.get("validation_results"):
        return {"next_agent": "document_agent"}
    
    # No workflow plan yet → Workflow Agent
    if not state.get("workflow_plan"):
        return {"next_agent": "workflow_agent"}
    
    # Workflow exists, trigger notifications
    if state.get("workflow_plan") and not state.get("notifications_sent"):
        return {"next_agent": "notification_agent"}
    
    # All done — compose final guidance
    response = compose_final_guidance(state)
    return {"next_agent": None, "final_response": response} """
