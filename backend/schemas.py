from typing import List, Optional
from pydantic import BaseModel


class GoalCreate(BaseModel):
    title: str
    deadline: str
    priority: str
    available_hours: int
    notes: str


class GoalResponse(BaseModel):
    id: int
    title: str
    deadline: str
    priority: str

    class Config:
        from_attributes = True


class TaskResponse(BaseModel):
    id: int
    title: str
    completed: bool
    goal_id: Optional[int] = None

    class Config:
        from_attributes = True


class AIGoalRequest(BaseModel):

    goal: str
    skill_level: str
    days: int
    hours: int
    current_knowledge: str

class TaskCreate(BaseModel):
    title: str


class TaskUpdate(BaseModel):
    title: str
    completed: bool


# ==========================================
# Digital Twin Schemas
# ==========================================

class DigitalTwinGoal(BaseModel):
    id: int
    title: str
    deadline: str
    priority: str
    available_hours: int
    notes: str
    total_tasks: int
    completed_tasks: int
    remaining_tasks: int


class DigitalTwinTask(BaseModel):
    id: int
    title: str
    completed: bool
    goal_id: int
    goal_title: Optional[str] = None
    goal_priority: Optional[str] = None
    goal_deadline: Optional[str] = None


class DigitalTwinStateResponse(BaseModel):
    goals: List[DigitalTwinGoal]
    total_goals: int
    total_tasks: int
    completed_tasks: int
    remaining_tasks: List[DigitalTwinTask]
    completion_rate: float
    total_available_hours: int
    workload_pressure: str
    deadline_pressure: str
    summary: str


# ==========================================
# AI Daily Planner Schemas
# ==========================================

class DailyPlanRequest(BaseModel):
    target_date: Optional[str] = "Today"
    available_hours_override: Optional[float] = None
    focus_goal_id: Optional[int] = None


class DailyPlanItem(BaseModel):
    task_id: Optional[int] = None
    task_title: str
    goal_title: Optional[str] = None
    estimated_minutes: int
    rank: int
    priority: str
    difficulty: Optional[str] = "Medium"
    reason: str


class DailyPlanResponse(BaseModel):
    planned_tasks: List[DailyPlanItem]
    total_planned_minutes: int
    remaining_capacity_minutes: int
    summary: str


# ==========================================
# Smart Task Prioritization Schemas
# ==========================================

class PrioritizationRequest(BaseModel):
    goal_id: Optional[int] = None


class PrioritizedTaskItem(BaseModel):
    task_id: int
    task_title: str
    goal_title: str
    rank: int
    priority_tier: str
    urgency: str
    impact: str
    difficulty: Optional[str] = "Medium"
    reasoning: str


class PrioritizationResponse(BaseModel):
    prioritized_tasks: List[PrioritizedTaskItem]
    focus_recommendation: str
    summary: str


# ==========================================
# AI Time Estimation Schemas
# ==========================================

class TimeEstimationRequest(BaseModel):
    task_ids: Optional[List[int]] = None
    custom_tasks: Optional[List[str]] = None
    goal_id: Optional[int] = None


class TaskTimeEstimateItem(BaseModel):
    task_id: Optional[int] = None
    task_title: str
    estimated_minutes: int
    difficulty: Optional[str] = "Medium"
    confidence: str
    reasoning: str
    suggested_subtasks: Optional[List[str]] = None


class TimeEstimationResponse(BaseModel):
    estimates: List[TaskTimeEstimateItem]
    total_estimated_minutes: int
    workload_fit: str
    summary: str


# ==========================================
# AI Task Breakdown Schemas
# ==========================================

class SubtaskItem(BaseModel):
    title: str
    estimated_minutes: Optional[int] = None
    step_order: int
    difficulty: Optional[str] = "Medium"
    description: Optional[str] = None


class TaskBreakdownResponse(BaseModel):
    task_id: int
    task_title: str
    goal_id: int
    goal_title: str
    goal_priority: Optional[str] = None
    goal_deadline: Optional[str] = None
    subtasks: List[SubtaskItem]
    total_estimated_minutes: Optional[int] = None
    summary: str


# ==========================================
# AI Next Best Task Schemas (Phase 2)
# ==========================================

class NextTaskRequest(BaseModel):
    goal_id: Optional[int] = None
    available_minutes: Optional[int] = None


class NextTaskResponse(BaseModel):
    task_id: Optional[int] = None
    task_title: str
    goal_id: Optional[int] = None
    goal_title: Optional[str] = None
    priority: Optional[str] = "Medium"
    difficulty: Optional[str] = "Medium"
    estimated_minutes: int
    reason: str
    suggested_action: str


# ==========================================
# AI Unified Recommendation Schemas (Phase 2)
# ==========================================

class RecommendedTaskDetails(BaseModel):
    task_id: int
    task_title: str
    goal_id: int
    goal_title: str
    priority: str
    difficulty: str
    estimated_minutes: int


class RecommendResponse(BaseModel):
    recommended_task: Optional[RecommendedTaskDetails] = None
    reason: str
    estimated_minutes: int
    subtasks: List[SubtaskItem] = []
    summary: str

