from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

ProviderName = Literal["fixture", "openai", "ollama"]


class Settings(BaseSettings):
    """Process configuration, read once from the environment.

    The default provider is ``fixture`` so a fresh clone runs, and its tests
    pass, with no API key and no network access.
    """

    model_config = SettingsConfigDict(
        env_file=(".env", "../../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ai_provider: ProviderName = "fixture"

    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1"
    ollama_embedding_model: str = "nomic-embed-text"

    request_timeout_seconds: float = 60.0

    # Chunking. Values are in characters, not tokens: the boundary logic is
    # paragraph-aware, so character budgets are both adequate and portable.
    chunk_target_chars: int = 1200
    chunk_overlap_chars: int = 150
    chunk_min_chars: int = 200


@lru_cache
def get_settings() -> Settings:
    return Settings()
