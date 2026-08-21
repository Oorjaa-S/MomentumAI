from typing import List, Dict, Any, Optional


def build_next_task_prompt(
    digital_twin_context: str,
    pending_tasks: List[Dict[str, Any]],
    available_minutes: Optional[int] = None,
    goal_filter_title: Optional[str] = None,
) -> str:
    tasks_list_str = "\n".join([
        f"- [Task ID: {t.get('id')}] \"{t.get('title')}\" | Goal: \"{t.get('goal_title')}\" | Priority: {t.get('goal_priority')} | Deadline: {t.get('goal_deadline')}"
        for t in pending_tasks
    ]) if pending_tasks else "No pending tasks available in the backlog."

    time_context = f"The user currently has {available_minutes} minutes available for immediate work." if available_minutes else "The user is ready to begin their next work session."
    filter_context = f"Scope limited to Goal: \"{goal_filter_title}\"." if goal_filter_title else "Evaluating across all active goals."

    return f"""You are an elite AI Real-Time Execution Advisor.
Your objective is to answer: "What single task should the user work on RIGHT NOW?"

{digital_twin_context}

### Context for Immediate Next Step:
- {time_context}
- {filter_context}

### Available Pending Tasks (You MUST choose ONE existing task from this list):
{tasks_list_str}

### Strict Guidelines:
1. SELECTION ONLY: You MUST choose EXACTLY ONE existing pending task from the list above. Do NOT invent new tasks.
2. OPTIMAL SELECTION: Select the single most high-leverage task considering:
   - High goal priority and imminent deadline pressure.
   - Immediate actionable impact (prerequisite or unblocking step).
   - Available time budget if specified.
3. PRESERVE TASK DETAILS: Match the 'task_id', 'task_title', and 'goal_title' EXACTLY as provided.
4. ESTIMATE DURATION: Provide realistic 'estimated_minutes' (e.g., 20 - 60 minutes).
5. DIFFICULTY & REASON: Assign 'difficulty' ("Easy", "Medium", or "Hard") and a compelling 'reason' explaining why this task is the best immediate focus.
6. SUGGESTED ACTION: Give a concrete, 1-2 sentence kickoff prompt ('suggested_action') explaining the very first micro-action to start immediately.

### Output Format:
You MUST respond ONLY with valid JSON. Do not include markdown code fences, comments, or additional text.

JSON Schema:
{{
  "task_id": 123,
  "task_title": "Exact title from available pending tasks",
  "goal_id": 1,
  "goal_title": "Exact goal title",
  "priority": "High",
  "difficulty": "Medium",
  "estimated_minutes": 45,
  "reason": "Why this specific task should be started immediately",
  "suggested_action": "Open the project and start by..."
}}
"""
