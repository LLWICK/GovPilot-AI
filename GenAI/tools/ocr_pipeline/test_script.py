

from pdf2image import convert_from_path

import os
from dotenv import load_dotenv

load_dotenv()

# Access variables
pop_path = os.getenv("poppler_path")


pth = "C:/Users/CHAMA COMPUTERS/Desktop/IDEALIZE_Hackathon/project/GovPilot-AI/GenAI/test_ocr/User Manual_eBMD Local Online Portal.pdf"
pages = convert_from_path(pth, dpi=200, poppler_path=pop_path)
print(f"Rendered {len(pages)} pages")