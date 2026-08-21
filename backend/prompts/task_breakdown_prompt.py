from typing import Optional


def build_task_breakdown_prompt(
    task_title: str,
    goal_title: str,
    goal_priority: Optional[str] = "Medium",
    goal_deadline: Optional[str] = "No deadline",
    goal_notes: Optional[str] = "",
    digital_twin_context: Optional[str] = "",
) -> str:
    notes_section = f"- Goal Knowledge & Notes: {goal_notes}" if goal_notes else ""

    return f"""You are an elite AI Task Decomposition & Execution Engineer.
Your job is to break down a specific existing task into concrete, actionable, sequential subtasks.

### Task to Decompose:
- **Task Title**: "{task_title}"
- **Parent Goal**: "{goal_title}"
- **Goal Priority**: {goal_priority or 'Medium'}
- **Goal Deadline**: {goal_deadline or 'No deadline'}
{notes_section}

{digital_twin_context}

### Strict Guidelines for Subtasks:
1. ACTIONABLE & SPECIFIC: Subtasks MUST be concrete implementation or execution steps, NOT vague advice or theoretical tips.
   - Good Example for "Integrate AI Daily Planner":
     1. Create planner service
     2. Build daily planning prompt
     3. Connect Digital Twin context
     4. Add API endpoint
     5. Validate generated plan
     6. Test capacity handling
   - Bad Example: "Think about planning", "Consider time management", "Study productivity".
2. SEQUENTIAL ORDER: Order subtasks logically in the order they should be executed (step_order: 1, 2, 3...).
3. SIZED ACCURATELY: Each subtask should represent a focused 15 to 45-minute chunk of work.
4. DIFFICULTY & DURATION: Provide realistic 'estimated_minutes' and 'difficulty' ("Easy", "Medium", or "Hard") for each subtask.

### Output Format:
You MUST respond ONLY with valid JSON. Do not include markdown code fences, comments, or additional text.

JSON Schema:
{{
  "subtasks": [
    {{
      "title": "Concrete actionable step title",
      "estimated_minutes": 30,
      "step_order": 1,
      "difficulty": "Medium",
      "description": "Brief description of what to do or build in this step"
    }}
  ],
  "total_estimated_minutes": 120,
  "summary": "Concise summary of the breakdown strategy and execution flow."
}}
"""
