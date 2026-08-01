# test_ocr.py
from ocr_tool import extract_text_from_document


path = "C:/Users/CHAMA COMPUTERS/Desktop/IDEALIZE_Hackathon/project/GovPilot-AI/GenAI/test_ocr/ID_front.jpeg"

result = extract_text_from_document.invoke({"image_path": path})
print(result)