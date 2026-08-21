import sys
import time
from fastapi.testclient import TestClient

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from app import app

client = TestClient(app)

def run_test(name, fn):
    print(f"\n{'=' * 65}")
    print(f"RUNNING TEST: {name}")
    print('=' * 65)
    try:
        fn()
        print(f"--> [PASS] {name}")
        time.sleep(1)
        return True
    except Exception as e:
        print(f"--> [FAIL] {name}: {e}")
        import traceback
        traceback.print_exc()
        return False

# ====================================================================
# Test 1: Digital Twin State
# ====================================================================
def test_digital_twin():
    res = client.get("/digital-twin")
    assert res.status_code == 200, f"Status: {res.status_code}"
    dt = res.json()
    assert "goals" in dt
    assert "remaining_tasks" in dt
    assert "completion_rate" in dt
    assert "workload_pressure" in dt
    assert "deadline_pressure" in dt
    print(f"  Active Goals: {dt['total_goals']}, Tasks: {dt['total_tasks']} ({len(dt['remaining_tasks'])} pending)")
    print(f"  Completion Rate: {dt['completion_rate']}%, Workload: {dt['workload_pressure']}, Deadline: {dt['deadline_pressure']}")

# ====================================================================
# Test 2: AI Task Breakdown
# ====================================================================
def test_task_breakdown():
    dt = client.get("/digital-twin").json()
    assert dt["remaining_tasks"], "Need at least 1 pending task for breakdown test"
    sample_task = dt["remaining_tasks"][0]
    
    # Test valid breakdown
    res = client.post(f"/ai/breakdown-task/{sample_task['id']}")
    assert res.status_code == 200, f"Status: {res.status_code}"
    data = res.json()
    assert data["task_id"] == sample_task["id"]
    assert data["task_title"] == sample_task["title"]
    assert len(data["subtasks"]) > 0
    print(f"  Task '{data['task_title']}' decomposed into {len(data['subtasks'])} subtasks ({data['total_estimated_minutes']} min total):")
    for s in data["subtasks"][:3]:
        print(f"    - Step {s['step_order']}: \"{s['title']}\" ({s['estimated_minutes']}m, {s.get('difficulty', 'Medium')})")
    
    # Test 404
    res_404 = client.post("/ai/breakdown-task/9999999")
    assert res_404.status_code == 404, f"Expected 404, got {res_404.status_code}"
    print("  [OK] 404 handled cleanly for non-existent task.")

# ====================================================================
# Test 3: Task Prioritization
# ====================================================================
def test_prioritization():
    res = client.post("/ai/prioritize-tasks", json={})
    assert res.status_code == 200, f"Status: {res.status_code}"
    prio = res.json()
    assert "prioritized_tasks" in prio
    assert len(prio["prioritized_tasks"]) > 0
    print(f"  Total Prioritized Tasks: {len(prio['prioritized_tasks'])}")
    print(f"  Focus Recommendation: {prio['focus_recommendation'][:100]}...")
    top_t = prio["prioritized_tasks"][0]
    print(f"  Top Task: [ID {top_t['task_id']}] \"{top_t['task_title']}\" (Tier: {top_t['priority_tier']}, Diff: {top_t.get('difficulty')})")
    assert top_t.get("difficulty") in ["Easy", "Medium", "Hard", None]

# ====================================================================
# Test 4: Time Estimation
# ====================================================================
def test_time_estimation():
    dt = client.get("/digital-twin").json()
    t_ids = [t["id"] for t in dt["remaining_tasks"][:3]]
    res = client.post("/ai/estimate-time", json={"task_ids": t_ids})
    assert res.status_code == 200, f"Status: {res.status_code}"
    data = res.json()
    assert len(data["estimates"]) > 0
    for est in data["estimates"]:
        assert 10 <= est["estimated_minutes"] <= 300
        print(f"  Estimate for \"{est['task_title']}\": {est['estimated_minutes']} min, Diff: {est.get('difficulty')}, Confidence: {est['confidence']}")

# ====================================================================
# Test 5: Daily Planner
# ====================================================================
def test_daily_planner():
    res = client.post("/ai/daily-plan", json={"available_hours_override": 2.0})
    assert res.status_code == 200, f"Status: {res.status_code}"
    plan = res.json()
    assert "planned_tasks" in plan
    assert plan["total_planned_minutes"] <= 120, f"Total planned {plan['total_planned_minutes']} exceeds 120 min capacity"
    print(f"  Planned Tasks ({len(plan['planned_tasks'])} items, {plan['total_planned_minutes']} min total, remaining cap: {plan['remaining_capacity_minutes']} min):")
    seen_ids = set()
    for item in plan["planned_tasks"]:
        assert item["task_id"] not in seen_ids, f"Duplicate task {item['task_id']} found in plan"
        seen_ids.add(item["task_id"])
        print(f"    - [ID {item['task_id']}] \"{item['task_title']}\" ({item['estimated_minutes']}m, {item.get('difficulty', 'Medium')})")

