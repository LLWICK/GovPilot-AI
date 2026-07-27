# GovPilot Backend

FastAPI backend for persistent citizen sessions, AI orchestration, document
processing, and workflow tracking.

## Local setup

```powershell
Copy-Item .env.example .env
uv sync
docker compose up -d
uv run uvicorn app.main:app --reload --port 8000
```

Open:

- API documentation: http://localhost:8000/docs
- Liveness: http://localhost:8000/api/v1/health/live
- Readiness: http://localhost:8000/api/v1/health/ready
- MinIO console: http://localhost:9001

Run checks:

```powershell
uv run ruff check .
uv run pytest
```

Real secrets belong in `.env`, which is excluded from Git. `.env.example`
contains development-only placeholders.
