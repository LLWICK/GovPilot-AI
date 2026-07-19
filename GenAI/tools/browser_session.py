# browser_session.py
from playwright.async_api import async_playwright, Browser, Page
from typing import Optional

class BrowserSession:
    """Holds one browser/page alive across a single RA agent invocation."""
    def __init__(self):
        self._playwright = None
        self._browser: Optional[Browser] = None
        self._page: Optional[Page] = None

    async def start(self):
        if self._browser is None:
            self._playwright = await async_playwright().start()
            self._browser = await self._playwright.chromium.launch(headless=True)
            self._page = await self._browser.new_page()

    async def get_page(self) -> Page:
        await self.start()
        return self._page

    async def close(self):
        if self._browser:
            await self._browser.close()
        if self._playwright:
            await self._playwright.stop()
        self._browser = None
        self._page = None

# One session per RA invocation — create fresh in regulation_agent_node, close when done