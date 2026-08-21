from utils.groq_client import ask_groq
from prompts.planner_prompt import build_planner_prompt

def generate_plan(
    goal,
    days,
    hours,
    skill_level,
    current_knowledge,
    analysis,
    breakdown
):

    prompt = build_planner_prompt(
        goal,
        days,
        hours,
        skill_level,
        current_knowledge,
        analysis,
        breakdown
    )

    return ask_groq(prompt)