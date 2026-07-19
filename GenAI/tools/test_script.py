# test_playwright_tools.py
import asyncio
from browser_session import BrowserSession
from playwright_tools import (  # adjust import path to match your actual file
    bind_session,
    navigate_to_page,
    find_links_matching,
    get_page_text,
    verify_downloadable_file,
)


async def test_navigate_and_extract():
    session = BrowserSession()
    bind_session(session)

    try:
        print("\n=== Testing navigate_to_page ===")
        nav_result = await navigate_to_page.ainvoke({"url": "https://drc.gov.lk"})
        print(nav_result)

        print("\n=== Testing find_links_matching ===")
        links_result = await find_links_matching.ainvoke({"keyword": "download"})
        print(links_result)

        print("\n=== Testing get_page_text ===")
        text_result = await get_page_text.ainvoke({})
        print(text_result[:500], "...")

    finally:
        await session.close()


async def test_verify_file():
    session = BrowserSession()
    bind_session(session)

    try:
        print("\n=== Testing verify_downloadable_file ===")
        # swap in a real form link once find_links_matching gives you one
        result = await verify_downloadable_file.ainvoke({"url": "https://drc.gov.lk/some-form.pdf"})
        print(result)
    finally:
        await session.close()


async def test_domain_guard():
    session = BrowserSession()
    bind_session(session)

    try:
        print("\n=== Testing .gov.lk guard rejects non-gov URLs ===")
        result = await navigate_to_page.ainvoke({"url": "https://example.com"})
        print(result)
        # should print the "Refused" message WITHOUT actually launching a page.goto
    finally:
        await session.close()


async def main():
    await test_navigate_and_extract()
    await test_verify_file()
    await test_domain_guard()


if __name__ == "__main__":
    asyncio.run(main())