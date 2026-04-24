# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# ── Demo app ──────────────────────────────────────────────────────────────────
# Install dependencies (Python 3.13+ required)
python3 -m venv .venv && source .venv/bin/activate
pip install dbos
# or with uv:
uv sync

# Run the demo app (serves on http://localhost:8000)
python3 app/main.py

# ── Dashboard backend ─────────────────────────────────────────────────────────
cd dashboard/backend
pip install -r requirements.txt
python main.py                        # serves API on http://localhost:4000

# ── Dashboard frontend (dev) ──────────────────────────────────────────────────
cd dashboard/frontend
npm install
npm run build                         # production build → dist/
npm run dev                           # dev server on http://localhost:5173, proxies /api → :4000

# ── Docker Compose (full stack) ───────────────────────────────────────────────
docker compose up --build             # demo app :8000, dashboard :4000
docker compose up --build dashboard   # rebuild dashboard only
```

No automated tests, no linting configuration.

## Environment

Set `DBOS_SYSTEM_DATABASE_URL` to a PostgreSQL connection string before running either service. If unset on the demo app, DBOS falls back to a local SQLite file (`dbos_app_starter.sqlite`). The `dbos-config.yaml` reads this variable for the DBOS CLI.

The dashboard **requires** a real PostgreSQL URL — it does not support SQLite fallback.

In Docker, both services reach the host's native PostgreSQL via `host.docker.internal` (mapped to the docker bridge gateway by `extra_hosts: host-gateway` in `docker-compose.yml`).

## Architecture

### Demo app

**`app/main.py`** — FastAPI + DBOS backend. Five endpoints and one durable workflow:
- `GET /` — serves the HTML frontend
- `GET /workflow/{task_id}` — idempotently launches the durable workflow (`SetWorkflowID` deduplicates)
- `GET /last_step/{task_id}` — returns the last completed step number (0–3) via `DBOS.get_event()`
- `POST /crash` — calls `os._exit(1)` to simulate a hard crash (demo only)

**`html/app.html`** — Single-file vanilla JS frontend. Polls `/last_step/{task_id}` every ~1.667s, highlights the active step, and shows a "Reconnecting…" overlay after a crash.

### Dashboard

**`dashboard/backend/main.py`** — FastAPI service that uses the DBOS Python SDK in management-only mode (`DBOS.launch()` is called so the system DB is accessible, but the app name `"dbos-dashboard"` has no registered workflows so no recovery runs). Exposes:
- `GET /api/workflows` — list workflows with filters: `status`, `name`, `queue_name`, `start_time` (RFC 3339), `end_time`, `limit`, `offset`, `sort_desc`
- `GET /api/workflows/{id}` — single workflow with input/output loaded
- `GET /api/workflows/{id}/steps` — step list
- `POST /api/workflows/{id}/cancel|resume|fork` — workflow control
- `GET /api/queues` — queue summary (depth, counts) derived from `list_queued_workflows`
- `GET /api/queues/{name}` — workflows in a specific queue
- Catch-all serves the React SPA from `/app/static/index.html`

**`dashboard/frontend/`** — Vite + React 18 + TypeScript + Tailwind CSS 3 + TanStack Query v5 + React Router v6 + `@xyflow/react` (React Flow v12).

Key frontend files:
- `src/types/dbos.ts` — shared TypeScript types (`WorkflowRun`, `WorkflowStep`, `QueueSummary`, etc.)
- `src/api/client.ts` — typed fetch wrapper; `WorkflowFilters.start_time_ms_ago` is a relative offset converted to an ISO timestamp at request time (keeps TanStack Query keys stable across 5-second refetches)
- `src/hooks/` — `useWorkflows`, `useWorkflowDetail`, `useQueues`; all use `refetchInterval: 5000`
- `src/pages/WorkflowsPage.tsx` — timespan picker (30m / 8h default / 24h / 7d / All / Custom), status/name/queue filters, pagination
- `src/pages/WorkflowDetailPage.tsx` — loads workflow + steps, renders `WorkflowDetail`
- `src/components/workflows/WorkflowDetail.tsx` — tabs: Timeline · Steps · Inputs/Outputs · Graph
- `src/components/workflows/WorkflowGraph.tsx` — React Flow graph; nodes are sequential steps, dashed edges link child workflows

### Docker

**`Dockerfile.dashboard`** — multi-stage: `node:20-slim` builds the React SPA, `python:3.13-slim` serves the built `dist/` as static files alongside the FastAPI API.

**`docker-compose.yml`** — `dashboard` service only (demo app can be run locally); uses `extra_hosts: host-gateway` so containers reach the host's PostgreSQL.

