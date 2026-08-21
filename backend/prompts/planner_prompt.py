def build_planner_prompt(
    goal,
    days,
    hours,
    skill_level,
    current_knowledge,
    analysis,
    breakdown
):

    return f"""
You are a study planning agent.

Goal:
{goal}

Skill Level:
{skill_level}

Current Knowledge:
{current_knowledge}

Days Available:
{days}

Hours Per Day:
{hours}

Analysis:
{analysis}

Breakdown:
{breakdown}

Create a realistic day-by-day study roadmap.

Rules:
- Skip mastered topics
- Focus on knowledge gaps
- Respect the available days
- Respect the available hours per day
- Include revision near the end if appropriate
- Assign specific topics to each day
- Do not exceed the provided timeline

IMPORTANT:
- Start directly with Day 1
- Every task MUST belong to a day
- DO NOT place any tasks before Day 1
- DO NOT add introductions, setup sections, notes, explanations, or summaries
- Output ONLY the roadmap

Use EXACTLY this format:

Day 1:
- Task
- Task

Day 2:
- Task
- Task

Day 3:
- Task
- Task
"""