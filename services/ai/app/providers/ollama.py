from __future__ import annotations

import json
import time

import httpx

from .base import Chunk, Difficulty, GenerateResult, QuestionType
from .openai import ITEM_SCHEMA, PROMPT_VERSION, build_user_prompt, parse_items


class OllamaProvider:
    name = "ollama"

    def __init__(
        self,
        base_url: str,
        model: str,
        embedding_model: str,
        timeout: float,
    ) -> None:
        self.model = model
        self.embedding_model = embedding_model
        self._client = httpx.AsyncClient(base_url=base_url.rstrip("/"), timeout=timeout)

    async def generate_items(
        self,
        chunks: list[Chunk],
        *,
        count: int,
        question_type: QuestionType,
        difficulty: Difficulty | None = None,
    ) -> GenerateResult:
        started = time.perf_counter()
        response = await self._client.post(
            "/api/chat",
            json={
                "model": self.model,
                "stream": False,
                "format": ITEM_SCHEMA,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are an assessment author. Return only structured JSON.",
                    },
                    {
                        "role": "user",
                        "content": build_user_prompt(
                            chunks,
                            count=count,
                            question_type=question_type,
                            difficulty=difficulty,
                        ),
                    },
                ],
            },
        )
        response.raise_for_status()
        body = response.json()
        content = body.get("message", {}).get("content") or "{}"
        payload = json.loads(content) if isinstance(content, str) else content
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        return GenerateResult(
            items=parse_items(payload),
            provider=self.name,
            model=self.model,
            prompt_version=PROMPT_VERSION,
            latency_ms=elapsed_ms,
        )

    async def embed(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            response = await self._client.post(
                "/api/embeddings",
                json={"model": self.embedding_model, "prompt": text},
            )
            response.raise_for_status()
            vectors.append(response.json()["embedding"])
        return vectors
