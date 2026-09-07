from __future__ import annotations

import hashlib
import math
import re

_TOKEN = re.compile(r"[a-z0-9]+")
EMBED_DIM = 64


def hashed_embedding(text: str, dim: int = EMBED_DIM) -> list[float]:
    """Deterministic embedding used by the fixture provider.

    Tokens that two texts share pull their vectors together, so near-duplicate
    stems still look similar under cosine distance without a real model.
    """
    vec = [0.0] * dim
    tokens = _TOKEN.findall(text.lower())
    if not tokens:
        vec[0] = 1.0
        return vec

    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        for i in range(dim):
            vec[i] += (digest[i % len(digest)] - 128) / 128.0

    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]
