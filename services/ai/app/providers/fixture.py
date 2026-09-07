from __future__ import annotations

import time

from .base import Chunk, GenerateResult, ItemDraft, QuestionType, Difficulty
from .hashed_embed import hashed_embedding

PROMPT_VERSION = "fixture-v1"

_CPSC210_BANK: list[ItemDraft] = [
    ItemDraft(
        stem="What is a representation invariant (RI) of an abstract data type?",
        type="multiple_choice",
        difficulty="medium",
        bloom_level="understand",
        explanation="The RI constrains the concrete representation; every public method must preserve it.",
        source_chunk_ordinal=0,
        choices=[
            {
                "label": "A",
                "content": "A condition that is true of every well-formed instance of the representation",
                "is_correct": True,
                "rationale": None,
            },
            {
                "label": "B",
                "content": "A mapping from a concrete representation to the abstract value it stands for",
                "is_correct": False,
                "rationale": "That is the abstraction function (AF), not the RI.",
            },
            {
                "label": "C",
                "content": "The set of methods a client is allowed to call",
                "is_correct": False,
                "rationale": "That is the ADT's public interface.",
            },
            {
                "label": "D",
                "content": "A proof that the implementation terminates on every input",
                "is_correct": False,
                "rationale": "Termination is a liveness property, independent of the RI.",
            },
        ],
    ),
    ItemDraft(
        stem="Why should tests of an ADT be written against the specification rather than the representation?",
        type="multiple_choice",
        difficulty="medium",
        bloom_level="analyze",
        explanation="Specification-based tests remain valid after a representation change; representation-based tests do not.",
        source_chunk_ordinal=0,
        choices=[
            {
                "label": "A",
                "content": "So the tests remain valid if the representation is rewritten",
                "is_correct": True,
                "rationale": None,
            },
            {
                "label": "B",
                "content": "Because the compiler cannot see private fields",
                "is_correct": False,
                "rationale": "Visibility is a language mechanism, not the methodological reason.",
            },
            {
                "label": "C",
                "content": "Because specifications are always shorter than implementations",
                "is_correct": False,
                "rationale": "Length is irrelevant; stability under change is the point.",
            },
            {
                "label": "D",
                "content": "So that code coverage tools report 100%",
                "is_correct": False,
                "rationale": "Coverage is a separate measurement and not the purpose of the rule.",
            },
        ],
    ),
    ItemDraft(
        stem="What does the abstraction function (AF) of an ADT describe?",
        type="multiple_choice",
        difficulty="easy",
        bloom_level="remember",
        explanation="The AF interprets a legal representation as the abstract value the client thinks they hold.",
        source_chunk_ordinal=0,
        choices=[
            {
                "label": "A",
                "content": "How a concrete representation maps onto the abstract value it represents",
                "is_correct": True,
                "rationale": None,
            },
            {
                "label": "B",
                "content": "Which fields of the class are private",
                "is_correct": False,
                "rationale": "Privacy is an encapsulation mechanism, not the AF.",
            },
            {
                "label": "C",
                "content": "The worst-case running time of each method",
                "is_correct": False,
                "rationale": "That is a complexity bound.",
            },
            {
                "label": "D",
                "content": "The exceptions a method is allowed to throw",
                "is_correct": False,
                "rationale": "That belongs to the method specification.",
            },
        ],
    ),
    ItemDraft(
        stem="A method of an ADT mutates private fields and leaves the representation in a state the RI forbids. What has gone wrong?",
        type="multiple_choice",
        difficulty="hard",
        bloom_level="apply",
        explanation="Preserving the RI is an implementation obligation of every method; violating it is a bug, not a client error.",
        source_chunk_ordinal=0,
        choices=[
            {
                "label": "A",
                "content": "The implementation has a bug: it failed to preserve the representation invariant",
                "is_correct": True,
                "rationale": None,
            },
            {
                "label": "B",
                "content": "The client violated the method's precondition",
                "is_correct": False,
                "rationale": "The RI is an implementor obligation, not a client one.",
            },
            {
                "label": "C",
                "content": "The abstraction function is not injective",
                "is_correct": False,
                "rationale": "AFs are typically not injective; that is normal.",
            },
            {
                "label": "D",
                "content": "The class should have been declared final",
                "is_correct": False,
                "rationale": "Extensibility is unrelated to RI preservation.",
            },
        ],
    ),
    ItemDraft(
        stem="Which statement best describes encapsulation in the ADT methodology?",
        type="multiple_choice",
        difficulty="easy",
        bloom_level="understand",
        explanation="Clients depend on the specification; the representation can change without forcing client changes.",
        source_chunk_ordinal=0,
        choices=[
            {
                "label": "A",
                "content": "Clients depend only on the specification, not on the hidden representation",
                "is_correct": True,
                "rationale": None,
            },
            {
                "label": "B",
                "content": "Every field of the class must be public so tests can inspect it",
                "is_correct": False,
                "rationale": "That would break encapsulation.",
            },
            {
                "label": "C",
                "content": "The representation invariant must be copied into every client",
                "is_correct": False,
                "rationale": "The RI is an implementor document, not a client one.",
            },
            {
                "label": "D",
                "content": "Methods may not throw exceptions",
                "is_correct": False,
                "rationale": "Specifications routinely include exceptions.",
            },
        ],
    ),
    ItemDraft(
        stem="True or false: two different representations can implement the same abstract data type.",
        type="true_false",
        difficulty="easy",
        bloom_level="remember",
        explanation="That is the point of separating specification from representation; a rewrite should preserve the spec.",
        source_chunk_ordinal=0,
        choices=[
            {
                "label": "A",
                "content": "True",
                "is_correct": True,
                "rationale": None,
            },
            {
                "label": "B",
                "content": "False",
                "is_correct": False,
                "rationale": "Different representations of the same spec are routine (e.g. list vs tree).",
            },
        ],
    ),
]


def _generic_item(ordinal: int, index: int, question_type: QuestionType) -> ItemDraft:
    topic = f"concept {index + 1} from chunk {ordinal}"
    if question_type == "true_false":
        return ItemDraft(
            stem=f"True or false: {topic} is defined in the source material.",
            type="true_false",
            difficulty="easy",
            bloom_level="remember",
            explanation="Fixture fallback used when the source does not match a recorded bank.",
            source_chunk_ordinal=ordinal,
            choices=[
                {"label": "A", "content": "True", "is_correct": True, "rationale": None},
                {"label": "B", "content": "False", "is_correct": False, "rationale": "The source discusses this topic."},
            ],
        )
    return ItemDraft(
        stem=f"Which of the following best describes {topic}?",
        type="multiple_choice",
        difficulty="medium",
        bloom_level="understand",
        explanation="Fixture fallback used when the source does not match a recorded bank.",
        source_chunk_ordinal=ordinal,
        choices=[
            {
                "label": "A",
                "content": f"The definition given in the source for {topic}",
                "is_correct": True,
                "rationale": None,
            },
            {
                "label": "B",
                "content": "An unrelated definition from a different chapter",
                "is_correct": False,
                "rationale": "This is not what the source states.",
            },
            {
                "label": "C",
                "content": "All of the above",
                "is_correct": False,
                "rationale": "A catch-all option; the rubric will flag it.",
            },
            {
                "label": "D",
                "content": "None of the above",
                "is_correct": False,
                "rationale": "A catch-all option; the rubric will flag it.",
            },
        ],
    )


class FixtureProvider:
    """Replays recorded drafts. No network, no key, deterministic.

    The recorded CPSC 210 bank is selected when the source mentions ADT
    vocabulary; otherwise a generic (intentionally imperfect) bank is used so
    the rubric has something to reject.
    """

    name = "fixture"
    model = "fixture-cpsc210"
    embedding_model = "hashed-v1"

    async def generate_items(
        self,
        chunks: list[Chunk],
        *,
        count: int,
        question_type: QuestionType,
        difficulty: Difficulty | None = None,
    ) -> GenerateResult:
        started = time.perf_counter()
        joined = " ".join(chunk.content for chunk in chunks).lower()
        use_bank = "abstract data type" in joined or "representation invariant" in joined

        pool: list[ItemDraft]
        if use_bank:
            pool = [item.model_copy(deep=True) for item in _CPSC210_BANK]
            if question_type != "multiple_choice":
                pool = [item for item in pool if item.type == question_type] or pool
            if difficulty:
                matching = [item for item in pool if item.difficulty == difficulty]
                if matching:
                    pool = matching
        else:
            ordinal = chunks[0].ordinal if chunks else 0
            pool = [_generic_item(ordinal, i, question_type) for i in range(max(count, 4))]

        items = (pool * ((count // len(pool)) + 1))[:count]
        elapsed_ms = int((time.perf_counter() - started) * 1000)

        return GenerateResult(
            items=items,
            provider=self.name,
            model=self.model,
            prompt_version=PROMPT_VERSION,
            prompt_tokens=0,
            completion_tokens=0,
            cost_usd=0.0,
            latency_ms=elapsed_ms,
        )

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [hashed_embedding(text) for text in texts]
