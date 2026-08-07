import sys
import os
import asyncio

current_dir = os.path.dirname(os.path.abspath(__file__))
genai_dir = os.path.dirname(current_dir)
if genai_dir not in sys.path:
    sys.path.insert(0, genai_dir)

from workflows.graph import run_workflow

async def main():
    print("=== TEST 1: Cataloged Service (NIC) ===")
    query1 = "How to obtain a National Identity Card in Sri Lanka"
    result1 = await run_workflow(query1, thread_id="test-session-1")
    print("Status Result 1:", type(result1.get("final_response")), "Length:", len(str(result1.get("final_response"))))
    print("Snippet 1:", str(result1.get("final_response"))[:300])

    print("\n=== TEST 2: Uncataloged Service (EPF Refund) ===")
    query2 = "How do I claim my EPF refund in Sri Lanka?"
    result2 = await run_workflow(query2, thread_id="test-session-2")
    print("Status Result 2:", type(result2.get("final_response")), "Length:", len(str(result2.get("final_response"))))
    print("Snippet 2:", str(result2.get("final_response"))[:400])

if __name__ == "__main__":
    asyncio.run(main())
