from typing import Optional, List, Dict
from sqlalchemy.orm import Session

from utils.groq_client import ask_groq
from utils.ai_helpers import clean_and_parse_json
from services.digital_twin import get_digital_twin_state, format_digital_twin_prompt_context
from prompts.daily_planner_prompt import build_daily_planner_prompt
from schemas import (
    DailyPlanRequest,
    DailyPlanResponse,
    DailyPlanItem,
    DigitalTwinTask,
)
from models import Goal


def generate_daily_plan(
    db: Session,
    request: DailyPlanRequest,
    user_id: Optional[int] = None,
) -> DailyPlanResponse:
    """
    Generates a concrete time-blocked daily execution plan for today.
    STRICT CONSTRAINT: Only schedules tasks that already exist in the
    Digital Twin pending task list. Does not invent or modify tasks.
    """
    dt_state = get_digital_twin_state(db, user_id=user_id)
    dt_context = format_digital_twin_prompt_context(dt_state)

    available_hours = (
        request.available_hours_override
        if request.available_hours_override is not None and request.available_hours_override > 0
        else dt_state.total_available_hours
    )
    capacity_minutes = int(available_hours * 60)

    # Filter pending tasks if a specific goal is requested
    pending_tasks: List[DigitalTwinTask] = dt_state.remaining_tasks
    focus_goal_title = None
    if request.focus_goal_id:
        goal = db.query(Goal).filter(Goal.id == request.focus_goal_id).first()
        if goal:
            focus_goal_title = goal.title
            goal_pending = [t for t in pending_tasks if t.goal_id == request.focus_goal_id]
            if goal_pending:
                pending_tasks = goal_pending

    # If no pending tasks exist in Digital Twin, return empty plan
    if not pending_tasks:
        return DailyPlanResponse(
            planned_tasks=[],
            total_planned_minutes=0,
            remaining_capacity_minutes=capacity_minutes,
            summary="No pending tasks found in the Digital Twin to schedule for today. All tasks are completed or none exist.",
        )

    # Build lookup dictionaries for strict validation
    task_by_id: Dict[int, DigitalTwinTask] = {t.id: t for t in pending_tasks}
    task_by_title: Dict[str, DigitalTwinTask] = {t.title.strip().lower(): t for t in pending_tasks}

    prompt = build_daily_planner_prompt(
        digital_twin_context=dt_context,
        pending_tasks=pending_tasks,
        target_date=request.target_date or "Today",
        available_hours=available_hours,
        focus_goal_title=focus_goal_title,
    )

    raw_response = ask_groq(prompt)

    try:
        parsed_data = clean_and_parse_json(raw_response)
        
        valid_items: List[DailyPlanItem] = []
        seen_task_ids = set()
        accumulated_minutes = 0

        for item in parsed_data.get("planned_tasks", []):
            raw_task_id = item.get("task_id")
            raw_title = (item.get("task_title") or "").strip()

            matched_task: Optional[DigitalTwinTask] = None
            if raw_task_id is not None:
                try:
                    tid = int(raw_task_id)
                    matched_task = task_by_id.get(tid)
                except (ValueError, TypeError):
                    matched_task = None
            
            if matched_task is None and raw_title:
                matched_task = task_by_title.get(raw_title.lower())

            # Only accept tasks that actually exist in the pending list
            if matched_task is not None and matched_task.id not in seen_task_ids:
                seen_task_ids.add(matched_task.id)
                est_minutes = int(item.get("estimated_minutes", 30))
                if est_minutes <= 0:
                    est_minutes = 30

                # Check if adding this task exceeds capacity (allow first task always)
                if valid_items and (accumulated_minutes + est_minutes > capacity_minutes):
                    continue

                accumulated_minutes += est_minutes
                valid_items.append(
                    DailyPlanItem(
                        task_id=matched_task.id,
                        task_title=matched_task.title,  # Exact original title preserved
                        goal_title=matched_task.goal_title,
                        estimated_minutes=est_minutes,
                        rank=len(valid_items) + 1,
                        priority=item.get("priority", matched_task.goal_priority or "Medium"),
                        difficulty=item.get("difficulty", "Medium"),
                        reason=item.get("reason", "Scheduled based on pending priority and impact"),
                    )
                )

        # If LLM returned no valid matches, fallback to selecting top pending tasks
        if not valid_items and pending_tasks:
            for idx, pt in enumerate(pending_tasks[:3]):
                est_m = 45
                if idx > 0 and (accumulated_minutes + est_m > capacity_minutes):
                    break
                accumulated_minutes += est_m
                valid_items.append(
                    DailyPlanItem(
                        task_id=pt.id,
                        task_title=pt.title,
                        goal_title=pt.goal_title,
                        estimated_minutes=est_m,
                        rank=idx + 1,
                        priority=pt.goal_priority or "Medium",
                        difficulty="Medium",
                        reason="Prioritized from existing backlog",
                    )
                )

        total_planned = sum(i.estimated_minutes for i in valid_items)
        remaining_cap = max(0, capacity_minutes - total_planned)

        return DailyPlanResponse(
            planned_tasks=valid_items,
            total_planned_minutes=total_planned,
            remaining_capacity_minutes=remaining_cap,
            summary=parsed_data.get(
                "summary",
                f"Scheduled {len(valid_items)} existing task(s) within today's {capacity_minutes}-minute capacity."
            ),
        )

    except Exception as e:
        # Fallback to existing pending tasks
        fallback_tasks = []
        accumulated_minutes = 0
        for idx, pt in enumerate(pending_tasks[:3]):
            est_m = 45
            if idx > 0 and (accumulated_minutes + est_m > capacity_minutes):
                break
            accumulated_minutes += est_m
            fallback_tasks.append(
                DailyPlanItem(
                    task_id=pt.id,
                    task_title=pt.title,
                    goal_title=pt.goal_title,
                    estimated_minutes=est_m,
                    rank=idx + 1,
                    priority=pt.goal_priority or "Medium",
                    difficulty="Medium",
                    reason="Scheduled from active pending backlog",
                )
            )
        total_planned = sum(i.estimated_minutes for i in fallback_tasks)

        return DailyPlanResponse(
            planned_tasks=fallback_tasks,
            total_planned_minutes=total_planned,
            remaining_capacity_minutes=max(0, capacity_minutes - total_planned),
            summary=f"Daily plan created using existing pending tasks. (Note: {str(e)})",
        )
