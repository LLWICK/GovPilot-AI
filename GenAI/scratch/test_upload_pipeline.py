import sys
import os
import asyncio

current_dir = os.path.dirname(os.path.abspath(__file__))
genai_dir = os.path.dirname(current_dir)
if genai_dir not in sys.path:
    sys.path.insert(0, genai_dir)

from workflows.graph import run_workflow
from agents.followup_chat_agent import followup_chat_agent

async def main():
    print("=== TEST DOCUMENT UPLOAD STATE RECOGNITION ===")
    
    # Step 1: Initial Query
    query = "How to obtain a National Identity Card in Sri Lanka"
    state1 = await run_workflow(query, thread_id="test-upload-session")
    
    # Step 2: Simulate Document Upload in State
    state1["uploaded_doc_paths"] = ["Birth Certificate (File: birth_cert_official.pdf)", "ICAO Photograph (File: photo.jpg)"]
    state1["messages"].append({"role": "user", "content": "I have uploaded my birth certificate and photo. What should I do now?"})
    
    # Step 3: Run Followup Agent with uploaded docs state
    result2 = await followup_chat_agent(state1)
    
    print("\n--- Response after uploading documents ---")
    print(result2["final_response"])

if __name__ == "__main__":
    asyncio.run(main())
