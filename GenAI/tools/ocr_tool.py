# tools/ocr_tool.py
import easyocr
from langchain_core.tools import tool
from pydantic import BaseModel, Field

_reader = None

def get_reader():
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(['en'])  # add 'si' only if you confirm a working Sinhala model
    return _reader

class OCRInput(BaseModel):
    image_path: str = Field(description="Path to the uploaded document image/scan")

@tool("extract_text_from_document", args_schema=OCRInput)
def extract_text_from_document(image_path: str) -> str:
    """Run OCR on an uploaded document image and return the raw extracted text."""
    reader = get_reader()
    try:
        results = reader.readtext(image_path, detail=0)
        return " ".join(results) if results else "No text detected in image."
    except Exception as e:
        return f"OCR failed: {str(e)}"

