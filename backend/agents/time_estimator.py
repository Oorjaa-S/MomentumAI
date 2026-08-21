from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from utils.groq_client import ask_groq
from utils.ai_helpers import clean_and_parse_json
from services.digital_twin import get_digital_twin_state, format_digital_twin_prompt_context
from prompts.time_estimator_prompt import build_time_estimator_prompt
from schemas import (
    TimeEstimationRequest,
    TimeEstimationResponse,
    TaskTimeEstimateItem,
)
from models import Goal, Task


def estimate_task_time(
    db: Session,
    request: TimeEstimationRequest,
    user_id: Optional[int] = None,
) -> TimeEstimationResponse:
    """
    Estimates time in minutes and difficulty for given tasks using Digital Twin context.
    """
    dt_state = get_digital_twin_state(db, user_id=user_id)
    dt_context = format_digital_twin_prompt_context(dt_state)

    tasks_to_estimate: List[Dict[str, Any]] = []

    if request.task_ids:
        db_tasks = db.query(Task).filter(Task.id.in_(request.task_ids)).all()
        for t in db_tasks:
            goal_title = t.goal.title if t.goal else "General"
            tasks_to_estimate.append({
                "task_id": t.id,
                "task_title": t.title,
                "goal_title": goal_title,
            })

    if request.custom_tasks:
        for ct in request.custom_tasks:
            tasks_to_estimate.append({
                "task_id": None,
                "task_title": ct,
                "goal_title": "Ad-hoc / Custom",
            })

    if not tasks_to_estimate and request.goal_id:
        goal = db.query(Goal).filter(Goal.id == request.goal_id).first()
        if goal:
            for t in goal.tasks:
                if not t.completed:
                    tasks_to_estimate.append({
                        "task_id": t.id,
                        "task_title": t.title,
                        "goal_title": goal.title,
                    })

    if not tasks_to_estimate:
        for t in dt_state.remaining_tasks[:8]:
            tasks_to_estimate.append({
                "task_id": t.id,
                "task_title": t.title,
                "goal_title": t.goal_title,
            })

    if not tasks_to_estimate:
        return TimeEstimationResponse(
            estimates=[],
            total_estimated_minutes=0,
            workload_fit="No tasks to estimate.",
            summary="No tasks provided or found in the queue.",
        )

    prompt = build_time_estimator_prompt(
        digital_twin_context=dt_context,
        tasks_to_estimate=tasks_to_estimate,
        available_hours=dt_state.total_available_hours,
    )

    raw_response = ask_groq(prompt)

    try:
        parsed_data = clean_and_parse_json(raw_response)
        
        items = []
        for item in parsed_data.get("estimates", []):
            est_m = int(item.get("estimated_minutes", 30))
            # Bound check: clamp to realistic 10 - 240 minutes per individual task
            est_m = max(10, min(est_m, 240))

            items.append(
                TaskTimeEstimateItem(
                    task_id=item.get("task_id"),
                    task_title=item.get("task_title", "Untitled Task"),
                    estimated_minutes=est_m,
                    difficulty=item.get("difficulty", "Medium"),
                    confidence=item.get("confidence", "Medium"),
                    reasoning=item.get("reasoning", "Estimated based on task scope and complexity"),
                    suggested_subtasks=item.get("suggested_subtasks"),
                )
            )

        total_min = parsed_data.get(
            "total_estimated_minutes",
            sum(i.estimated_minutes for i in items)
        )

        return TimeEstimationResponse(
            estimates=items,
            total_estimated_minutes=total_min,
            workload_fit=parsed_data.get(
                "workload_fit",
                f"Total workload is {total_min} minutes."
            ),
            summary=parsed_data.get(
                "summary",
                f"Time estimation completed for {len(items)} task(s)."
            ),
        )

    except Exception as e:
        fallback_items = []
        for t in tasks_to_estimate:
            fallback_items.append(
                TaskTimeEstimateItem(
                    task_id=t.get("task_id"),
                    task_title=t.get("task_title", "Task"),
                    estimated_minutes=45,
                    difficulty="Medium",
                    confidence="Medium",
                    reasoning="Default estimation applied.",
                    suggested_subtasks=None,
                )
            )
        total_min = sum(i.estimated_minutes for i in fallback_items)

        return TimeEstimationResponse(
            estimates=fallback_items,
            total_estimated_minutes=total_min,
            workload_fit=f"Estimated {total_min} minutes total.",
            summary=f"Time estimates generated using fallback heuristics. (Note: {str(e)})",
        )
