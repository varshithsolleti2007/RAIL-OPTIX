from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------
# Risk prediction
# ---------------------------------------------------------------------

class RiskFeatures(BaseModel):
    task_id: str
    condition_score: float = Field(ge=0, le=100)
    asset_age_years: float = Field(ge=0)
    failure_count_12m: int = Field(ge=0)
    overdue_days: int = Field(ge=0)
    safety_criticality: str
    operational_criticality: str
    maintenance_type: str
    department: str


class RiskPredictRequest(BaseModel):
    tasks: List[RiskFeatures]


class RiskPrediction(BaseModel):
    task_id: str
    risk_level: str
    risk_probability: float
    model_version: str


class RiskPredictResponse(BaseModel):
    predictions: List[RiskPrediction]


# ---------------------------------------------------------------------
# Priority scoring
# ---------------------------------------------------------------------

class PriorityInput(BaseModel):
    task_id: str
    risk_probability: float = Field(ge=0, le=1)
    overdue_days: int = Field(ge=0)
    condition_score: float = Field(ge=0, le=100)
    safety_criticality: str
    operational_criticality: str


class PriorityScoreRequest(BaseModel):
    tasks: List[PriorityInput]


class PriorityScore(BaseModel):
    task_id: str
    priority_score: float
    priority_level: str


class PriorityScoreResponse(BaseModel):
    scores: List[PriorityScore]


# ---------------------------------------------------------------------
# Schedule recommendation (single request, ranked candidate windows) -
# this is the contract the Node backend calls per CLAUDE_CODE_PROJECT_CONTEXT.md §25.
# ---------------------------------------------------------------------

class CandidateWindow(BaseModel):
    startTime: datetime
    endTime: datetime


class ScheduleRecommendRequest(BaseModel):
    requestId: str
    sectionId: str
    priority: str
    durationMinutes: int
    candidateWindows: List[CandidateWindow]
    existingBookings: List[CandidateWindow] = Field(default_factory=list)


class Recommendation(BaseModel):
    startTime: datetime
    endTime: datetime
    conflictScore: float
    disruptionScore: float
    confidence: float
    reason: str


class ScheduleRecommendResponse(BaseModel):
    recommendations: List[Recommendation]
    modelVersion: str


# ---------------------------------------------------------------------
# Batch optimization (MILP) - many tasks against many block windows.
# ---------------------------------------------------------------------

class OptimizeTask(BaseModel):
    task_id: str
    corridor_id: str
    section_id: str
    required_block_type: str
    priority_score: float
    priority_level: str
    duration_minutes: int
    required_resources: List[str] = Field(default_factory=list)


class OptimizeBlock(BaseModel):
    block_id: str
    corridor_id: str
    section_id: str
    block_type: str
    duration_minutes: int
    approved: bool = True


class ScheduleOptimizeRequest(BaseModel):
    tasks: List[OptimizeTask]
    blocks: List[OptimizeBlock]


class OptimizeAssignment(BaseModel):
    task_id: str
    block_id: str


class ScheduleOptimizeResponse(BaseModel):
    assignments: List[OptimizeAssignment]
    unscheduled_task_ids: List[str]
    model_version: str


# ---------------------------------------------------------------------
# Simulation
# ---------------------------------------------------------------------

class SimulationTask(BaseModel):
    task_id: str
    block_id: str
    planned_start: datetime
    planned_end: datetime
    duration_minutes: int
    block_duration_minutes: int


class SimulateRequest(BaseModel):
    tasks: List[SimulationTask]
    failed_block_id: Optional[str] = None


class SimulationResult(BaseModel):
    task_id: str
    block_id: str
    status: str
    delay_minutes: float
    replanning_required: bool
    reason: str


class SimulateResponse(BaseModel):
    results: List[SimulationResult]


# ---------------------------------------------------------------------
# Recovery
# ---------------------------------------------------------------------

class RecoveryTask(BaseModel):
    task_id: str
    corridor_id: str
    section_id: str
    required_block_type: str
    priority_score: float
    duration_minutes: int


class RecoveryRecommendRequest(BaseModel):
    tasks: List[RecoveryTask]
    available_blocks: List[OptimizeBlock]
    failed_block_ids: List[str] = Field(default_factory=list)


class RecoveryAssignment(BaseModel):
    task_id: str
    recovery_block_id: Optional[str]
    status: str
    reason: str


class RecoveryRecommendResponse(BaseModel):
    assignments: List[RecoveryAssignment]
    model_version: str
