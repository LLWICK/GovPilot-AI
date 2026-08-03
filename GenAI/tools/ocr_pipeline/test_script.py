

from pdf2image import convert_from_path

import os
from dotenv import load_dotenv
from document_classifier import is_digital_pdf

load_dotenv()

# Access variables
pop_path = os.getenv("poppler_path")


pth1 = "C:/Users/CHAMA COMPUTERS/Desktop/IDEALIZE_Hackathon/project/GovPilot-AI/GenAI/test_ocr/User Manual_eBMD Local Online Portal.pdf"
pth2 = "C:/Users/CHAMA COMPUTERS/Desktop/IDEALIZE_Hackathon/project/GovPilot-AI/GenAI/test_ocr/Particulars_for_registration_of_a_birth_2017-04-25.pdf"
""" pages = convert_from_path(pth, dpi=200, poppler_path=pop_path)
print(f"Rendered {len(pages)} pages") """



# test_preprocess.py
from pdf2image import convert_from_path
from image_preprocessor import preprocess_page

pth = "C:/Users/CHAMA COMPUTERS/Desktop/IDEALIZE_Hackathon/project/GovPilot-AI/GenAI/test_ocr/Particulars_for_registration_of_a_birth_2017-04-25.pdf"

pages = convert_from_path(
    pth,
    dpi=200,
    poppler_path= pop_path  # adjust to your actual poppler path
)

original = pages[0]
processed = preprocess_page(original)

# save both so you can visually compare before/after
original.save("test_original.png")
processed.save("test_processed.png")

print("Saved test_original.png and test_processed.png — open both and compare")