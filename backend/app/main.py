from fastapi import FastAPI

from app.api.v1.router import api_v1_router
from app.core.config import settings

app = FastAPI(title=settings.project_name)
app.include_router(api_v1_router)


@app.get("/healthz")
def healthcheck():
    return {"status": "ok"}
