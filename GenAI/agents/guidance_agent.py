import sys
import os
import asyncio
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)


from langchain_groq import ChatGroq
from tools.pdf_reader import download_and_extract_pdf_text
from states.agent_state import GovPilotState
from states.guidance_agent_structure import GuidanceOutput
from prompts.guidance_agent_prompt import GUIDANCE_PROMPT
from dotenv import load_dotenv
import json
from langchain_core.output_parsers import JsonOutputParser
from utills.loggers import get_logger
from config.llm_factory import get_llm

load_dotenv()

logger = get_logger("guidance_agent")

llm = ChatGroq(model="openai/gpt-oss-120b")

async def guidance_agent(state: GovPilotState) -> dict:
    logger.info("executing the guidance agent.....")
    ra_output = state["Regulation_agent_output"]

    manual_text = "(No separate guide document found — using page content and required documents below.)"
    if ra_output.get("manual_pdfs"):
        try:
            manual_text = await download_and_extract_pdf_text(ra_output["manual_pdfs"][0])
        except Exception as e:
            manual_text = f"(Could not read manual PDF: {e})"

    regulations_text = "\n".join(r["content"] for r in ra_output.get("regulations", []))
    required_docs = "\n".join(f"- {d['doc_name']}" for d in ra_output.get("required_documents", []))
    form_links = "\n".join(f"- {url}" for url in ra_output.get("form_pdfs", [])) or "(no direct form link found)"

    language_map = {"si": "Sinhala", "ta": "Tamil", "en": "English"}
    target_language = language_map.get(state.get("language", "en"), "English")

    prompt = GUIDANCE_PROMPT.format(
        manual_text=manual_text[:6000],
        regulations_text=regulations_text or "(none)",
        required_docs=required_docs or "(none listed)",
        form_links=form_links,
        target_language=target_language,
    )

    try:
        response = await llm.ainvoke([{"role": "user", "content": prompt}])
        parsed = JsonOutputParser().parse(response.content)
        guidance_output = GuidanceOutput.model_validate(parsed)
        guidance_output.agency_name = guidance_output.agency_name or ra_output.get("discovered_agency", "")
        guidance_output.language = state.get("language", "en")
    except Exception as e:
        print(f"Guidance parse failed: {e}\nRaw output: {locals().get('response', {}).get('content', '')}")
        guidance_output = GuidanceOutput(
            guidance_status="failed",
            agency_name=ra_output.get("discovered_agency", ""),
            notes=str(e),
        )

    return {
        "guidance_agent_output": guidance_output.model_dump(),
        "final_response": render_guidance_text(guidance_output),  
        "pipeline_complete": True
    }


def render_guidance_text(g: GuidanceOutput) -> str:
    """Turns the structured output into readable prose for the citizen-facing response."""
    if g.guidance_status == "failed":
        return f"I couldn't generate clear guidance for {g.agency_name or 'this service'}. {g.notes}".strip()

    agency = g.agency_name.strip() if g.agency_name and g.agency_name.strip() and g.agency_name.strip().lower() != "not specified" else ""
    header = f"Here's how to apply through {agency}:" if agency else "Here's how to apply:"

    lines = [header]
    for step in g.steps:
        step_title = step.title.strip() if step.title else ""
        step_instruction = step.instruction.strip() if step.instruction else ""
        if step_title and step_instruction and step_title.lower() != step_instruction.lower():
            lines.append(f"{step.step_number}. **{step_title}**: {step_instruction}")
        else:
            lines.append(f"{step.step_number}. {step_instruction or step_title}")

    if g.documents_to_prepare:
        valid_docs = [d for d in g.documents_to_prepare if d and d.strip()]
        if valid_docs:
            lines.append("\nDocuments to prepare:")
            lines.extend(f"- {d}" for d in valid_docs)

    if g.form_links:
        valid_links = [url for url in g.form_links if url and url.strip() and "no direct form link" not in url.lower() and "not provided" not in url.lower()]
        if valid_links:
            lines.append("\nApplication form(s):")
            lines.extend(f"- {url}" for url in valid_links)

    if g.fees_summary and "no fee information" not in g.fees_summary.lower() and "not specified" not in g.fees_summary.lower():
        lines.append(f"\nFees: {g.fees_summary}")

    if g.processing_time:
        lines.append(f"Processing time: {g.processing_time}")

    return "\n".join(lines).strip()
