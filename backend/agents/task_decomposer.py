from utils.groq_client import ask_groq
from prompts.decomposition_prompt import build_decomposition_prompt

def decompose_goal(
    goal,
    analysis,
    current_knowledge
):

    prompt = build_decomposition_prompt(
        goal,
        analysis,
        current_knowledge
    )

    return ask_groq(prompt)