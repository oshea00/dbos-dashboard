import json
import os
from contextlib import asynccontextmanager
from urllib.parse import urlparse, urlunparse
from typing import Any, Optional

from dbos import DBOS, DBOSConfig
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel


def _resolve_system_database_url() -> Optional[str]:
    url = os.environ.get("DBOS_SYSTEM_DATABASE_URL")
    if not url:
        return url

    # Inside Docker, localhost refers to the container itself. Rewrite to the host gateway.
    if os.environ.get("RUNNING_IN_DOCKER") == "1":
        parsed = urlparse(url)
        if parsed.hostname in {"localhost", "127.0.0.1"}:
            netloc = parsed.netloc
            if "@" in parsed.netloc:
                userinfo, hostport = parsed.netloc.rsplit("@", 1)
                if ":" in hostport:
                    _, port = hostport.split(":", 1)
                    netloc = f"{userinfo}@host.docker.internal:{port}"
                else:
                    netloc = f"{userinfo}@host.docker.internal"
            else:
                if ":" in parsed.netloc:
                    _, port = parsed.netloc.split(":", 1)
                    netloc = f"host.docker.internal:{port}"
                else:
                    netloc = "host.docker.internal"
            url = urlunparse(parsed._replace(netloc=netloc))
    return url


@asynccontextmanager
async def lifespan(app: FastAPI):
    config: DBOSConfig = {
        "name": "dbos-dashboard",
        "system_database_url": _resolve_system_database_url(),
        "run_admin_server": False,
    }
    DBOS(config=config)
    DBOS.launch()
    yield
    DBOS.destroy()


