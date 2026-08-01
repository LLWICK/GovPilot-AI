# tools/document_classifier.py
import fitz  # PyMuPDF

def is_digital_pdf(path: str) -> bool:
    doc = fitz.open(path)
    text_found = any(page.get_text().strip() for page in doc)
    doc.close()
    return text_found