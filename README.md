# DBOS With Dashboard Project

This project demonstrates the durability of DBOS workflows and includes an operational dashboard for observing and managing them.

## Components

### Demo App (`app/main.py`)

A FastAPI + DBOS backend that runs a three-step durable workflow. It serves a vanilla JS frontend at [`http://localhost:8000`](http://localhost:8000) that lets you launch workflows and simulate crashes to demonstrate automatic recovery.

### Dashboard (`dashboard/`)

An operational UI for inspecting and managing DBOS workflows, served at [`http://localhost:4000`](http://localhost:4000). It connects directly to the DBOS system database (read/write management API only — it does not execute workflows).

**Features:**
- **Workflow Runs** — filterable table with timespan picker (default: last 8 hours), status, name, and queue filters; pagination
- **Workflow Detail** — header with status/duration, plus tabbed views:
  - *Timeline* — Gantt-style bar chart of step durations
  - *Steps* — expandable table with per-step output/error
  - *Inputs / Outputs* — JSON viewer for workflow I/O
  - *Graph* — React Flow node graph of the step sequence
- **Actions** — Cancel, Resume, and Fork workflows directly from the detail page
- **Queues** — live queue depth and per-queue workflow list

**Stack:** FastAPI + DBOS SDK (backend) · React 18 + Vite + TypeScript + Tailwind CSS + TanStack Query + React Flow (frontend)

## Setup

### Running with Docker Compose (recommended)

Requires a running PostgreSQL instance. Set `DBOS_SYSTEM_DATABASE_URL` before starting — either export it in your shell or create a `.env` file in the project root (Docker Compose picks it up automatically):

```shell
# .env
DBOS_SYSTEM_DATABASE_URL=postgresql+psycopg://user:pass@host.docker.internal:5432/dbname
```

> **Note:** Use `host.docker.internal` (not `localhost`) to reach a database running on your host machine. On Linux, Docker Compose maps this to the host gateway automatically via `extra_hosts`.

#### Current Docker assumptions

- PostgreSQL is already running outside Docker (for example, directly on your host machine).
- That PostgreSQL instance accepts TCP connections from the Docker bridge/host-gateway path.
- The dashboard service receives `RUNNING_IN_DOCKER=1`, and its backend rewrites `localhost` / `127.0.0.1` in `DBOS_SYSTEM_DATABASE_URL` to `host.docker.internal` at runtime.
- The database user in `DBOS_SYSTEM_DATABASE_URL` can create and update objects in the `dbos` schema used by DBOS metadata tables.

If your host database only listens on `127.0.0.1`, or blocks bridge-origin traffic, Docker containers will fail to connect even though local (non-Docker) commands still work.

Then start the stack:

```shell
docker compose up --build
```

- Demo app: [`http://localhost:8000`](http://localhost:8000)
- Dashboard: [`http://localhost:4000`](http://localhost:4000)

### Running locally

**1. Install Python dependencies**

With [uv](https://docs.astral.sh/uv/) (recommended):
```shell
uv sync
```

Or with pip:
```shell
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

**2. Set the database URL**

```shell
export DBOS_SYSTEM_DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/dbname
```

**3. Start the demo app**

```shell
python3 -m app.main       # http://localhost:8000
```

**4. Start the dashboard backend** (separate terminal, same `DBOS_SYSTEM_DATABASE_URL`)

With uv:
```shell
uv run --project dashboard/backend python dashboard/backend/main.py
```

Or with pip:
```shell
cd dashboard/backend
pip install -r requirements.txt
python main.py            # http://localhost:4000
```

**5. Start the dashboard frontend** (separate terminal)

```shell
cd dashboard/frontend
npm install
npm run dev               # http://localhost:5173, proxies /api → localhost:4000
```

## Request Flow Sequence

~~~mermaid
sequenceDiagram
    autonumber
    participant UI as Browser UI (html/app.html)
    participant API as FastAPI app (app/main.py)
    participant DBOS as DBOS library/runtime
    participant SYSDB as DBOS system DB

    Note over UI: User clicks "Launch a durable workflow"
    UI->>API: GET /workflow/{task_id}
    API->>DBOS: SetWorkflowID(task_id)
    API->>DBOS: start_workflow(workflow)
    API-->>UI: 200 OK (workflow launched)

    Note over DBOS: workflow executes step_one, step_two, step_three
    DBOS->>DBOS: run @DBOS.step step_one()
    DBOS->>SYSDB: persist workflow/step state
    DBOS->>SYSDB: set_event(steps_event, 1)

    DBOS->>DBOS: run @DBOS.step step_two()
    DBOS->>SYSDB: persist workflow/step state
    DBOS->>SYSDB: set_event(steps_event, 2)

    DBOS->>DBOS: run @DBOS.step step_three()
    DBOS->>SYSDB: persist workflow/step state
    DBOS->>SYSDB: set_event(steps_event, 3)

    loop every ~1.667s while currentId exists
        UI->>API: GET /last_step/{task_id}
        API->>DBOS: get_event(task_id, steps_event, timeout_seconds=0)
        DBOS->>SYSDB: read latest event
        SYSDB-->>DBOS: step value (or none)
        DBOS-->>API: step
        API-->>UI: step number
        UI->>UI: update status box and highlighted code step
    end

    Note over UI: User clicks "Crash the application"
    UI->>API: POST /crash (with AbortController signal)
    API->>API: os._exit(1) (process exits)

    UI-xAPI: polling temporarily fails
    UI->>UI: show "Reconnecting..."

    Note over DBOS,API: On restart, DBOS.launch() recovers active workflows from persisted state
    DBOS->>SYSDB: load workflow state
    DBOS->>DBOS: resume from last completed step
    UI->>API: GET /last_step/{task_id}
    API-->>UI: resumed progress
    UI->>UI: hide reconnecting, continue updates
  ~~~