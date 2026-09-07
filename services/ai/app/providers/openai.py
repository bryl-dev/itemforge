from __future__ import annotations

import time

import httpx

from .base import (
    Chunk,
    ChoiceDraft,
    Difficulty,
    GenerateResult,
    ItemDraft,
    QuestionType,
)

PROMPT_VERSION = "itemforge-v1"

ITEM_SCHEMA: dict = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "stem": {"type": "string"},
                    "type": {
                        "type": "string",
                        "enum": ["multiple_choice", "true_false", "short_answer"],
                    },
                    "difficulty": {"type": "string", "enum": ["easy", "medium", "hard"]},
                    "bloom_level": {
                        "type": "string",
                        "enum": [
                            "remember",
                            "understand",
                            "apply",
                            "analyze",
                            "evaluate",
                            "create",
                        ],
                    },
                    "explanation": {"type": "string"},
                    "source_chunk_ordinal": {"type": "integer"},
                    "choices": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "label": {"type": "string"},
                                "content": {"type": "string"},
                                "is_correct": {"type": "boolean"},
                                "rationale": {"type": "string"},
                            },
                            "required": ["label", "content", "is_correct", "rationale"],
                        },
                    },
                },
                "required": [
                    "stem",
                    "type",
                    "difficulty",
                    "bloom_level",
                    "explanation",
                    "source_chunk_ordinal",
                    "choices",
                ],
            },
        }
    },
    "required": ["items"],
}


def build_user_prompt(
    chunks: list[Chunk],
    *,
    count: int,
    question_type: QuestionType,
    difficulty: Difficulty | None,
) -> str:
    numbered = "\n\n".join(f"[chunk {c.ordinal}]\n{c.content}" for c in chunks)
    difficulty_line = f"Target difficulty: {difficulty}." if difficulty else "Mix easy, medium, and hard."
    return f"""You write assessment items for a university course.

Rules:
- Use only the source chunks below. Do not invent facts that are not supported.
- Prefer items that require reasoning over items that can be answered by lookup.
- For multiple choice: exactly one correct option, three plausible distractors, no "all of the above" or "none of the above".
- Distractors should be roughly the same length as the correct option.
- Set source_chunk_ordinal to the chunk the item is grounded in.
- {difficulty_line}

Produce {count} items of type {question_type}.

Source chunks:
{numbered}
"""


def parse_items(payload: dict) -> list[ItemDraft]:
    items: list[ItemDraft] = []
    for raw in payload.get("items", []):
        choices = [
            ChoiceDraft(
                label=choice.get("label", "?"),
                content=choice.get("content", ""),
                is_correct=bool(choice.get("is_correct")),
                rationale=choice.get("rationale") or None,
            )
            for choice in raw.get("choices", [])
        ]
        items.append(
            ItemDraft(
                stem=raw.get("stem", "").strip(),
                type=raw.get("type", "multiple_choice"),
                difficulty=raw.get("difficulty", "medium"),
                bloom_level=raw.get("bloom_level", "understand"),
                explanation=raw.get("explanation") or None,
                source_chunk_ordinal=int(raw.get("source_chunk_ordinal") or 0),
                choices=choices,
            )
        )
    return items


class OpenAIProvider:
    name = "openai"

    def __init__(
        self,
        api_key: str,
        model: str,
        embedding_model: str,
        timeout: float,
    ) -> None:
        if not api_key:
            raise ValueError("OPENAI_API_KEY is required when AI_PROVIDER=openai")
        self.model = model
        self.embedding_model = embedding_model
        self._client = httpx.AsyncClient(
            base_url="https://api.openai.com/v1",
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=timeout,
        )

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
            "/chat/completions",
            json={
                "model": self.model,
                "temperature": 0.4,
                "response_format": {
                    "type": "json_schema",
                    "json_schema": {
                        "name": "item_batch",
                        "strict": True,
                        "schema": ITEM_SCHEMA,
                    },
                },
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
        usage = body.get("usage") or {}
        content = body["choices"][0]["message"]["content"]
        import json

        payload = json.loads(content)
        elapsed_ms = int((time.perf_counter() - started) * 1000)
        prompt_tokens = int(usage.get("prompt_tokens") or 0)
        completion_tokens = int(usage.get("completion_tokens") or 0)
        return GenerateResult(
            items=parse_items(payload),
            provider=self.name,
            model=self.model,
            prompt_version=PROMPT_VERSION,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            cost_usd=_estimate_cost(self.model, prompt_tokens, completion_tokens),
            latency_ms=elapsed_ms,
        )

    async def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        response = await self._client.post(
            "/embeddings",
            json={"model": self.embedding_model, "input": texts},
        )
        response.raise_for_status()
        data = sorted(response.json()["data"], key=lambda row: row["index"])
        return [row["embedding"] for row in data]


def _estimate_cost(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    # Approximate published rates for gpt-4o-mini; used for the metrics dashboard,
    # not for billing. Unknown models report zero rather than guessing.
    rates = {
        "gpt-4o-mini": (0.15 / 1_000_000, 0.60 / 1_000_000),
        "gpt-4o": (2.50 / 1_000_000, 10.00 / 1_000_000),
    }
    prompt_rate, completion_rate = rates.get(model, (0.0, 0.0))
    return round(prompt_tokens * prompt_rate + completion_tokens * completion_rate, 6)
