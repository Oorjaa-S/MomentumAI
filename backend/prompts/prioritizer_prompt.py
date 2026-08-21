from typing import List, Dict, Any, Optional


def build_prioritizer_prompt(
    digital_twin_context: str,
    tasks_to_prioritize: List[Dict[str, Any]],
    goal_filter_title: Optional[str] = None,
) -> str:
    tasks_list_str = "\n".join([
        f"- [Task ID: {t.get('id')}] \"{t.get('title')}\" | Goal: \"{t.get('goal_title')}\" | Priority: {t.get('goal_priority')} | Deadline: {t.get('goal_deadline')}"
        for t in tasks_to_prioritize
    ]) if tasks_to_prioritize else "No tasks specified."

    filter_text = f"Scope: Goal \"{goal_filter_title}\"" if goal_filter_title else "Scope: ALL active goals"

    return f"""You are an elite AI Task Prioritization Strategist.
Your objective is to evaluate all pending tasks across active goals and establish an optimal, unified execution order based on urgency, strategic impact, deadlines, and task difficulty.

{digital_twin_context}

### Pending Tasks Backlog ({filter_text}):
{tasks_list_str}

### Instructions:
1. Evaluate ALL provided tasks across active goals simultaneously.
2. Select and rank the most critical and impactful focus tasks (up to top 15-20) from across active goals in 'prioritized_tasks' from Rank 1 downwards.
3. Tasks from High-priority goals with imminent deadlines must be prioritized over lower-priority or deadline-free tasks.
4. For each ranked task, provide:
   - 'task_id': Exact integer Task ID from the backlog above.
   - 'task_title': Exact title of the task.
   - 'goal_title': Exact goal title.
   - 'rank': Sequential integer rank (1, 2, 3...).
   - 'priority_tier': e.g. "P1 - Critical / Urgent", "P2 - High Impact", "P3 - Medium", or "P4 - Low"
   - 'urgency': "High", "Medium", or "Low"
   - 'impact': "High", "Medium", or "Low"
   - 'difficulty': "Easy", "Medium", or "Hard"
   - 'reasoning': Detailed justification for this rank considering goal priority, deadlines, dependencies, and cognitive load.
5. Provide an actionable 'focus_recommendation' explaining which specific tasks to execute first and why.
6. Provide a concise 'summary' of the cross-goal priority distribution.

### Output Format:
You MUST respond ONLY with valid JSON. Do not include markdown code fences, comments, or additional text.

JSON Schema:
{{
  "prioritized_tasks": [
    {{
      "task_id": 1,
      "task_title": "Exact title",
      "goal_title": "Exact goal title",
      "rank": 1,
      "priority_tier": "P1 - Critical / Urgent",
      "urgency": "High",
      "impact": "High",
      "difficulty": "Medium",
      "reasoning": "Detailed justification based on goal priority, deadline, and impact"
    }}
  ],
  "focus_recommendation": "Actionable recommendation on immediate next steps across goals.",
  "summary": "Cross-goal prioritization overview."
}}
"""
