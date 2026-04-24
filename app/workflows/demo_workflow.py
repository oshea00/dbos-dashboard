import time

from dbos import DBOS, SetWorkflowID

STEPS_EVENT = "steps_event"


@DBOS.step()
def step_one() -> None:
    time.sleep(5)
    DBOS.logger.info("Completed step 1!")


@DBOS.step()
def step_two() -> None:
    time.sleep(5)
    DBOS.logger.info("Completed step 2!")


@DBOS.step()
def step_three() -> None:
    time.sleep(5)
    DBOS.logger.info("Completed step 3!")


@DBOS.workflow()
def workflow() -> None:
    step_one()
    DBOS.set_event(STEPS_EVENT, 1)
    step_two()
    DBOS.set_event(STEPS_EVENT, 2)
    step_three()
    DBOS.set_event(STEPS_EVENT, 3)


def launch_durable_workflow(task_id: str) -> None:
    with SetWorkflowID(task_id):
        DBOS.start_workflow(workflow)


def get_last_completed_step(task_id: str) -> int:
    try:
        step = DBOS.get_event(task_id, STEPS_EVENT, timeout_seconds=0)
    except KeyError:
        return 0
    return step if step is not None else 0
