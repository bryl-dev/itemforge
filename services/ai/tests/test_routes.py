from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

SOURCE = (
    "An abstract data type (ADT) hides representation so clients depend only on a specification. "
    "A representation invariant (RI) is a condition that is true of every well-formed instance. "
    "An abstraction function (AF) maps a concrete representation to the abstract value it stands for."
)


def test_chunk_endpoint() -> None:
    response = client.post("/v1/chunk", json={"text": SOURCE})
    assert response.status_code == 200
    body = response.json()
    assert body["chunks"][0]["ordinal"] == 0
    assert "abstract data type" in body["chunks"][0]["content"].lower()


def test_generate_endpoint_uses_fixture_bank() -> None:
    chunks = client.post("/v1/chunk", json={"text": SOURCE}).json()["chunks"]
    response = client.post(
        "/v1/generate",
        json={"chunks": chunks, "count": 3, "type": "multiple_choice"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "fixture"
    assert len(body["items"]) == 3
    assert body["items"][0]["stem"]


def test_embed_endpoint_returns_unit_vectors() -> None:
    response = client.post("/v1/embed", json={"texts": ["representation invariant", "chlorophyll"]})
    assert response.status_code == 200
    embeddings = response.json()["embeddings"]
    assert len(embeddings) == 2
    assert len(embeddings[0]) == 64
