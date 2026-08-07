
import sys
import os
import asyncio
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)

import base64
from io import BytesIO
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import JsonOutputParser
from prompts.doc_extraction_prompt import EXTRACTION_PROMPT
from langchain_ollama import ChatOllama
from pdf2image import convert_from_path
from tools.ocr_pipeline.image_preprocessor import preprocess_page
from states.form_structure import FormStructure
from states.agent_state import GovPilotState
from dotenv import load_dotenv
from tools.ocr_pipeline.document_classifier import  is_digital_pdf
from tools.ocr_pipeline.digital_pdf_extractor import extract_digital_text
from tools.ocr_pipeline.form_downloader import download_form



load_dotenv()

# Access variables
pop_path = os.getenv("poppler_path")


llm = ChatOllama(model="qwen2.5vl:7b", temperature=0, num_ctx=8192)



def image_to_base64(pil_image) -> str:
    buf = BytesIO()
    pil_image.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


async def extract_form_vlm(pil_image, page) -> dict:
    image_b64 = image_to_base64(pil_image)

    response = await llm.ainvoke([
        HumanMessage(content=[
            {"type": "text", "text": EXTRACTION_PROMPT.format(page_num = page)},
            {"type": "image_url", "image_url": f"data:image/png;base64,{image_b64}"},
        ])
    ])

    return JsonOutputParser().parse(response.content)


async def document_agent_node(state: dict) -> dict:
    doc = state.get("form_pdfs")[0]
    doc_path = await download_form(doc)
    if not doc_path:
        return {"Document_agent_output": None}

    if is_digital_pdf(doc_path):
        text = extract_digital_text(doc_path)
        return {"manual_text_extracted": text}

    pages = convert_from_path(doc_path, dpi=120, poppler_path=pop_path)
    page1 = preprocess_page(pages[0])

    #schema_json = str(FormStructure.model_json_schema())
    result = await extract_form_vlm(page1, 1)

    return {"Document_agent_output": result}