import sys
from fastapi.testclient import TestClient

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from app import app

client = TestClient(app)

def test_daily_planner():
    print("=" * 60)
    print("TESTING STRICT DAILY PLANNER EXISTING TASK SELECTION")
    print("=" * 60)

    # 1. Fetch Digital Twin pending tasks
    dt_res = client.get("/digital-twin")
    assert dt_res.status_code == 200
    dt = dt_res.json()
    
    pending_tasks = {t["id"]: t["title"] for t in dt["remaining_tasks"]}
    print(f"Digital Twin has {len(pending_tasks)} pending task(s).")
    assert len(pending_tasks) > 0, "Need at least 1 pending task for test."

    # 2. Call Daily Planner
    plan_res = client.post("/ai/daily-plan", json={
        "target_date": "Today",
        "available_hours_override": 2.0
    })
    assert plan_res.status_code == 200
    plan = plan_res.json()

    print(f"\nPlan Summary: {plan['summary']}")
    print(f"Total Planned Minutes: {plan['total_planned_minutes']} min")
    print(f"Remaining Capacity: {plan['remaining_capacity_minutes']} min")
    print(f"Planned Tasks Count: {len(plan['planned_tasks'])}")

    assert len(plan["planned_tasks"]) > 0, "Expected at least 1 planned task."

    # 3. Verify every scheduled task exists and has exact matching title and ID
    for pt in plan["planned_tasks"]:
        tid = pt["task_id"]
        title = pt["task_title"]
        print(f"\n  Checking Task ID: {tid}")
        print(f"    Planned Title:  \"{title}\"")
        assert tid is not None, f"Task ID is None for task: {title}"
        assert tid in pending_tasks, f"Task ID {tid} not found in Digital Twin pending tasks!"
        expected_title = pending_tasks[tid]
        print(f"    Expected Title: \"{expected_title}\"")
        assert title == expected_title, f"Task title was modified! Expected '{expected_title}', got '{title}'"
        print(f"    [OK] Exact match confirmed!")

    print("\n" + "=" * 60)
    print("ALL SCHEDULED TASKS STRICTLY EXIST IN DIGITAL TWIN BACKLOG! [PASS]")
    print("=" * 60)

if __name__ == "__main__":
    test_daily_planner()
