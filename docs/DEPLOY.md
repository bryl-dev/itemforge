# Deploy

The application is three processes and a database. Local development uses SQLite so a clone runs with no infrastructure. Production should use Postgres.

## Docker Compose

Requires Docker. This machine did not have it at the time of writing; the file is still the intended production shape.

```bash
cp .env.example .env
# optional: AI_PROVIDER=openai and OPENAI_API_KEY
docker compose up --build
```

Services:

| Name | Port | Image |
| --- | --- | --- |
| `db` | 5432 | `pgvector/pgvector:pg16` |
| `ai` | 8000 | `services/ai/Dockerfile` |
| `api` | 4000 | `apps/api/Dockerfile` |
| `web` | 80 | nginx serving the Vite build, proxying `/api` to the API |

Set `DB_DIALECT=postgres` and `DATABASE_URL` (already set in compose). On first boot the API runs migrations.

## Render

A `render.yaml` Blueprint is in the repo root. Create a Postgres instance, an AI web service (Python), an API web service (Node), and a static site for the UI.

Environment on the API service:

```
NODE_ENV=production
DB_DIALECT=postgres
DATABASE_URL=<render postgres url>
AI_ENGINE_URL=https://<ai-service>.onrender.com
WEB_ORIGIN=https://<web-service>.onrender.com
AI_PROVIDER=fixture   # or openai
```

Free Render instances cold-start. The fixture provider keeps a cold start from depending on OpenAI.

## Fly.io

```bash
fly launch --config fly.toml
```

Three apps (api, ai, web) plus a Fly Postgres. Same environment as above.

## What "deployed" means for this prototype

A reviewer should be able to:

1. Clone and run with SQLite + fixture in under five minutes, or
2. `docker compose up` if they have Docker.

A hosted URL is nicer and is the next step once a Render or Fly account is wired up. The GitHub repo is https://github.com/bryl-dev/itemforge. The recorded walkthrough in `docs/DEMO.md` covers the case where a reviewer does not run it locally.
