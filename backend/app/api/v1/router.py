from fastapi import APIRouter

from app.api.v1 import availability, briefs, onboarding, tasks


api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(onboarding.router, tags=["onboarding"])
api_v1_router.include_router(tasks.router, tags=["tasks"])
api_v1_router.include_router(briefs.router, tags=["briefs"])
api_v1_router.include_router(availability.router, tags=["availability"])
