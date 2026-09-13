import json

from fastapi import APIRouter, HTTPException

from app.ml_models.risk_model import METADATA_FILE, MODEL_VERSION as RISK_MODEL_VERSION, predict_risk
from app.optimization.batch_optimizer import optimize
from app.optimization.recovery import recommend_recovery
from app.optimization.schedule_recommender import recommend_schedule
from app.schemas.ml import (
    PriorityScoreRequest,
    PriorityScoreResponse,
    RecoveryRecommendRequest,
    RecoveryRecommendResponse,
    RiskPredictRequest,
    RiskPredictResponse,
    ScheduleOptimizeRequest,
    ScheduleOptimizeResponse,
    ScheduleRecommendRequest,
    ScheduleRecommendResponse,
    SimulateRequest,
    SimulateResponse,
)
from app.services.priority_service import score_priority
from app.simulation.simulator import simulate

router = APIRouter(prefix="/api", tags=["Intelligence Service"])


@router.get("/health")
def health_check():
    return {"status": "healthy"}


@router.post("/risk/predict", response_model=RiskPredictResponse)
def risk_predict(payload: RiskPredictRequest):
    tasks = [t.model_dump() for t in payload.tasks]

    try:
        predictions = predict_risk(tasks)
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Risk prediction failed: {error}")

    return {"predictions": predictions}


@router.post("/priority/score", response_model=PriorityScoreResponse)
def priority_score(payload: PriorityScoreRequest):
    tasks = [t.model_dump() for t in payload.tasks]
    return {"scores": score_priority(tasks)}


@router.post("/schedule/recommend", response_model=ScheduleRecommendResponse)
def schedule_recommend(payload: ScheduleRecommendRequest):
    candidate_windows = [w.model_dump() for w in payload.candidateWindows]
    existing_bookings = [b.model_dump() for b in payload.existingBookings]

    recommendations = recommend_schedule(candidate_windows, existing_bookings, payload.priority)

    return {"recommendations": recommendations, "modelVersion": "v1"}


@router.post("/schedule/optimize", response_model=ScheduleOptimizeResponse)
def schedule_optimize(payload: ScheduleOptimizeRequest):
    tasks = [t.model_dump() for t in payload.tasks]
    blocks = [b.model_dump() for b in payload.blocks]

    try:
        result = optimize(tasks, blocks)
    except RuntimeError as error:
        raise HTTPException(status_code=500, detail=str(error))

    return result


@router.post("/simulate", response_model=SimulateResponse)
def simulate_plan(payload: SimulateRequest):
    tasks = [t.model_dump() for t in payload.tasks]
    results = simulate(tasks, payload.failed_block_id)
    return {"results": results}


@router.post("/recovery/recommend", response_model=RecoveryRecommendResponse)
def recovery_recommend(payload: RecoveryRecommendRequest):
    tasks = [t.model_dump() for t in payload.tasks]
    blocks = [b.model_dump() for b in payload.available_blocks]
    return recommend_recovery(tasks, blocks, payload.failed_block_ids)


@router.get("/metrics")
def metrics():
    risk_model_metadata = None

    if METADATA_FILE.exists():
        risk_model_metadata = json.loads(METADATA_FILE.read_text())

    return {
        "risk_model_version": RISK_MODEL_VERSION,
        "risk_model_metadata": risk_model_metadata,
    }
