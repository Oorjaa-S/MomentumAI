from typing import Optional, List, Dict, Any
from collections import defaultdict
from sqlalchemy.orm import Session

from utils.groq_client import ask_groq
from utils.ai_helpers import clean_and_parse_json
from services.digital_twin import get_digital_twin_state, format_digital_twin_prompt_context
from prompts.prioritizer_prompt import build_prioritizer_prompt
from schemas import (
    PrioritizationRequest,
    PrioritizationResponse,
    PrioritizedTaskItem,
)
from models import Goal, Task


def prioritize_tasks(
    db: Session,
    request: PrioritizationRequest,
    user_id: Optional[int] = None,
) -> PrioritizationResponse:
    """
    Ranks and categorizes ALL pending tasks across ALL active goals
    based on urgency, impact, difficulty, and Digital Twin context.
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
                    "goal_title": goal.title,
                    "goal_priority": goal.priority,
                    "goal_deadline": goal.deadline,
                })
    else:
        # Include ALL pending tasks across ALL goals from the Digital Twin
        for t in dt_state.remaining_tasks:
            target_tasks.append({
                "id": t.id,
                "title": t.title,
                "goal_title": t.goal_title,
                "goal_priority": t.goal_priority,
                "goal_deadline": t.goal_deadline,
            })

    if not target_tasks:
        return PrioritizationResponse(
            prioritized_tasks=[],
            focus_recommendation="No pending tasks found to prioritize.",
            summary="All tasks are completed or no tasks exist.",
        )

    task_by_id = {t["id"]: t for t in target_tasks}

    # Balanced prompt selection across goals
    if request.goal_id or len(target_tasks) <= 18:
        tasks_for_prompt = target_tasks[:18]
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
            tasks_for_prompt.extend(tasks_by_goal[g][:4])
        tasks_for_prompt = tasks_for_prompt[:18]

    prompt = build_prioritizer_prompt(
        digital_twin_context=dt_context,
        tasks_to_prioritize=tasks_for_prompt,
        goal_filter_title=goal_filter_title,
    )

    raw_response = ask_groq(prompt)

    try:
        parsed_data = clean_and_parse_json(raw_response)
        
        items: List[PrioritizedTaskItem] = []
        seen_ids = set()
        
        for item in parsed_data.get("prioritized_tasks", []):
            try:
                tid = int(item.get("task_id", 0))
            except (ValueError, TypeError):
                continue

            matched = task_by_id.get(tid)
            if matched and tid not in seen_ids:
                seen_ids.add(tid)
                items.append(
                    PrioritizedTaskItem(
                        task_id=tid,
                        task_title=matched["title"],  # Preserves exact title
                        goal_title=matched["goal_title"],
                        rank=len(items) + 1,
                        priority_tier=item.get("priority_tier", "P2 - Important"),
                        urgency=item.get("urgency", "Medium"),
                        impact=item.get("impact", "Medium"),
                        difficulty=item.get("difficulty", "Medium"),
                        reasoning=item.get("reasoning", "Prioritized based on goal priority and urgency"),
                    )
                )

        # Merge remaining pending tasks across all goals (High -> Medium -> Low priority)
        priority_weights = {"high": 3, "medium": 2, "low": 1}
        remaining_target_tasks = sorted(
            [t for t in target_tasks if t["id"] not in seen_ids],
            key=lambda x: priority_weights.get((x.get("goal_priority") or "medium").lower(), 2),
            reverse=True
        )

        for t in remaining_target_tasks:
            seen_ids.add(t["id"])
            p_level = (t.get("goal_priority") or "Medium").lower()
            items.append(
                PrioritizedTaskItem(
                    task_id=t["id"],
                    task_title=t["title"],
                    goal_title=t["goal_title"],
                    rank=len(items) + 1,
                    priority_tier="P1 - Critical" if p_level == "high" else ("P2 - Important" if p_level == "medium" else "P4 - Low"),
                    urgency="High" if p_level == "high" else ("Medium" if p_level == "medium" else "Low"),
                    impact="High" if p_level == "high" else "Medium",
                    difficulty="Medium",
                    reasoning=f"Categorized under {t.get('goal_priority', 'Medium')} priority goal '{t['goal_title']}'.",
                )
            )

        return PrioritizationResponse(
            prioritized_tasks=items,
            focus_recommendation=parsed_data.get(
                "focus_recommendation",
                "Begin with the top-ranked task."
            ),
            summary=parsed_data.get(
                "summary",
                f"Successfully prioritized {len(items)} task(s) across all active goals."
            ),
        )

    except Exception as e:
        # Fallback ranking across all goals
        fallback_items = []
        priority_weights = {"high": 3, "medium": 2, "low": 1}
        sorted_tasks = sorted(
            target_tasks,
            key=lambda x: priority_weights.get((x.get("goal_priority") or "medium").lower(), 2),
            reverse=True
        )

        for idx, t in enumerate(sorted_tasks):
            p_level = (t.get("goal_priority") or "Medium").lower()
            fallback_items.append(
                PrioritizedTaskItem(
                    task_id=t["id"],
                    task_title=t["title"],
                    goal_title=t["goal_title"],
                    rank=idx + 1,
                    priority_tier="P1 - Critical" if p_level == "high" else ("P2 - Important" if p_level == "medium" else "P4 - Low"),
                    urgency="High" if p_level == "high" else ("Medium" if p_level == "medium" else "Low"),
                    impact="High" if p_level == "high" else "Medium",
                    difficulty="Medium",
                    reasoning=f"Ranked by {t.get('goal_priority', 'Medium')} priority goal status.",
                )
            )

        return PrioritizationResponse(
            prioritized_tasks=fallback_items,
            focus_recommendation="Focus on the top ranked high-priority items first.",
            summary=f"Prioritized across all goals using baseline goal criteria. (Note: {str(e)})",
        )
