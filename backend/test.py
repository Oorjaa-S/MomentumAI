from agents.goal_analyser import analyze_goal
from agents.task_decomposer import decompose_goal
from agents.planner import generate_plan

goal = "Learn Java Basics"
days = 14
hours = 1

skill_level = "Beginner"

current_knowledge = "Variables, Data Types"

print("RUNNING AGENT 1...")

analysis = analyze_goal(
    goal,
    days,
    hours,
    skill_level,
    current_knowledge
)

print("\nANALYSIS:")
print(analysis)

print("\nRUNNING AGENT 2...")

breakdown = decompose_goal(
    goal,
    analysis,
    current_knowledge
)

print("\nBREAKDOWN:")
print(breakdown)

print("\nRUNNING AGENT 3...")

plan = generate_plan(
    goal,
    days,
    hours,
    skill_level,
    current_knowledge,
    analysis,
    breakdown
)

print("\nSTUDY PLAN:")
print(plan)