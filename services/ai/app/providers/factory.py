from __future__ import annotations

from app.config import Settings
from app.providers.base import Provider
from app.providers.fixture import FixtureProvider
from app.providers.ollama import OllamaProvider
from app.providers.openai import OpenAIProvider


def create_provider(settings: Settings) -> Provider:
    if settings.ai_provider == "openai":
        return OpenAIProvider(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            embedding_model=settings.openai_embedding_model,
            timeout=settings.request_timeout_seconds,
        )
    if settings.ai_provider == "ollama":
        return OllamaProvider(
            base_url=settings.ollama_base_url,
            model=settings.ollama_model,
            embedding_model=settings.ollama_embedding_model,
            timeout=settings.request_timeout_seconds,
        )
    return FixtureProvider()
