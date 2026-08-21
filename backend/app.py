from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, Goal

from agents.goal_analyser import analyze_goal
from agents.task_decomposer import decompose_goal
from agents.planner import generate_plan
from agents.daily_planner import generate_daily_plan
from agents.task_prioritizer import prioritize_tasks
from agents.time_estimator import estimate_task_time
from agents.task_breakdown import breakdown_task
from agents.next_task import get_next_best_task
from agents.recommender import get_unified_recommendation
from services.digital_twin import get_digital_twin_state

from typing import List

from crud import (
    create_goal,
    get_goals,
    update_goal,
    delete_goal,
    create_task,
    update_task,
    delete_task,
    get_tasks,
    get_all_tasks,
)

from schemas import (
    GoalCreate,
    GoalResponse,
    AIGoalRequest,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    DigitalTwinStateResponse,
    DailyPlanRequest,
    DailyPlanResponse,
    PrioritizationRequest,
    PrioritizationResponse,
    TimeEstimationRequest,
    TimeEstimationResponse,
    TaskBreakdownResponse,
    NextTaskRequest,
    NextTaskResponse,
    RecommendResponse,
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MomentumAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.post("/goals/ai")
def create_ai_goal(
    data: AIGoalRequest,
    db: Session = Depends(get_db),
):

    analysis = analyze_goal(
        data.goal,
        data.days,
        data.hours,
        data.skill_level,
        data.current_knowledge,
    )

    breakdown = decompose_goal(
        data.goal,
        analysis,
        data.current_knowledge,
    )

    plan = generate_plan(
        data.goal,
        data.days,
        data.hours,
        data.skill_level,
        data.current_knowledge,
        analysis,
        breakdown,
    )

    goal = create_goal(
        db,
        GoalCreate(
            title=data.goal,
            deadline=f"{data.days} days",
            priority="High",
            available_hours=data.hours,
            notes=data.current_knowledge,
        ),
    )

    # VERY SIMPLE task extraction for MVP
    # Assumes plan is either a list or a string with one task per line.

    if isinstance(plan, list):
        for item in plan:
            create_task(db, goal.id, str(item))

    elif isinstance(plan, str):
        for line in plan.split("\n"):
            line = line.strip("-• ").strip()
            if line:
                create_task(db, goal.id, line)

    return {
        "goal": goal,
        "analysis": analysis,
        "breakdown": breakdown,
        "plan": plan,
        "tasks": get_tasks(db, goal.id),
    }

class RoadmapRequest(BaseModel):
    goal: str
    skill_level: str
    days: int
    hours: int
    current_knowledge: str


@app.get("/")
def home():
    return {"message": "MomentumAI Backend Running"}


@app.post("/generate-roadmap")
def generate_roadmap(data: RoadmapRequest):

    analysis = analyze_goal(
        data.goal,
        data.days,
        data.hours,
        data.skill_level,
        data.current_knowledge,
    )

    breakdown = decompose_goal(
        data.goal,
        analysis,
        data.current_knowledge,
    )

    plan = generate_plan(
        data.goal,
        data.days,
        data.hours,
        data.skill_level,
        data.current_knowledge,
        analysis,
        breakdown,
    )

    return {
        "goal": data.goal,
        "analysis": analysis,
        "breakdown": breakdown,
        "plan": plan,
    }


@app.post("/goals")
def add_goal(goal: GoalCreate, db: Session = Depends(get_db)):
    return create_goal(db, goal)


@app.get("/goals")
def fetch_goals(db: Session = Depends(get_db)):
    return get_goals(db)

@app.put("/goals/{goal_id}")
def edit_goal(
    goal_id: int,
    goal: GoalCreate,
    db: Session = Depends(get_db),
):
    updated = update_goal(db, goal_id, goal)

    if updated is None:
        return {"error": "Goal not found"}

    return updated


@app.delete("/goals/{goal_id}")
def remove_goal(
    goal_id: int,
    db: Session = Depends(get_db),
):
    success = delete_goal(db, goal_id)

    if not success:
        return {"error": "Goal not found"}

    return {"message": "Goal deleted"}
@app.get("/tasks", response_model=List[TaskResponse])
def fetch_all_tasks(db: Session = Depends(get_db)):
    return get_all_tasks(db)


@app.post("/goals/{goal_id}/tasks", response_model=TaskResponse)
def add_task(
    goal_id: int,
    task: TaskCreate,
    db: Session = Depends(get_db),
):
    return create_task(db, goal_id, task.title)


@app.get("/goals/{goal_id}/tasks", response_model=List[TaskResponse])
def fetch_tasks(
    goal_id: int,
    db: Session = Depends(get_db),
):
    return get_tasks(db, goal_id)


@app.put("/tasks/{task_id}")
def edit_task(
    task_id: int,
    task: TaskUpdate,
    db: Session = Depends(get_db),
):
    updated = update_task(db, task_id, task)

    if updated is None:
        return {"error": "Task not found"}

    return updated


@app.delete("/tasks/{task_id}")
def remove_task(
    task_id: int,
    db: Session = Depends(get_db),
):
    success = delete_task(db, task_id)

    if not success:
        return {"error": "Task not found"}

    return {"message": "Deleted"}

@app.post("/goals/{goal_id}/generate-tasks")
def generate_tasks(
    goal_id: int,
    db: Session = Depends(get_db),
):

    goal = db.query(Goal).filter(Goal.id == goal_id).first()

    if goal is None:
        return {"error": "Goal not found"}

    existing = get_tasks(db, goal.id)
    if existing:
        return existing

    analysis = analyze_goal(
        goal.title,
        30,                       # temporary default
        goal.available_hours,
        "Beginner",               # temporary default
        goal.notes or "",
    )

    breakdown = decompose_goal(
        goal.title,
        analysis,
        goal.notes or "",
    )

    for line in breakdown.split("\n"):
        line = line.strip()

        if line.startswith("-"):
            create_task(
                db,
                goal.id,
                line[1:].strip(),
            )

    return get_tasks(db, goal.id)


# ==========================================
# Digital Twin & AI Sprint Endpoints
# ==========================================

@app.get("/digital-twin", response_model=DigitalTwinStateResponse)
def get_digital_twin(db: Session = Depends(get_db)):
    """
    Returns the real-time Digital Twin state representing current productivity,
    workload pressure, deadline pressure, and goal/task metrics.
    """
    return get_digital_twin_state(db)


@app.post("/ai/daily-plan", response_model=DailyPlanResponse)
def plan_day(
    request: DailyPlanRequest = DailyPlanRequest(),
    db: Session = Depends(get_db)
):
    """
    Generates a structured, capacity-aware execution plan for TODAY based on the Digital Twin.
    """
    return generate_daily_plan(db, request)


@app.post("/ai/prioritize-tasks", response_model=PrioritizationResponse)
def prioritize_pending_tasks(
    request: PrioritizationRequest = PrioritizationRequest(),
    db: Session = Depends(get_db)
):
    """
    Evaluates pending tasks against the Digital Twin to produce ranked priority tiers and reasoning.
    """
    return prioritize_tasks(db, request)


@app.post("/ai/estimate-time", response_model=TimeEstimationResponse)
def estimate_tasks_time(
    request: TimeEstimationRequest = TimeEstimationRequest(),
    db: Session = Depends(get_db)
):
    """
    Provides realistic duration estimates (in minutes), confidence, and subtask breakdowns.
    """
    return estimate_task_time(db, request)


@app.post("/ai/breakdown-task/{task_id}", response_model=TaskBreakdownResponse)
def decompose_single_task(
    task_id: int,
    db: Session = Depends(get_db)
):
    """
    Decomposes a specific existing task into concrete, actionable implementation subtasks.
    """
    return breakdown_task(db, task_id)


@app.post("/ai/next-task", response_model=NextTaskResponse)
def recommend_next_task(
    request: NextTaskRequest = NextTaskRequest(),
    db: Session = Depends(get_db)
):
    """
    Determines what single task the user should execute RIGHT NOW based on real-time Digital Twin state.
    """
    return get_next_best_task(db, request)


@app.post("/ai/recommend", response_model=RecommendResponse)
def get_recommendation(
    request: NextTaskRequest = NextTaskRequest(),
    db: Session = Depends(get_db)
):
    """
    End-to-end AI pipeline: Digital Twin -> Prioritize -> Next Best Task -> Task Breakdown.
    """
    return get_unified_recommendation(
        db=db,
        goal_id=request.goal_id,
        available_minutes=request.available_minutes,
    )

