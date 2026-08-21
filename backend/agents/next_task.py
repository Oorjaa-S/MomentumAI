from typing import Optional, List, Dict, Any
from collections import defaultdict
from sqlalchemy.orm import Session

from utils.groq_client import ask_groq
from utils.ai_helpers import clean_and_parse_json
from services.digital_twin import get_digital_twin_state, format_digital_twin_prompt_context
from prompts.next_task_prompt import build_next_task_prompt
from schemas import (
    NextTaskRequest,
    NextTaskResponse,
)
from models import Goal, Task


def get_next_best_task(
    db: Session,
    request: NextTaskRequest = NextTaskRequest(),
    user_id: Optional[int] = None,
) -> NextTaskResponse:
    """
    Determines the single highest-leverage task for the user to execute RIGHT NOW.
    Grounded in the Digital Twin, deadlines, workload pressure, and available time.
    """
    dt_state = get_digital_twin_state(db, user_id=user_id)
    dt_context = format_digital_twin_prompt_context(dt_state)

    goal_filter_title = None
    target_tasks: List[Dict[str, Any]] = []

    if request.goal_id:
        goal = db.query(Goal).filter(Goal.id == request.goal_id).first()
        if goal:
            goal_filter_title = goal.title
            tasks = db.query(Task).filter(Task.goal_id == goal.id, Task.completed == False).all()
            for t in tasks:
                target_tasks.append({
                    "id": t.id,
                    "title": t.title,
                    "goal_id": goal.id,
                    "goal_title": goal.title,
                    "goal_priority": goal.priority,
                    "goal_deadline": goal.deadline,
                })
    else:
        for t in dt_state.remaining_tasks:
            target_tasks.append({
                "id": t.id,
                "title": t.title,
                "goal_id": t.goal_id,
                "goal_title": t.goal_title,
                "goal_priority": t.goal_priority,
                "goal_deadline": t.goal_deadline,
            })

    if not target_tasks:
        return NextTaskResponse(
            task_id=None,
            task_title="No pending tasks in queue",
            goal_id=None,
            goal_title="All Goals Completed",
            priority="Low",
            difficulty="Easy",
            estimated_minutes=0,
            reason="All tasks in the active goals backlog have been completed or no tasks exist.",
            suggested_action="Create a new goal or celebrate completing all pending tasks!",
        )

    task_by_id = {t["id"]: t for t in target_tasks}

    # Balanced prompt selection across goals
    if request.goal_id or len(target_tasks) <= 15:
        tasks_for_prompt = target_tasks[:15]
    else:
        tasks_by_goal = defaultdict(list)
        for t in target_tasks:
            tasks_by_goal[t["goal_title"]].append(t)
        
        priority_order = {"high": 3, "medium": 2, "low": 1}
        sorted_goals = sorted(
            tasks_by_goal.keys(),
            key=lambda g: priority_order.get((tasks_by_goal[g][0].get("goal_priority") or "medium").lower(), 2),
            reverse=True
        )

        tasks_for_prompt = []
        for g in sorted_goals:
            tasks_for_prompt.extend(tasks_by_goal[g][:3])
        tasks_for_prompt = tasks_for_prompt[:15]

    prompt = build_next_task_prompt(
        digital_twin_context=dt_context,
        pending_tasks=tasks_for_prompt,
        available_minutes=request.available_minutes,
        goal_filter_title=goal_filter_title,
    )

    raw_response = ask_groq(prompt)

    try:
        parsed_data = clean_and_parse_json(raw_response)
        
        raw_tid = parsed_data.get("task_id")
        matched = None
        if raw_tid is not None:
            try:
                matched = task_by_id.get(int(raw_tid))
            except (ValueError, TypeError):
                matched = None

        if matched is None:
            # Fallback to matching title or first candidate
            raw_title = (parsed_data.get("task_title") or "").strip().lower()
            for t in target_tasks:
                if t["title"].strip().lower() == raw_title:
                    matched = t
                    break
        
        if matched is None:
            # Fallback to top target task (High priority first)
            priority_order = {"high": 3, "medium": 2, "low": 1}
            sorted_candidates = sorted(
                target_tasks,
                key=lambda x: priority_order.get((x.get("goal_priority") or "medium").lower(), 2),
                reverse=True
            )
            matched = sorted_candidates[0]

        est_m = int(parsed_data.get("estimated_minutes", 30))
        est_m = max(10, min(est_m, 180))

        return NextTaskResponse(
            task_id=matched["id"],
            task_title=matched["title"],
            goal_id=matched.get("goal_id"),
            goal_title=matched.get("goal_title"),
            priority=parsed_data.get("priority", matched.get("goal_priority", "Medium")),
            difficulty=parsed_data.get("difficulty", "Medium"),
            estimated_minutes=est_m,
            reason=parsed_data.get(
                "reason",
                f"Ranked as the top immediate focus for goal '{matched.get('goal_title')}'."
            ),
            suggested_action=parsed_data.get(
                "suggested_action",
                f"Begin work on '{matched['title']}'."
            ),
        )

    except Exception as e:
        # Fallback to first high-priority task
        priority_order = {"high": 3, "medium": 2, "low": 1}
        sorted_candidates = sorted(
            target_tasks,
            key=lambda x: priority_order.get((x.get("goal_priority") or "medium").lower(), 2),
            reverse=True
        )
        top_task = sorted_candidates[0]

        return NextTaskResponse(
            task_id=top_task["id"],
            task_title=top_task["title"],
            goal_id=top_task.get("goal_id"),
            goal_title=top_task.get("goal_title"),
            priority=top_task.get("goal_priority", "High"),
            difficulty="Medium",
            estimated_minutes=45,
            reason=f"Top priority item from highest urgency goal '{top_task.get('goal_title')}'. (Note: {str(e)})",
            suggested_action=f"Open your workspace and start executing '{top_task['title']}'.",
        )
