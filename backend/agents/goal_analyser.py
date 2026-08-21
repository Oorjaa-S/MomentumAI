from utils.groq_client import ask_groq
from prompts.goal_prompt import build_goal_prompt

def analyze_goal(
    goal,
    days,
    hours,
    skill_level,
    current_knowledge
):

    prompt = build_goal_prompt(
        goal,
        days,
        hours,
        skill_level,
        current_knowledge
    )

    return ask_groq(prompt)