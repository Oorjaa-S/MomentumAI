def build_goal_prompt(
    goal,
    days,
    hours,
    skill_level,
    current_knowledge
):

    return f"""
You are a learning strategy expert.

Goal:
{goal}

Skill Level:
{skill_level}

Days Available:
{days}

Hours Per Day:
{hours}

Current Knowledge:
{current_knowledge}

Analyze this learning goal and return markdown in EXACTLY this format:

## Goal Type
<answer>

## Difficulty
Explain WHY you think the goal is difficult and what the user should prioritize first.

## Strengths
- point
- point

## Knowledge Gaps
- point
- point

## Suggested Learning Strategy
- point
- point

Keep the response concise and practical.
"""