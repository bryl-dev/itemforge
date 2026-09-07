from __future__ import annotations

from typing import Literal, Protocol

from pydantic import BaseModel, Field

BloomLevel = Literal["remember", "understand", "apply", "analyze", "evaluate", "create"]
Difficulty = Literal["easy", "medium", "hard"]
QuestionType = Literal["multiple_choice", "true_false", "short_answer"]


class ChoiceDraft(BaseModel):
    label: str
    content: str
    is_correct: bool
    rationale: str | None = None


class ItemDraft(BaseModel):
    stem: str
    type: QuestionType = "multiple_choice"
    difficulty: Difficulty = "medium"
    bloom_level: BloomLevel = "understand"
    explanation: str | None = None
    choices: list[ChoiceDraft] = Field(default_factory=list)
    source_chunk_ordinal: int = 0


class GenerateResult(BaseModel):
    items: list[ItemDraft]
    provider: str
    model: str
    prompt_version: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    cost_usd: float = 0.0
    latency_ms: int = 0


class Chunk(BaseModel):
    ordinal: int
    content: str


class Provider(Protocol):
    name: str
    model: str
    embedding_model: str

    async def generate_items(
        self,
        chunks: list[Chunk],
        *,
        count: int,
        question_type: QuestionType,
        difficulty: Difficulty | None = None,
    ) -> GenerateResult: ...

    async def embed(self, texts: list[str]) -> list[list[float]]: ...
