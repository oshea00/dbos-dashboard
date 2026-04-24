import uvicorn
from dbos import DBOS
from fastapi import FastAPI
from app.api.routes import router
from app.dbos_runtime import configure_dbos

app = FastAPI()
app.include_router(router)
configure_dbos()


if __name__ == "__main__":
    DBOS.launch()
    uvicorn.run(app, host="0.0.0.0", port=8000)
