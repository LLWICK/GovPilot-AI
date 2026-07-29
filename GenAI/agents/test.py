import sys
import os
import asyncio
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)



import asyncio
from agents.guidance_agent import guidance_agent

from testing.json_test import RA_output

async def main():
    fake_state = {"Regulation_agent_output": RA_output}
    result = await guidance_agent(fake_state)
    print(result["final_response"])

asyncio.run(main())
