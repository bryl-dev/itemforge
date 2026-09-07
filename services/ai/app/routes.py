from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.chunking import chunk_text
from app.config import Settings, get_settings
from app.providers.base import (
    Chunk,
    Difficulty,
    GenerateResult,
    ItemDraft,
    Provider,
    QuestionType,
)
from app.providers.factory import create_provider

router = APIRouter(prefix="/v1")


class ChunkRequest(BaseModel):
    text: str = Field(min_length=1)
    title: str | None = None


class ChunkResponse(BaseModel):
    chunks: list[Chunk]


class GenerateRequest(BaseModel):
    chunks: list[Chunk]
    count: int = Field(default=6, ge=1, le=20)
    type: QuestionType = "multiple_choice"
    difficulty: Difficulty | None = None


class EmbedRequest(BaseModel):
    texts: list[str] = Field(min_length=1)


class EmbedResponse(BaseModel):
    embeddings: list[list[float]]
    model: str
    provider: str


def get_provider(settings: Settings = Depends(get_settings)) -> Provider:
    return create_provider(settings)


@router.post("/chunk", response_model=ChunkResponse)
async def chunk_source(body: ChunkRequest, settings: Settings = Depends(get_settings)) -> ChunkResponse:
    return ChunkResponse(chunks=chunk_text(body.text, settings))


@router.post("/generate", response_model=GenerateResult)
async def generate(
    body: GenerateRequest,
    provider: Provider = Depends(get_provider),
) -> GenerateResult:
    if not body.chunks:
        raise HTTPException(status_code=422, detail="At least one chunk is required.")
    try:
        return await provider.generate_items(
            body.chunks,
            count=body.count,
            question_type=body.type,
            difficulty=body.difficulty,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Generation failed: {exc}") from exc


@router.post("/embed", response_model=EmbedResponse)
async def embed(
    body: EmbedRequest,
    provider: Provider = Depends(get_provider),
) -> EmbedResponse:
    try:
        vectors = await provider.embed(body.texts)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"Embedding failed: {exc}") from exc
    return EmbedResponse(embeddings=vectors, model=provider.embedding_model, provider=provider.name)


# Imported by tests that want to construct drafts without going through HTTP.
ItemDraft.model_rebuild()
