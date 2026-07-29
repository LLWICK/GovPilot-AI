# GovPilot Frontend

The Next.js application uses its `/api/proxy/*` routes as a server-side
Backend-for-Frontend. Those routes forward session and chat operations to the
FastAPI service configured by `BACKEND_URL`.

## Local setup

```powershell
Copy-Item .env.example .env.local
npm ci
```

Start FastAPI first:

```powershell
cd ..\backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

On Windows, do not add `--reload`; it is incompatible with Playwright's browser
subprocess.

On this Windows workstation, ports 3000 through 3449 are reserved. Start
Next.js on port 3450:

```powershell
cd ..\frontend
npm run dev -- --hostname 127.0.0.1 --port 3450
```

Open http://127.0.0.1:3450/dashboard.

## Current integration scope

- Session creation, listing, detail, and chat history use FastAPI/PostgreSQL.
- Chat calls LangGraph/Groq and is returned to the UI through SSE.
- Document lists are temporarily empty.
- Document upload returns HTTP 501 until the MinIO/OCR backend slice is added.
