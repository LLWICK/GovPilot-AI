import httpx
import os

async def download_form(url: str, save_dir: str = "downloaded_forms") -> str:
    os.makedirs(save_dir, exist_ok=True)
    filename = url.split("/")[-1]
    filepath = os.path.join(save_dir, filename)

    async with httpx.AsyncClient(follow_redirects=True, timeout=20.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        with open(filepath, "wb") as f:
            f.write(response.content)

    return filepath