# ====================================================================
# Test 6: AI Next Best Task
# ====================================================================
def test_next_best_task():
    res = client.post("/ai/next-task", json={"available_minutes": 60})
    assert res.status_code == 200, f"Status: {res.status_code}"
    data = res.json()
    assert data["task_id"] is not None
    assert data["task_title"]
    assert data["difficulty"] in ["Easy", "Medium", "Hard", None]
    assert data["estimated_minutes"] > 0
    print(f"  Next Best Task: [ID {data['task_id']}] \"{data['task_title']}\" (Goal: \"{data['goal_title']}\")")
    print(f"  Duration: {data['estimated_minutes']} min | Difficulty: {data['difficulty']} | Priority: {data['priority']}")
    print(f"  Reason: {data['reason']}")
    print(f"  Kickoff: {data['suggested_action']}")

# ====================================================================
# Test 7: Unified AI Recommendation Pipeline
# ====================================================================
def test_unified_recommendation():
    res = client.post("/ai/recommend", json={"available_minutes": 60})
    assert res.status_code == 200, f"Status: {res.status_code}"
    rec = res.json()
    assert rec["recommended_task"] is not None
    assert rec["recommended_task"]["task_id"] is not None
    assert rec["recommended_task"]["difficulty"] in ["Easy", "Medium", "Hard", None]
    print(f"  Unified Recommended Task: \"{rec['recommended_task']['task_title']}\" ({rec['recommended_task']['difficulty']})")
    print(f"  Estimated Minutes: {rec['estimated_minutes']} min")
    print(f"  Subtasks Generated: {len(rec['subtasks'])}")
    for s in rec["subtasks"][:3]:
        print(f"    - Step {s['step_order']}: \"{s['title']}\" ({s['estimated_minutes']}m)")
    print(f"  Summary: {rec['summary']}")

# ====================================================================
# Test 8: Goal & Task CRUD + AI Roadmap Regressions
# ====================================================================
def test_crud_and_regressions():
    # 1. Goal CRUD
    g_res = client.post("/goals", json={
        "title": "Phase 2 Validation Goal",
        "deadline": "5 days",
        "priority": "High",
        "available_hours": 2,
        "notes": "Testing CRUD cycles"
    })
    assert g_res.status_code == 200
    goal_id = g_res.json()["id"]
    print(f"  [OK] Created Goal #{goal_id}")

    # 2. Task CRUD
    t_res = client.post(f"/goals/{goal_id}/tasks", json={"title": "Verification Task 1"})
    assert t_res.status_code == 200
    task_id = t_res.json()["id"]
    print(f"  [OK] Created Task #{task_id}")

    # 3. Update task
    u_res = client.put(f"/tasks/{task_id}", json={"title": "Verification Task 1 Updated", "completed": True})
    assert u_res.status_code == 200
    assert u_res.json()["completed"] is True
    print(f"  [OK] Completed Task #{task_id}")

    # 4. Roadmap Generation
    rm_res = client.post("/generate-roadmap", json={
        "goal": "Learn TypeScript",
        "skill_level": "Beginner",
        "days": 10,
        "hours": 2,
        "current_knowledge": "Basic JavaScript"
    })
    assert rm_res.status_code == 200
    assert "plan" in rm_res.json()
    print("  [OK] /generate-roadmap operational")

    # 5. Clean up
    del_t = client.delete(f"/tasks/{task_id}")
    assert del_t.status_code == 200
    del_g = client.delete(f"/goals/{goal_id}")
    assert del_g.status_code == 200
    print(f"  [OK] Cleaned up Goal #{goal_id} and Task #{task_id}")


def main():
    print("=" * 65)
    print("MOMENTUMAI - PHASE 2 FULL VERIFICATION SUITE")
    print("=" * 65)

    tests = [
        ("1. Digital Twin State", test_digital_twin),
        ("2. AI Task Breakdown", test_task_breakdown),
        ("3. Smart Task Prioritization", test_prioritization),
        ("4. AI Time Estimation", test_time_estimation),
        ("5. AI Daily Planner", test_daily_planner),
        ("6. AI Next Best Task", test_next_best_task),
        ("7. Unified AI Recommendation Pipeline", test_unified_recommendation),
        ("8. Goal & Task CRUD + Regressions", test_crud_and_regressions),
    ]

    results = []
    for name, fn in tests:
        success = run_test(name, fn)
        results.append((name, success))

    print("\n" + "=" * 65)
    print("FINAL PHASE 2 VERIFICATION SUMMARY")
    print("=" * 65)
    all_passed = True
    for name, success in results:
        status = "PASSED [OK]" if success else "FAILED [X]"
        if not success:
            all_passed = False
        print(f"{name:<45}: {status}")

    print("=" * 65)
    if all_passed:
        print("ALL PHASE 2 CAPABILITIES & VERIFICATIONS COMPLETED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED - PLEASE REVIEW LOGS ABOVE.")
    print("=" * 65)

if __name__ == "__main__":
    main()
