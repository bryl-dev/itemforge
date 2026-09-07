import math

from app.providers.base import Chunk
from app.providers.fixture import FixtureProvider
from app.providers.hashed_embed import hashed_embedding


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b, strict=True))


async def test_fixture_returns_cpsc210_bank_for_matching_source() -> None:
    provider = FixtureProvider()
    chunks = [
        Chunk(
            ordinal=0,
            content="An abstract data type (ADT) hides representation. A representation invariant is true of every well-formed instance.",
        )
    ]
    result = await provider.generate_items(chunks, count=4, question_type="multiple_choice")
    assert result.provider == "fixture"
    assert len(result.items) == 4
    assert all(item.choices for item in result.items)
    assert any("representation invariant" in item.stem.lower() for item in result.items)


async def test_fixture_generic_bank_includes_catch_all_options() -> None:
    provider = FixtureProvider()
    chunks = [Chunk(ordinal=0, content="Photosynthesis converts light energy into chemical energy in plants.")]
    result = await provider.generate_items(chunks, count=2, question_type="multiple_choice")
    catch_alls = [
        choice.content.lower()
        for item in result.items
        for choice in item.choices
    ]
    assert any("all of the above" in text for text in catch_alls)


def test_hashed_embeddings_are_similar_for_paraphrases() -> None:
    a = hashed_embedding("What is a representation invariant of an ADT?")
    b = hashed_embedding("What is a representation invariant of an abstract data type?")
    c = hashed_embedding("How do chlorophyll molecules absorb red light?")
    assert math.isclose(math.sqrt(sum(x * x for x in a)), 1.0, rel_tol=1e-5)
    assert cosine(a, b) > cosine(a, c)
