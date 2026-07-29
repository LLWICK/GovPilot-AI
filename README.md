# GovPilot AI v1 — Sri Lankan Centralized Citizen Portal

GovPilot AI is a centralized, service-agnostic digital public services portal built specifically for Sri Lankan citizens. No specific government service is hardcoded into the application logic, routing, or layouts. Instead, services are defined and loaded dynamically via JSON-based configurations.

This platform provides a unified workspace for citizens to interact conversationally with all government departments, supported by automated OCR document checking, real-time stepper tracking, and direct delivery.


---

## Core Features

1. **Service-Agnostic Engine**: Layouts, headers, document desks, progress bars, and vertical stepper trackers are populated dynamically from the active session's configuration parameters.
2. **Unified Conversational Dispatcher**: If a session starts with no preselected service, the citizen talks to a central AI dispatcher. The agent identifies the citizen's needs using text keyword intent detection and dynamically transitions the session to the target service (applying its workflow plan, steps, and document requirements).
3. **Conversational Agent Stream (SSE)**: Streams text messages and structured UI cards word-by-word from the FastAPI proxy using browser-native `ReadableStream` APIs.
4. **Automated OCR Polling**: Periodically requests document OCR scanning statuses every 2.5 seconds using TanStack Query and automatically halts polling once all files are verified.
6. **A11y Floor**: Standard focus rings, contrast ratios exceeding WCAG AA limits, and layout height stability.


## Run the Full Application Locally

These are the recommended instructions for running this branch on Windows.
The active API is the FastAPI application in `backend`; the separate `GenAI`
API described later in this README is retained only as legacy agent code.

### Prerequisites

