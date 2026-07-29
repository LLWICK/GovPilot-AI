
import httpx
from pypdf import PdfReader
from io import BytesIO
import asyncio

async def download_and_extract_pdf_text(url: str) -> str:
    async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
        response = await client.get(url)
        response.raise_for_status()

    reader = PdfReader(BytesIO(response.content))
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""

    return text.strip()