app = FastAPI(lifespan=lifespan, title="DBOS Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Serialization ─────────────────────────────────────────────────────────────


def _safe_json(obj: Any) -> Any:
    """Convert arbitrary Python objects to JSON-serializable form."""
    if obj is None:
        return None
    if isinstance(obj, (str, int, float, bool)):
        return obj
    if isinstance(obj, (list, tuple)):
        return [_safe_json(x) for x in obj]
    if isinstance(obj, dict):
        return {str(k): _safe_json(v) for k, v in obj.items()}
    if isinstance(obj, Exception):
        return str(obj)
    try:
        json.dumps(obj)
        return obj
    except (TypeError, ValueError):
        pass
    if hasattr(obj, "__dict__"):
        return _safe_json(obj.__dict__)
    return repr(obj)


def serialize_workflow(ws) -> dict:
    return {
        "workflow_id": ws.workflow_id,
        "status": ws.status,
        "name": ws.name,
        "class_name": getattr(ws, "class_name", None),
        "queue_name": getattr(ws, "queue_name", None),
        "executor_id": getattr(ws, "executor_id", None),
        "app_version": getattr(ws, "app_version", None),
        "created_at": getattr(ws, "created_at", None),
        "updated_at": getattr(ws, "updated_at", None),
        "input": _safe_json(getattr(ws, "input", None)),
        "output": _safe_json(getattr(ws, "output", None)),
        "error": str(ws.error) if getattr(ws, "error", None) else None,
        "forked_from": getattr(ws, "forked_from", None),
    }


def serialize_step(step) -> dict:
    started = (
        step.get("started_at_epoch_ms")
        if isinstance(step, dict)
        else getattr(step, "started_at_epoch_ms", None)
    )
    completed = (
        step.get("completed_at_epoch_ms")
        if isinstance(step, dict)
        else getattr(step, "completed_at_epoch_ms", None)
    )
    err = step.get("error") if isinstance(step, dict) else getattr(step, "error", None)
    return {
        "function_id": (
            step["function_id"] if isinstance(step, dict) else step.function_id
        ),
        "function_name": (
            step["function_name"] if isinstance(step, dict) else step.function_name
        ),
        "output": _safe_json(
            step.get("output")
            if isinstance(step, dict)
            else getattr(step, "output", None)
        ),
        "error": str(err) if err else None,
        "child_workflow_id": (
            step.get("child_workflow_id")
            if isinstance(step, dict)
            else getattr(step, "child_workflow_id", None)
        ),
        "started_at_epoch_ms": started,
        "completed_at_epoch_ms": completed,
        "duration_ms": (completed - started) if (started and completed) else None,
    }


# ── Workflow endpoints ────────────────────────────────────────────────────────


@app.get("/api/workflows")
def list_workflows(
    status: Optional[str] = Query(
        None, description="Filter by status (e.g. PENDING, ERROR, SUCCESS)"
    ),
    name: Optional[str] = Query(
        None, description="Filter by fully-qualified workflow function name"
    ),
    queue_name: Optional[str] = Query(None, description="Filter by queue name"),
    start_time: Optional[str] = Query(None, description="RFC 3339 start timestamp"),
    end_time: Optional[str] = Query(None, description="RFC 3339 end timestamp"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    sort_desc: bool = Query(True),
):
    kwargs: dict[str, Any] = dict(
        limit=limit,
        offset=offset,
        sort_desc=sort_desc,
        load_input=False,
        load_output=False,
    )
    if status:
        kwargs["status"] = status
    if name:
        kwargs["name"] = name
    if queue_name:
        kwargs["queue_name"] = queue_name
    if start_time:
        kwargs["start_time"] = start_time
    if end_time:
        kwargs["end_time"] = end_time

    workflows = DBOS.list_workflows(**kwargs)
    return [serialize_workflow(wf) for wf in workflows]


@app.get("/api/workflows/{workflow_id}")
def get_workflow(workflow_id: str):
    results = DBOS.list_workflows(
        workflow_ids=[workflow_id],
        load_input=True,
        load_output=True,
    )
    if not results:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return serialize_workflow(results[0])


@app.get("/api/workflows/{workflow_id}/steps")
def list_steps(workflow_id: str):
    steps = DBOS.list_workflow_steps(workflow_id)
    return [serialize_step(s) for s in steps]


class ForkRequest(BaseModel):
    start_step: int


@app.post("/api/workflows/{workflow_id}/cancel")
def cancel_workflow(workflow_id: str):
    DBOS.cancel_workflow(workflow_id)
    return {"ok": True, "workflow_id": workflow_id}


@app.post("/api/workflows/{workflow_id}/resume")
def resume_workflow(workflow_id: str):
    DBOS.resume_workflow(workflow_id)
    return {"ok": True, "workflow_id": workflow_id}


@app.post("/api/workflows/{workflow_id}/fork")
def fork_workflow(workflow_id: str, body: ForkRequest):
    handle = DBOS.fork_workflow(workflow_id, body.start_step)
    return {"ok": True, "new_workflow_id": handle.get_workflow_id()}


# ── Queue endpoints ───────────────────────────────────────────────────────────


@app.get("/api/queues")
def list_queues():
    workflows = DBOS.list_queued_workflows(
        limit=500,
        load_input=False,
        load_output=False,
    )
    queues: dict[str, dict] = {}
    for wf in workflows:
        qn = getattr(wf, "queue_name", None) or "__default__"
        if qn not in queues:
            queues[qn] = {
                "queue_name": qn,
                "depth": 0,
                "oldest_created_at": None,
                "pending_count": 0,
                "enqueued_count": 0,
            }
        q = queues[qn]
        q["depth"] += 1
        created = getattr(wf, "created_at", None)
        if created and (
            q["oldest_created_at"] is None or created < q["oldest_created_at"]
        ):
            q["oldest_created_at"] = created
        if wf.status == "PENDING":
            q["pending_count"] += 1
        elif wf.status == "ENQUEUED":
            q["enqueued_count"] += 1
    return list(queues.values())


@app.get("/api/queues/{queue_name}")
def get_queue(
    queue_name: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    workflows = DBOS.list_queued_workflows(
        queue_name=queue_name,
        limit=limit,
        offset=offset,
        load_input=False,
        load_output=False,
    )
    return {
        "queue_name": queue_name,
        "workflows": [serialize_workflow(wf) for wf in workflows],
    }


# ── Static file serving (SPA) ─────────────────────────────────────────────────


_STATIC_DIR = "/app/static"

if os.path.isdir(_STATIC_DIR):
    _assets_dir = os.path.join(_STATIC_DIR, "assets")
    if os.path.isdir(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        return FileResponse(os.path.join(_STATIC_DIR, "index.html"))


# ── Entry point ───────────────────────────────────────────────────────────────


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("DASHBOARD_PORT", "4000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
