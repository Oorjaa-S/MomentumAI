from typing import List, Dict, Any


def build_time_estimator_prompt(
    digital_twin_context: str,
    tasks_to_estimate: List[Dict[str, Any]],
    available_hours: float = 2.0,
) -> str:
    tasks_list_str = "\n".join([
        f"- Task ID: {t.get('task_id', 'None')} | Title: \"{t.get('task_title')}\" | Goal: \"{t.get('goal_title', 'General')}\""
        for t in tasks_to_estimate
    ]) if tasks_to_estimate else "No tasks provided."

    capacity_minutes = int(available_hours * 60)

    return f"""You are an expert AI Time Estimation and Effort Sizing Specialist.
Your job is to provide realistic, grounded time estimates for the specified tasks, taking into account the user's skill context, goal complexity, and available working capacity.

{digital_twin_context}

### User Capacity Context:
- Daily Available Working Capacity: {available_hours} hours ({capacity_minutes} minutes)

### Tasks to Estimate:
{tasks_list_str}

### Strict Guidelines for Realistic Estimation:
1. REALISTIC DURATION: Estimate the duration in minutes based on real-world engineering/learning effort.
   - Prevent unreasonable bounds: simple/conceptual tasks should be 15-30 minutes (never 0 minutes or 5+ hours).
   - Medium implementation tasks should be 30-60 minutes.
   - Large or ambiguous tasks should be 60-90 minutes and decomposed into subtasks.
2. DIFFICULTY RATING: Assign 'difficulty' as "Easy", "Medium", or "Hard".
3. CONFIDENCE LEVEL: Assign 'confidence' as "High", "Medium", or "Low".
4. REASONING: Provide concise, grounded reasoning for the time estimate and difficulty.
5. SUGGESTED SUBTASKS: For tasks of 45+ minutes or high complexity, provide a list of concrete 15-30 minute subtasks.
6. WORKLOAD FIT: State how the total estimated minutes compares to the user's available capacity.

### Output Format:
You MUST respond ONLY with valid JSON. Do not include markdown code fences, comments, or additional text.

JSON Schema:
{{
  "estimates": [
    {{
      "task_id": 1,
      "task_title": "Task title",
      "estimated_minutes": 45,
      "difficulty": "Medium",
      "confidence": "High",
      "reasoning": "Explanation for time sizing and complexity",
      "suggested_subtasks": ["Step 1", "Step 2"]
    }}
  ],
  "total_estimated_minutes": 45,
  "workload_fit": "Fits comfortably within today's capacity with time remaining.",
  "summary": "Overall evaluation of task sizes and scheduling recommendations."
}}
"""
