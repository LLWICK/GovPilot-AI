import sys
import os
import asyncio
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the path to the parent directory (one level up)
parent_dir = os.path.dirname(current_dir)
# Add the parent directory to the system path
sys.path.append(parent_dir)



import asyncio
from document_agent import document_agent_node
from testing.json_test import RA_output


async def main(): 
    result = await document_agent_node(RA_output)
    print(result)

asyncio.run(main())