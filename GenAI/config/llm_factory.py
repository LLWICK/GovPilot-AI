import os
from typing import Any
from dotenv import load_dotenv
from langchain_core.language_models import BaseChatModel

load_dotenv()

def get_llm(
    temperature: float = 0.2,
    max_tokens: int | None = None,
    timeout: float | None = None,
) -> BaseChatModel:
    """Returns an LLM instance configured for OpenRouter (defaulting to
    meta-llama/llama-3.3-70b-instruct:free) if OPENROUTER_API_KEY is present,
    otherwise falling back to ChatGroq.
    """
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        from langchain_openrouter import ChatOpenRouter
        model_name = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
        kwargs: dict[str, Any] = {
            "model": model_name,
            "api_key": openrouter_key,
            "temperature": temperature,
        }
        if max_tokens:
            kwargs["max_tokens"] = max_tokens
        if timeout:
            kwargs["timeout"] = timeout
        return ChatOpenRouter(**kwargs)
    
    from langchain_groq import ChatGroq
    model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    kwargs: dict[str, Any] = {
        "model": model_name,
        "temperature": temperature,
    }
    if max_tokens:
        kwargs["max_tokens"] = max_tokens
    if timeout:
        kwargs["timeout"] = timeout
    return ChatGroq(**kwargs)
