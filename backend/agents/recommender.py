from typing import Optional
from sqlalchemy.orm import Session

from schemas import (
    RecommendResponse,
    RecommendedTaskDetails,
    NextTaskRequest,
)
from agents.next_task import get_next_best_task
from agents.task_breakdown import breakdown_task


def get_unified_recommendation(
    db: Session,
    goal_id: Optional[int] = None,
    available_minutes: Optional[int] = None,
    user_id: Optional[int] = None,
) -> RecommendResponse:
    """
    End-to-end unified AI recommendation pipeline.
    Orchestrates: Digital Twin -> Prioritization -> Best Task Selection -> Task Breakdown.
    Does NOT mutate any database records.
    """
    # 1. Select the Next Best Task
    next_task = get_next_best_task(
        db=db,
        request=NextTaskRequest(goal_id=goal_id, available_minutes=available_minutes),
        user_id=user_id,
    )

    if not next_task.task_id:
        return RecommendResponse(
            recommended_task=None,
            reason=next_task.reason,
            estimated_minutes=0,
            subtasks=[],
            summary=next_task.suggested_action,
        )

    # 2. Decompose the selected task into actionable implementation steps
    subtasks = []
    try:
        breakdown_res = breakdown_task(db=db, task_id=next_task.task_id, user_id=user_id)
        subtasks = breakdown_res.subtasks
    except Exception:
        subtasks = []

    recommended_details = RecommendedTaskDetails(
        task_id=next_task.task_id,
        task_title=next_task.task_title,
        goal_id=next_task.goal_id or 0,
        goal_title=next_task.goal_title or "General",
        priority=next_task.priority or "Medium",
        difficulty=next_task.difficulty or "Medium",
        estimated_minutes=next_task.estimated_minutes,
    )

    summary = (
        f"Recommended immediate action: '{next_task.task_title}' "
        f"({next_task.estimated_minutes} min, {next_task.difficulty} difficulty) "
        f"under '{next_task.goal_title}'. {next_task.suggested_action}"
    )

    return RecommendResponse(
        recommended_task=recommended_details,
        reason=next_task.reason,
        estimated_minutes=next_task.estimated_minutes,
        subtasks=subtasks,
        summary=summary,
    )
