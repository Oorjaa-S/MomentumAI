from typing import Optional, List
from fastapi import HTTPException
from sqlalchemy.orm import Session

from utils.groq_client import ask_groq
from utils.ai_helpers import clean_and_parse_json
from services.digital_twin import get_digital_twin_state, format_digital_twin_prompt_context
from prompts.task_breakdown_prompt import build_task_breakdown_prompt
from schemas import (
    TaskBreakdownResponse,
    SubtaskItem,
)
from models import Task, Goal


def breakdown_task(
    db: Session,
    task_id: int,
    user_id: Optional[int] = None,
) -> TaskBreakdownResponse:
    """
    Decomposes an existing Task into concrete, actionable sequential subtasks
    grounded in the parent Goal and Digital Twin context.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    goal = task.goal or db.query(Goal).filter(Goal.id == task.goal_id).first()
    goal_title = goal.title if goal else "General Goal"
    goal_priority = goal.priority if goal else "Medium"
    goal_deadline = goal.deadline if goal else "No deadline"
    goal_notes = goal.notes if goal else ""
    goal_id = goal.id if goal else 0

    dt_state = get_digital_twin_state(db, user_id=user_id)
    dt_context = format_digital_twin_prompt_context(dt_state)

    prompt = build_task_breakdown_prompt(
        task_title=task.title,
        goal_title=goal_title,
        goal_priority=goal_priority,
        goal_deadline=goal_deadline,
        goal_notes=goal_notes,
        digital_twin_context=dt_context,
    )

    raw_response = ask_groq(prompt)

    try:
        parsed_data = clean_and_parse_json(raw_response)
        
        subtasks: List[SubtaskItem] = []
        for idx, item in enumerate(parsed_data.get("subtasks", [])):
            subtasks.append(
                SubtaskItem(
                    title=item.get("title", f"Step {idx + 1}"),
                    estimated_minutes=int(item.get("estimated_minutes", 30)),
                    step_order=int(item.get("step_order", idx + 1)),
                    difficulty=item.get("difficulty", "Medium"),
                    description=item.get("description"),
                )
            )

        total_min = parsed_data.get(
            "total_estimated_minutes",
            sum(s.estimated_minutes for s in subtasks if s.estimated_minutes)
        )

        return TaskBreakdownResponse(
            task_id=task.id,
            task_title=task.title,
            goal_id=goal_id,
            goal_title=goal_title,
            goal_priority=goal_priority,
            goal_deadline=goal_deadline,
            subtasks=subtasks,
            total_estimated_minutes=total_min,
            summary=parsed_data.get(
                "summary",
                f"Successfully decomposed '{task.title}' into {len(subtasks)} actionable subtask(s)."
            ),
        )

    except Exception as e:
        fallback_subtasks = [
            SubtaskItem(
                title=f"Plan and research implementation for: {task.title}",
                estimated_minutes=30,
                step_order=1,
                difficulty="Easy",
                description="Review requirements and technical approach.",
            ),
            SubtaskItem(
                title=f"Execute core logic for: {task.title}",
                estimated_minutes=45,
                step_order=2,
                difficulty="Medium",
                description="Implement primary functionality.",
            ),
            SubtaskItem(
                title=f"Test and verify: {task.title}",
                estimated_minutes=30,
                step_order=3,
                difficulty="Easy",
                description="Validate output and handle edge cases.",
            ),
        ]
        total_min = sum(s.estimated_minutes for s in fallback_subtasks if s.estimated_minutes)

        return TaskBreakdownResponse(
            task_id=task.id,
            task_title=task.title,
            goal_id=goal_id,
            goal_title=goal_title,
            goal_priority=goal_priority,
            goal_deadline=goal_deadline,
            subtasks=fallback_subtasks,
            total_estimated_minutes=total_min,
            summary=f"Decomposed using standard execution phases. (Note: {str(e)})",
        )
