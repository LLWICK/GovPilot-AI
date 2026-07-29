# frontend/app.py
import streamlit as st
import requests
import uuid

API_URL = "http://localhost:8000"

st.set_page_config(page_title="GovPilot AI", page_icon="🏛️")
st.title("🏛️ GovPilot AI")
st.caption("Your AI guide to Sri Lankan government services")

# one thread_id per browser session, persisted across reruns
if "thread_id" not in st.session_state:
    st.session_state.thread_id = str(uuid.uuid4())
if "messages" not in st.session_state:
    st.session_state.messages = []
if "awaiting_clarification" not in st.session_state:
    st.session_state.awaiting_clarification = False

# render chat history
for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

user_input = st.chat_input("What government service do you need help with?")

if user_input:
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)

    with st.chat_message("assistant"):
        with st.spinner("Working on it..."):
            try:
                if st.session_state.awaiting_clarification:
                    response = requests.post(
                        f"{API_URL}/resume",
                        json={"answer": user_input, "thread_id": st.session_state.thread_id},
                        #timeout=180,
                    )
                else:
                    response = requests.post(
                        f"{API_URL}/query",
                        json={"query": user_input, "thread_id": st.session_state.thread_id, "language": "en"},
                        #timeout=180,
                    )

                data = response.json()

                if data.get("needs_clarification"):
                    st.session_state.awaiting_clarification = True
                    reply = data["clarification_question"]
                else:
                    st.session_state.awaiting_clarification = False
                    reply = data.get("final_response") or "Sorry, I couldn't find guidance for that."

                st.markdown(reply)
                st.session_state.messages.append({"role": "assistant", "content": reply})

            except requests.exceptions.RequestException as e:
                error_msg = f"Connection error: {e}"
                st.error(error_msg)
                st.session_state.messages.append({"role": "assistant", "content": error_msg})

with st.sidebar:
    st.subheader("Session")
    st.text(f"Thread ID: {st.session_state.thread_id[:8]}...")
    if st.button("New conversation"):
        st.session_state.thread_id = str(uuid.uuid4())
        st.session_state.messages = []
        st.session_state.awaiting_clarification = False
        st.rerun()