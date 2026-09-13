from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings

app = FastAPI(
    title=settings.app_name,
    description=(
        "Intelligence Layer for the Railway Block Planning & Coordination "
        "System - risk prediction, priority scoring, MILP optimization, "
        "simulation and recovery. Advisory only: the Control Officer is "
        "the final scheduling authority."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {"message": f"{settings.app_name} is running"}
