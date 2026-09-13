from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class Asset(BaseModel):
    asset_id: str
    asset_type: str
    department: str
    corridor_id: str
    section_id: str
    location: str

    installation_date: Optional[date] = None

    criticality_score: int = Field(
        ge=1,
        le=10,
        description="Asset criticality from 1 to 10"
    )

    status: str = "Operational"


class MaintenanceHistory(BaseModel):
    history_id: str
    task_id: str
    asset_id: str
    maintenance_date: date
    maintenance_type: str
    condition_before: Optional[float] = None
    condition_after: Optional[float] = None
    remarks: Optional[str] = None


class MaintenanceTask(BaseModel):
    task_id: str
    asset_id: str
    department: str
    corridor_id: str
    section_id: str

    maintenance_type: str
    defect_description: Optional[str] = None

    last_maintenance_date: date
    maintenance_interval_days: int = Field(gt=0)
    next_due_date: date

    overdue_days: int = Field(default=0, ge=0)

    condition_score: float = Field(
        default=5.0,
        ge=0,
        le=10
    )

    asset_age_years: float = Field(default=0.0, ge=0)
    failure_count_12m: int = Field(default=0, ge=0)

    safety_criticality: int = Field(
        default=5,
        ge=1,
        le=10
    )

    operational_criticality: int = Field(
        default=5,
        ge=1,
        le=10
    )

    estimated_duration_minutes: int = Field(gt=0)
    duration_buffer_minutes: int = Field(default=15, ge=0)

    required_team: str
    required_block_type: str

    required_resources: List[str] = Field(default_factory=list)

    status: str = "Pending"


class TrainMovement(BaseModel):
    train_id: str
    train_type: str

    priority: int = Field(
        ge=1,
        le=10
    )

    corridor_id: str
    section_id: str

    scheduled_entry: datetime
    scheduled_exit: datetime

    movement_type: str
    can_be_diverted: bool = False


class GoodsForecast(BaseModel):
    forecast_id: str
    corridor_id: str
    section_id: str

    forecast_date: date

    expected_entry: datetime
    expected_exit: datetime

    expected_train_count: int = Field(ge=0)
    confidence: float = Field(
        ge=0,
        le=1
    )


class BlockWindow(BaseModel):
    block_id: str
    corridor_id: str
    section_id: str

    date: date
    start_time: datetime
    end_time: datetime

    available_duration_minutes: int = Field(gt=0)

    block_type: str
    status: str = "Available"


class Resource(BaseModel):
    resource_id: str
    resource_type: str
    department: str

    available_from: datetime
    available_until: datetime

    capacity: int = Field(default=1, ge=1)


class RiskPrediction(BaseModel):
    task_id: str

    failure_probability: float = Field(
        ge=0,
        le=1
    )

    risk_score: float = Field(
        ge=0,
        le=100
    )

    priority_category: str
    explanation: List[str] = Field(default_factory=list)


class ScheduledTask(BaseModel):
    task_id: str
    block_id: str

    scheduled_start: datetime
    scheduled_end: datetime

    duration_minutes: int = Field(gt=0)

    priority_category: str
    status: str = "Scheduled"

    reason: Optional[str] = None


class PlanMetrics(BaseModel):
    total_tasks: int = Field(ge=0)
    completed_tasks: int = Field(ge=0)
    deferred_tasks: int = Field(ge=0)

    critical_tasks_completed: int = Field(ge=0)
    high_priority_tasks_completed: int = Field(ge=0)

    block_utilization_percentage: float = Field(
        ge=0,
        le=100
    )

    modeled_train_impact: int = Field(ge=0)
    coordinated_task_groups: int = Field(ge=0)


class OptimizedPlan(BaseModel):
    plan_id: str
    corridor_id: str

    planning_start: datetime
    planning_end: datetime

    scheduled_tasks: List[ScheduledTask] = Field(
        default_factory=list
    )

    deferred_tasks: List[str] = Field(
        default_factory=list
    )

    metrics: Optional[PlanMetrics] = None