from __future__ import annotations

import re

from app.config import Settings
from app.providers.base import Chunk

_PARAGRAPH_SPLIT = re.compile(r"\n\s*\n")
_WHITESPACE = re.compile(r"[ \t]+")


def chunk_text(text: str, settings: Settings) -> list[Chunk]:
    """Split source text into overlapping, paragraph-aware chunks.

    We budget in characters rather than tokens so the algorithm stays
    independent of any particular tokenizer. Paragraph boundaries are preferred;
    a single oversized paragraph is hard-wrapped as a last resort.
    """
    cleaned = _WHITESPACE.sub(" ", text.replace("\r\n", "\n")).strip()
    if not cleaned:
        return []

    paragraphs = [p.strip() for p in _PARAGRAPH_SPLIT.split(cleaned) if p.strip()]
    if not paragraphs:
        paragraphs = [cleaned]

    raw: list[str] = []
    current = ""
    target = settings.chunk_target_chars
    overlap = settings.chunk_overlap_chars
    minimum = settings.chunk_min_chars

    def flush() -> None:
        nonlocal current
        piece = current.strip()
        if piece:
            raw.append(piece)
        current = ""

    for paragraph in paragraphs:
        if len(paragraph) > target:
            flush()
            raw.extend(_hard_wrap(paragraph, target, overlap))
            continue
        candidate = f"{current}\n\n{paragraph}".strip() if current else paragraph
        if len(candidate) <= target:
            current = candidate
        else:
            flush()
            current = paragraph
    flush()

    if len(raw) <= 1:
        chunks = raw or [cleaned]
    else:
        chunks = _apply_overlap(raw, overlap)

    # Drop trailing fragments that are too small to ground an item, unless that
    # would leave us with nothing.
    kept = [c for c in chunks if len(c) >= minimum]
    if not kept:
        kept = chunks

    return [Chunk(ordinal=i, content=c) for i, c in enumerate(kept)]


def _hard_wrap(text: str, target: int, overlap: int) -> list[str]:
    pieces: list[str] = []
    start = 0
    while start < len(text):
        end = min(len(text), start + target)
        if end < len(text):
            split = text.rfind(" ", start, end)
            if split > start + target // 2:
                end = split
        pieces.append(text[start:end].strip())
        if end >= len(text):
            break
        start = max(end - overlap, start + 1)
    return [p for p in pieces if p]


def _apply_overlap(parts: list[str], overlap: int) -> list[str]:
    if overlap <= 0 or len(parts) == 1:
        return parts
    overlapped: list[str] = [parts[0]]
    for i in range(1, len(parts)):
        prev_tail = parts[i - 1][-overlap:]
        overlapped.append(f"{prev_tail}\n\n{parts[i]}")
    return overlapped
