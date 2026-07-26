# utills/pdf_form_utils.py
from pypdf import PdfReader, PdfWriter

def check_fillable(pdf_path: str) -> bool:
    try:
        reader = PdfReader(pdf_path)
        return bool(reader.get_fields())
    except Exception:
        return False


def fill_pdf_form(pdf_path: str, output_path: str, field_values: dict) -> bool:
    """Only call this if check_fillable returned True."""
    try:
        reader = PdfReader(pdf_path)
        writer = PdfWriter()
        writer.append(reader)
        writer.update_page_form_field_values(writer.pages[0], field_values)
        with open(output_path, "wb") as f:
            writer.write(f)
        return True
    except Exception:
        return False



