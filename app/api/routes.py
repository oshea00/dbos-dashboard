import os

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

from app.workflows.demo_workflow import get_last_completed_step, launch_durable_workflow

router = APIRouter()


@router.get("/workflow/{task_id}")
def launch_workflow_route(task_id: str) -> None:
    launch_durable_workflow(task_id)


@router.get("/last_step/{task_id}")
def get_last_step_route(task_id: str) -> int:
    return get_last_completed_step(task_id)


@router.post("/crash")
def crash_application_route() -> None:
    os._exit(1)


@router.get("/")
def readme_route() -> HTMLResponse:
    with open(os.path.join("html", "app.html")) as file:
        html = file.read()
    return HTMLResponse(html)
