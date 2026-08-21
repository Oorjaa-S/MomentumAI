def build_decomposition_prompt(
    goal,
    analysis,
    current_knowledge
):

    return f"""
You are a curriculum designer.

Goal:
{goal}

Current Knowledge:
{current_knowledge}

Analysis:
{analysis}

Break the goal into logical learning topics in the correct order.

IMPORTANT:
Avoid spending time on topics already known.

Return markdown using EXACTLY this format:

## Topic 1: <topic>

Microtasks:
- task 1
- task 2
- task 3

## Topic 2: <topic>

Microtasks:
- task 1
- task 2
- task 3

Return markdown.

"""