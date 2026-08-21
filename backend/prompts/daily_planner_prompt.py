from typing import Optional, List
from schemas import DigitalTwinTask


def build_daily_planner_prompt(
    digital_twin_context: str,
    pending_tasks: List[DigitalTwinTask],
    target_date: str = "Today",
    available_hours: float = 2.0,
    focus_goal_title: Optional[str] = None,
) -> str:
    capacity_minutes = int(available_hours * 60)
    focus_text = f"Prioritize tasks under Goal: \"{focus_goal_title}\" where feasible." if focus_goal_title else "Select the most critical tasks across active goals."

    tasks_list_str = "\n".join([
        f"- Task ID: {t.id} | Title: \"{t.title}\" | Goal: \"{t.goal_title}\" | Priority: {t.goal_priority} | Deadline: {t.goal_deadline}"
        for t in pending_tasks
    ]) if pending_tasks else "No pending tasks available in the backlog."

    return f"""You are an elite AI Daily Execution Coach.
Your responsibility is to select and schedule which existing tasks the user should execute {target_date}.
This is NOT a roadmap generator or task breakdown tool; it is a strict daily scheduler for existing tasks.

{digital_twin_context}

### Available Pending Tasks (You MUST choose ONLY from this list):
{tasks_list_str}

### Strict Rules:
1. SELECTION ONLY: You MUST ONLY select tasks from the 'Available Pending Tasks' list above.
2. NO NEW TASKS: DO NOT invent, generate, decompose, or create any new tasks.
3. EXACT TITLES & IDS: DO NOT alter, rephrase, or modify any task title. The 'task_id', 'task_title', and 'goal_title' MUST match an existing pending task EXACTLY.
4. VALID TASK ID: Every item in 'planned_tasks' MUST have a valid integer 'task_id' matching one of the available pending tasks.
5. CAPACITY CONSTRAINT: Total estimated minutes across all selected tasks MUST NOT exceed {capacity_minutes} minutes ({available_hours} hours).
6. DIFFICULTY RATING: Provide 'difficulty' ("Easy", "Medium", or "Hard") for each scheduled task.
7. FOCUS DIRECTIVE: {focus_text}
8. If there are no available pending tasks, return an empty 'planned_tasks' array.

### Output Format:
You MUST respond ONLY with valid JSON. Do not include markdown code fences, comments, or additional text.

JSON Schema:
{{
  "planned_tasks": [
    {{
      "task_id": 123,
      "task_title": "Exact title from available pending tasks",
      "goal_title": "Exact goal title",
      "estimated_minutes": 45,
      "rank": 1,
      "priority": "High",
      "difficulty": "Medium",
      "reason": "Why this existing task is prioritized for today"
    }}
  ],
  "total_planned_minutes": 45,
  "remaining_capacity_minutes": {capacity_minutes - 45},
  "summary": "Concise overview of today's selected schedule and strategy."
}}
"""
