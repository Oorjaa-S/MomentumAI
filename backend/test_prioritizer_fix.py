import sys
from collections import Counter
from fastapi.testclient import TestClient

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from app import app

client = TestClient(app)

def test_cross_goal_prioritization():
    print("=" * 60)
    print("TESTING CROSS-GOAL TASK PRIORITIZATION")
    print("=" * 60)

    # 1. Fetch Digital Twin pending tasks and goals breakdown
    dt_res = client.get("/digital-twin")
    assert dt_res.status_code == 200
    dt = dt_res.json()

    goals_breakdown = {g["id"]: {"title": g["title"], "priority": g["priority"]} for g in dt["goals"]}
    pending_tasks = dt["remaining_tasks"]
    pending_goals_in_dt = Counter(t["goal_title"] for t in pending_tasks)

    print(f"Digital Twin has {len(pending_tasks)} pending tasks across {len(pending_goals_in_dt)} goals:")
    for g_title, count in pending_goals_in_dt.items():
        print(f"  - Goal: '{g_title}': {count} pending tasks")

    assert len(pending_goals_in_dt) > 1, "Expected tasks across multiple goals for this test."

    # 2. Call Task Prioritizer
    prio_res = client.post("/ai/prioritize-tasks", json={})
    assert prio_res.status_code == 200
    prio = prio_res.json()

    print(f"\nFocus Recommendation: {prio['focus_recommendation']}")
    print(f"Summary: {prio['summary']}")
    print(f"Total Prioritized Tasks Returned: {len(prio['prioritized_tasks'])}")

    prioritized_goals_count = Counter(pt["goal_title"] for pt in prio["prioritized_tasks"])
    print("\nGoals represented in prioritized tasks:")
    for g_title, count in prioritized_goals_count.items():
        print(f"  - '{g_title}': {count} tasks")

    # 3. Verify top 5 tasks
    print("\nTop 5 Ranked Tasks:")
    for pt in prio["prioritized_tasks"][:5]:
        print(f"  Rank {pt['rank']} [ID {pt['task_id']}]: \"{pt['task_title']}\" (Goal: \"{pt['goal_title']}\", Tier: {pt['priority_tier']})")
        print(f"    Reason: {pt['reasoning']}")

    # Assert multiple goals are represented in the prioritized list
    assert len(prioritized_goals_count) > 1, f"Expected tasks from multiple goals, but got: {prioritized_goals_count}"
    
    # Assert that all pending tasks are accounted for
    assert len(prio["prioritized_tasks"]) == len(pending_tasks), f"Expected {len(pending_tasks)} tasks, got {len(prio['prioritized_tasks'])}"

    print("\n" + "=" * 60)
    print("CROSS-GOAL TASK PRIORITIZATION VERIFIED! [PASS]")
    print("=" * 60)

if __name__ == "__main__":
    test_cross_goal_prioritization()
