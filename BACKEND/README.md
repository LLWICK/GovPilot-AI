# GovPilot Backend

FastAPI backend for persistent citizen sessions, AI orchestration, document
processing, and workflow tracking.

## Local setup

```powershell
Copy-Item .env.example .env
uv sync
docker compose up -d
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open:

- API documentation: http://localhost:8000/docs
- Liveness: http://localhost:8000/api/v1/health/live
- Readiness: http://localhost:8000/api/v1/health/ready
- MinIO console: http://localhost:9001

Run checks:

```powershell
uv run alembic upgrade head
uv run ruff check .
uv run pytest
```

Real secrets belong in `.env`, which is excluded from Git. `.env.example`
contains development-only placeholders.

> Windows: do not add `--reload`. Uvicorn reload mode selects an event loop
> that cannot launch Playwright's browser subprocess. Stop and restart the
> backend manually after Python changes.

## Current API slice

- `GET /api/v1/services`
- `GET /api/v1/sessions`
- `POST /api/v1/sessions`
- `GET /api/v1/sessions/{session_id}`
- `GET /api/v1/sessions/{session_id}/messages`
- `POST /api/v1/sessions/{session_id}/messages`
- `GET /api/v1/sessions/{session_id}/documents`
- `PUT /api/v1/sessions/{session_id}/documents/{document_id}`

Citizen registration and credential login are available at
`POST /api/v1/auth/register` and `POST /api/v1/auth/login`. Passwords are
stored as salted scrypt hashes. Session endpoints require the bearer token
returned by login.

`POST /messages` now invokes the existing `GenAI` LangGraph through a temporary
compatibility adapter. The adapter will be removed after the agents are moved
into `backend/app/ai` and their imports and checkpoint storage are modernized.

LangGraph checkpoints are persisted in a local SQLite database at
`data/langgraph-checkpoints.sqlite3`. This allows an interrupted clarification
to resume after an API restart and avoids a Windows event-loop conflict between
async Psycopg and Playwright. PostgreSQL remains the source of truth for citizen
application data.

Run the checkpoint restart test:

```powershell
uv run pytest tests/test_durable_checkpoint.py
```
