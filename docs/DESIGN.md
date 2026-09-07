# Design notes

Three decisions that are not obvious from the file tree, and the reasons they were made.

## 1. The AI engine is a separate Python service

The posting names TypeScript, Node, and Python together. The split is not ceremonial.

Generation, chunking, and embeddings change when the model changes. Screening, review state, export, and metrics do not. Putting the first group behind an HTTP boundary means the API can keep serving the bank when the engine is down (`GET /api/health` reports `degraded`, not `down`), and it means the engine can be replaced — OpenAI today, a fine-tuned local model tomorrow — without rewriting Sequelize models.

The cost of the split is operational: two processes, a timeout, a 502 path. That cost is paid once in `HttpAiEngineClient`. Everything above it sees a `AiEngine` interface, which is also what the tests fake.

## 2. The rubric is deterministic, not another LLM call

A second model judging the first model's output looks sophisticated and is almost always a worse screen. It is slow, it is expensive, it is non-deterministic, and it cannot be unit-tested in CI without a key.

The failure modes of generated MCQs are structural and well-known:

- more or less than one correct option
- "all of the above" / "none of the above"
- a conspicuously long correct option (test-wiseness)
- identical distractors
- a stem copied from the source so the item is a lookup, not a question

Those are string and counting checks. `ScreeningRubric` implements them, returns stable `code`s the UI can group on, and is covered by tests that do not touch the network. Findings are **persisted** on the question at generation time so a later rubric change cannot rewrite history.

Items that fail the screen still enter the review queue. Hiding them would hide the generator's mistakes from the person who has to live with it. The screen's job is to make the mistakes obvious, not to silently drop them.

## 3. Provenance and review are first-class tables

`generation_runs` records which provider, which model, which prompt version, how long it took, and what it cost. Every generated question has a foreign key to that row. "Where did this item come from?" is a join, not an archaeology problem.

`review_events` is append-only. Approve, reject, edit, reopen. Edit events store the stem before and after and the Levenshtein distance between them. The metrics endpoint is a read model over this log:

- **acceptance rate** — approved / (approved + rejected)
- **median edit distance** — how much rewriting the educator actually did
- **duplicate rate** — drafts flagged as near-duplicates
- **cost per accepted item** — run cost divided by accepted count
- **rubric error rate** — drafts that arrived with a screening error

Empty logs yield `null`, not `0`. A demo that has never been reviewed is not reporting that the model has a 0% acceptance rate.

Near-duplicate detection uses cosine similarity over stem embeddings. The default implementation does this in-process against JSON columns so SQLite (zero-install clone) and Postgres behave identically. Embedding dimensionality follows the provider — 64 for the fixture hash, 1536 for `text-embedding-3-small` — which is why a pgvector column with a frozen width is an optional swap (`PgVectorSimilarityIndex`), not the default. Freeze the production model, then index.

## What was deliberately not built

- Auth. A single-educator demo does not get more honest by adding a login page.
- Streaming generation. The request is short enough to be synchronous; a progress label in the UI is enough.
- An LMS. GIFT export is the integration. Building Moodle inside this repo would confuse the scope.