- Docker Desktop
- Python 3.13
- [`uv`](https://docs.astral.sh/uv/)
- Node.js and npm
- A Groq API key

### 1. Configure the backend

```powershell
cd D:\Work\GovPilot-AI\backend

if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
}
```

Open `backend\.env` and set:

```env
GROQ_API_KEY=your_real_groq_key
```

Never commit or share the `.env` file.

Install the backend dependencies and Playwright browser:

```powershell
uv sync
uv run playwright install chromium
```

### 2. Start local infrastructure

Make sure Docker Desktop is running, then execute:

```powershell
cd D:\Work\GovPilot-AI\backend
docker compose up -d
docker compose ps
```

PostgreSQL, Redis, and MinIO should report `healthy`.

Apply the database migrations:

```powershell
uv run alembic upgrade head
```

### 3. Start FastAPI

```powershell
cd D:\Work\GovPilot-AI\backend
uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
```

> **Important on Windows:** do not add `--reload`. Uvicorn reload mode uses
> an event loop that cannot launch Playwright's browser subprocess. Chat
> requests that reach the Regulation Agent will otherwise fail with HTTP 502
> and `NotImplementedError`.

Leave this terminal running. Verify:

- Swagger: http://127.0.0.1:8000/docs
- Liveness: http://127.0.0.1:8000/api/v1/health/live
- Readiness: http://127.0.0.1:8000/api/v1/health/ready

### 4. Configure and start Next.js

Open another PowerShell terminal:

```powershell
cd D:\Work\GovPilot-AI\frontend

if (-not (Test-Path .env.local)) {
    Copy-Item .env.example .env.local
}

npm ci
npm run dev -- --hostname 127.0.0.1 --port 3450
```

Port `3450` is used because some Windows installations reserve the normal
Next.js port range around `3000`.

Open:

```text
http://127.0.0.1:3450/dashboard
```

### 5. Test the connected flow

1. Start a new General Inquiry Chat or select the NIC service.
2. Send: `I need help with a government service.`
3. When the assistant asks for clarification, reply:
   `I need to apply for a National Identity Card.`
4. Wait for the agent workflow. Live government-site retrieval can take
   30–60 seconds.
5. Refresh the page and confirm the conversation remains available.

The request path is:

```text
Next.js -> Next.js API proxy -> FastAPI -> PostgreSQL
        -> LangGraph -> Groq/Playwright -> SSE -> chat UI
```

Document upload and OCR are not connected yet. Document lists are currently
empty and upload attempts return HTTP 501.

### Local validation commands

Backend:

```powershell
cd D:\Work\GovPilot-AI\backend
uv run ruff check .
uv run pytest
uv run alembic check
```

Frontend:

```powershell
cd D:\Work\GovPilot-AI\frontend
npm run build
```

## GenAI Layer

The GenAI layer is a multi-agent system built with LangGraph that takes a
citizen's natural-language request, identifies the correct government agency
and service, retrieves live requirements from the agency's official website,
and generates step-by-step application guidance — with human-in-the-loop
clarification when a request is ambiguous.

### Architecture

```
Citizen Query
     │
     ▼
Orchestrator Agent (CA)
     │  parses intent, routes to the next agent, pauses for clarification
     │  via LangGraph interrupt() when the request is ambiguous
     ▼
Discovery Agent
     │  maps the request to a curated directory of verified, scrapable
     │  government endpoints
     ▼
Regulation Agent (RA)
     │  navigates the target government page (Playwright or HTTP tools,
     │  depending on whether the page requires JS rendering)
     │  extracts agency info, regulations, required documents, fees, and
     │  distinguishes downloadable forms from online application portals
     ▼
   ┌─────────────────────┬──────────────────────────┐
   ▼                      ▼
Guidance Agent         Portal Guidance Agent
(downloadable form     (online application portal —
 cases: reads any       provides self-service
 manual PDF + RA's      instructions rather than
 regulations, produces  attempting automated
 structured step-by-    submission)
 step guidance)
   └─────────────────────┴──────────────────────────┘
                          │
                          ▼
                 final_response returned to citizen
```

Every agent returns control to the Orchestrator after running, which decides
the next step based on what's present in shared state. Worker agents never
route directly to each other.

### Agents

- **Orchestrator (CA)** — intent parsing and routing supervisor. Uses
  LangGraph's `interrupt()`/`Command(resume=...)` to pause execution and ask
  the citizen a clarifying question when a request is ambiguous, then
  resumes the same graph run with their answer.
- **Discovery Agent** — matches a citizen's request to a known, pre-verified
  government service in a curated directory (chosen over open-ended live web
  search for reliability).
- **Regulation Agent (RA)** — the retrieval agent. Navigates the target
  government page using a small set of read-only tools
  (`navigate_to_page`, `find_links_matching`, `get_page_text`,
  `verify_downloadable_file`), and returns a structured result: agency name,
  source URL, regulations text, required documents, fees, processing time,
  and separated `form_pdfs` / `manual_pdfs`. Every field has a safe default,
  so partial or failed extractions degrade gracefully instead of crashing
  the pipeline.
- **Guidance Agent** — for downloadable-form cases. Reads any manual/guide
  PDF RA found, combines it with RA's scraped regulations, and produces
  structured, numbered step-by-step guidance for completing the
  application. Filters corrupted non-Unicode text that some legacy
  government PDFs produce for Sinhala/Tamil content before it reaches the
  LLM, and can render its output in English, Sinhala, or Tamil.
- **Portal Guidance Agent** — for services that require applying directly
  through an online government portal rather than a downloadable form.
  Gives the citizen clear self-service instructions and the portal link.
  Agents never submit applications on a citizen's behalf — this is a
  deliberate trust and safety boundary, not a missing feature.

### Design decisions worth knowing

- **Curated service directory over live web search.** Discovery matches
  requests against a small, manually verified set of government endpoints
  rather than searching the open web, prioritizing demo/production
  reliability over open-ended coverage. The architecture supports extending
  this to live search later.
- **No automated form submission.** RA and all downstream agents are
  read-only with respect to government systems — they retrieve and guide,
  they never act as the citizen.
- **Model standardization.** All tool-calling agents run on
  `llama-3.3-70b-versatile` via Groq, chosen after repeated tool-calling
  instability with `gpt-oss` model variants across multiple providers.

### API

FastAPI endpoints wrap the compiled LangGraph pipeline:

- `POST /query` — submit a new citizen request.
  ```json
  { "query": "I need a National Identity Card", "thread_id": "<session-id>", "language": "en" }
  ```
  Returns either `final_response` (completed guidance) or
  `needs_clarification` + `clarification_question` if the orchestrator needs
  more information.

- `POST /resume` — answer a pending clarification question for an existing
  session.
  ```json
  { "answer": "<citizen's answer>", "thread_id": "<same session-id>" }
  ```

- `GET /health` — liveness check.

Session continuity (including pause/resume for clarification) is handled by
a LangGraph checkpointer keyed on `thread_id` — every request in the same
conversation must reuse the same `thread_id`.

### Legacy: running the GenAI layer by itself

The following section runs the original standalone agent API for agent
experimentation. It is not required when running the connected frontend and
`backend` application described above.

**1. Prerequisites**
- Python 3.11+ (project developed against 3.13)
- A Groq API key

**2. Clone and enter the GenAI directory**
```bash
cd GenAI
```

**3. Create the environment and install dependencies with `uv`**

This project is developed and managed with [`uv`](https://docs.astral.sh/uv/).

```bash
uv sync
```

This creates a `.venv` and installs everything from `pyproject.toml` /
`uv.lock`. If you need to add the Playwright browser binaries (only
required if `pyproject.toml` doesn't already trigger this via a
post-install hook):
```bash
uv run playwright install chromium
```

If `pyproject.toml`/`uv.lock` isn't present or up to date, add the core
dependencies directly:
```bash
uv add langgraph langchain langchain-groq langchain-core \
    fastapi uvicorn httpx beautifulsoup4 lxml pypdf playwright python-dotenv

uv run playwright install chromium
```

To activate the environment manually (e.g. for ad-hoc scripts outside
`uv run`):
```bash
# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate
```

**5. Configure environment variables**

Create a `.env` file in the `GenAI` directory:
```env
GROQ_API_KEY=your_key_here
```

**6. Run the API server**
```bash
uv run uvicorn api.main:app --port 8000
```

> **Windows note:** Playwright launches a browser subprocess, which requires
> the `ProactorEventLoop` on Windows. If you see a `NotImplementedError` on
> startup or on the first request involving Playwright, ensure
> `asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())`
> is set at the top of `api/main.py` before any other imports, and run
> uvicorn without `--reload` while testing this.

**7. Verify it's running**
```bash
curl http://localhost:8000/health
```

**8. Send a test request**
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "I need a National Identity Card", "thread_id": "test-1", "language": "en"}'
```

A first-time request against an uncached service can take up to 60-100+
seconds, since RA performs live navigation and extraction against the real
government site. Subsequent requests for the same service are faster if a
response cache is enabled.
