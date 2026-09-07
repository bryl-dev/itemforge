from app.chunking import chunk_text
from app.config import Settings


def test_chunker_prefers_paragraph_boundaries() -> None:
    paragraphs = [f"Paragraph {i} " + ("word " * 40) for i in range(6)]
    text = "\n\n".join(paragraphs)
    settings = Settings(chunk_target_chars=400, chunk_overlap_chars=40, chunk_min_chars=50)
    chunks = chunk_text(text, settings)
    assert len(chunks) >= 2
    assert chunks[0].ordinal == 0
    assert all(chunk.content.strip() for chunk in chunks)


def test_empty_text_yields_no_chunks() -> None:
    settings = Settings()
    assert chunk_text("   \n\n  ", settings) == []


def test_short_text_is_a_single_chunk() -> None:
    settings = Settings(chunk_min_chars=20)
    chunks = chunk_text("An abstract data type hides representation.", settings)
    assert len(chunks) == 1
    assert "abstract data type" in chunks[0].content
