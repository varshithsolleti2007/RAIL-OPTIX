from fastapi import FastAPI

from app.api.routes import router as plan_router


app = FastAPI(
    title="Railway Block Planning API",
    description="AI-powered maintenance block planning for Indian Railways",
    version="0.1.0",
)


app.include_router(plan_router)


@app.get("/")
def root():
    return {
        "message": "Railway Block Planning API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }