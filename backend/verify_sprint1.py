import sys
import os
import json
from fastapi.testclient import TestClient

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from app import app
from database import SessionLocal
from models import Goal, Task

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("STARTING SPRINT 1 BACKEND VERIFICATION")
    print("=" * 60)
    
    results = {}
    created_goal_ids = []

    try:
        # -------------------------------------------------------------
        # Test 5: Existing Goal CRUD
        # -------------------------------------------------------------
        print("\n[TEST 5] Testing Existing Goal CRUD...")
        try:
            # Create Goal
            create_payload = {
                "title": "Master FastAPI & AI Agents",
                "deadline": "14 days",
                "priority": "High",
                "available_hours": 3,
                "notes": "FastAPI fundamentals, Groq API, Pydantic"
            }
            res = client.post("/goals", json=create_payload)
            assert res.status_code == 200, f"Create goal failed: {res.text}"
            goal_data = res.json()
            goal_id = goal_data["id"]
            created_goal_ids.append(goal_id)
            assert goal_data["title"] == create_payload["title"]
            print(f"  [OK] Goal Created: ID {goal_id} - '{goal_data['title']}'")

            # Fetch Goals
            res = client.get("/goals")
            assert res.status_code == 200
            goals = res.json()
            assert any(g["id"] == goal_id for g in goals)
            print(f"  [OK] Fetch Goals: Found {len(goals)} goal(s)")

            # Update Goal
            update_payload = {
                "title": "Master FastAPI & Advanced AI Agents",
                "deadline": "10 days",
                "priority": "High",
                "available_hours": 4,
                "notes": "Updated notes with advanced concepts"
            }
            res = client.put(f"/goals/{goal_id}", json=update_payload)
            assert res.status_code == 200
            assert res.json()["title"] == update_payload["title"]
            print(f"  [OK] Update Goal: Updated to '{res.json()['title']}'")

            results["5. Existing Goal CRUD"] = "PASSED"
        except Exception as e:
            print(f"  [FAIL] Goal CRUD Failed: {e}")
            results["5. Existing Goal CRUD"] = f"FAILED: {e}"
            return results

        # -------------------------------------------------------------
        # Test 6: Existing Task CRUD
        # -------------------------------------------------------------
        print("\n[TEST 6] Testing Existing Task CRUD...")
        try:
            # Create Tasks
            res_t1 = client.post(f"/goals/{goal_id}/tasks", json={"title": "Setup Digital Twin Service"})
            assert res_t1.status_code == 200
            task_1 = res_t1.json()
            task_1_id = task_1["id"]
            print(f"  [OK] Task 1 Created: ID {task_1_id} - '{task_1['title']}'")

            res_t2 = client.post(f"/goals/{goal_id}/tasks", json={"title": "Integrate AI Daily Planner"})
            assert res_t2.status_code == 200
            task_2 = res_t2.json()
            task_2_id = task_2["id"]
            print(f"  [OK] Task 2 Created: ID {task_2_id} - '{task_2['title']}'")

            res_t3 = client.post(f"/goals/{goal_id}/tasks", json={"title": "Build Test Suite"})
            assert res_t3.status_code == 200
            task_3 = res_t3.json()
            task_3_id = task_3["id"]
            print(f"  [OK] Task 3 Created: ID {task_3_id} - '{task_3['title']}'")

            # Fetch Tasks for Goal
            res = client.get(f"/goals/{goal_id}/tasks")
            assert res.status_code == 200
            tasks = res.json()
            assert len(tasks) >= 3
            print(f"  [OK] Fetch Tasks: Goal has {len(tasks)} tasks")

            # Update Task (Mark completed)
            res = client.put(f"/tasks/{task_1_id}", json={"title": "Setup Digital Twin Service", "completed": True})
            assert res.status_code == 200
            assert res.json()["completed"] is True
            print(f"  [OK] Update Task: Task {task_1_id} marked as completed")

            # Delete Task 3
            res = client.delete(f"/tasks/{task_3_id}")
            assert res.status_code == 200
            print(f"  [OK] Delete Task: Task {task_3_id} deleted successfully")

            results["6. Existing Task CRUD"] = "PASSED"
        except Exception as e:
            print(f"  [FAIL] Task CRUD Failed: {e}")
            results["6. Existing Task CRUD"] = f"FAILED: {e}"

        # -------------------------------------------------------------
        # Test 1: GET /digital-twin
        # -------------------------------------------------------------
        print("\n[TEST 1] Testing GET /digital-twin...")
        try:
            res = client.get("/digital-twin")
            assert res.status_code == 200, f"Status code: {res.status_code}, response: {res.text}"
            dt = res.json()
            
            # Validate structured fields
            assert "goals" in dt
            assert "total_goals" in dt
            assert "total_tasks" in dt
            assert "completed_tasks" in dt
            assert "remaining_tasks" in dt
            assert "completion_rate" in dt
            assert "total_available_hours" in dt
            assert "workload_pressure" in dt
            assert "deadline_pressure" in dt
            assert "summary" in dt
            
            print(f"  [OK] Total Goals: {dt['total_goals']}")
            print(f"  [OK] Total Tasks: {dt['total_tasks']} (Completed: {dt['completed_tasks']}, Pending: {len(dt['remaining_tasks'])})")
            print(f"  [OK] Completion Rate: {dt['completion_rate']}%")
            print(f"  [OK] Workload Pressure: {dt['workload_pressure']} | Deadline Pressure: {dt['deadline_pressure']}")
            print(f"  [OK] Summary: {dt['summary']}")

            results["1. GET /digital-twin"] = "PASSED"
        except Exception as e:
            print(f"  [FAIL] GET /digital-twin Failed: {e}")
            results["1. GET /digital-twin"] = f"FAILED: {e}"

        # -------------------------------------------------------------
        # Test 2: POST /ai/daily-plan
        # -------------------------------------------------------------
        print("\n[TEST 2] Testing POST /ai/daily-plan...")
        try:
            payload = {
                "target_date": "Today",
                "available_hours_override": 3.0,
                "focus_goal_id": goal_id
            }
            res = client.post("/ai/daily-plan", json=payload)
            assert res.status_code == 200, f"Status code: {res.status_code}, response: {res.text}"
            plan = res.json()
            
            assert "planned_tasks" in plan
            assert "total_planned_minutes" in plan
            assert "remaining_capacity_minutes" in plan
            assert "summary" in plan
            assert isinstance(plan["planned_tasks"], list)
            
            print(f"  [OK] Total Planned Minutes: {plan['total_planned_minutes']} min")
            print(f"  [OK] Remaining Capacity: {plan['remaining_capacity_minutes']} min")
            print(f"  [OK] Summary: {plan['summary']}")
            print(f"  [OK] Planned Tasks Count: {len(plan['planned_tasks'])}")
            for pt in plan["planned_tasks"][:2]:
                print(f"    - Rank {pt['rank']}: '{pt['task_title']}' ({pt['estimated_minutes']}m, {pt['priority']}) - {pt['reason']}")

            results["2. POST /ai/daily-plan"] = "PASSED"
        except Exception as e:
            print(f"  [FAIL] POST /ai/daily-plan Failed: {e}")
            results["2. POST /ai/daily-plan"] = f"FAILED: {e}"

        # -------------------------------------------------------------
        # Test 3: POST /ai/prioritize-tasks
        # -------------------------------------------------------------
        print("\n[TEST 3] Testing POST /ai/prioritize-tasks...")
        try:
            res = client.post("/ai/prioritize-tasks", json={})
            assert res.status_code == 200, f"Status code: {res.status_code}, response: {res.text}"
            prio = res.json()
            
            assert "prioritized_tasks" in prio
            assert "focus_recommendation" in prio
            assert "summary" in prio
            assert isinstance(prio["prioritized_tasks"], list)
            
            print(f"  [OK] Focus Recommendation: {prio['focus_recommendation']}")
            print(f"  [OK] Summary: {prio['summary']}")
            print(f"  [OK] Prioritized Tasks Count: {len(prio['prioritized_tasks'])}")
            for pt in prio["prioritized_tasks"][:2]:
                print(f"    - Rank {pt['rank']} [Task ID {pt['task_id']}]: '{pt['task_title']}' | Tier: {pt['priority_tier']} | Reason: {pt['reasoning']}")

            results["3. POST /ai/prioritize-tasks"] = "PASSED"
        except Exception as e:
            print(f"  [FAIL] POST /ai/prioritize-tasks Failed: {e}")
            results["3. POST /ai/prioritize-tasks"] = f"FAILED: {e}"

        # -------------------------------------------------------------
        # Test 4: POST /ai/estimate-time
        # -------------------------------------------------------------
        print("\n[TEST 4] Testing POST /ai/estimate-time...")
        try:
            payload = {
                "custom_tasks": [
                    "Implement JWT Authentication Middleware",
                    "Write End-to-End Cypress Tests for Dashboard"
                ]
            }
            res = client.post("/ai/estimate-time", json=payload)
            assert res.status_code == 200, f"Status code: {res.status_code}, response: {res.text}"
            est = res.json()
            
            assert "estimates" in est
            assert "total_estimated_minutes" in est
            assert "workload_fit" in est
            assert "summary" in est
            assert isinstance(est["estimates"], list)
            
            print(f"  [OK] Total Estimated Minutes: {est['total_estimated_minutes']} min")
            print(f"  [OK] Workload Fit: {est['workload_fit']}")
            print(f"  [OK] Summary: {est['summary']}")
            for item in est["estimates"]:
                print(f"    - '{item['task_title']}': {item['estimated_minutes']}m (Confidence: {item['confidence']}) - {item['reasoning']}")
                if item.get("suggested_subtasks"):
                    print(f"      Subtasks: {item['suggested_subtasks']}")

            results["4. POST /ai/estimate-time"] = "PASSED"
        except Exception as e:
            print(f"  [FAIL] POST /ai/estimate-time Failed: {e}")
            results["4. POST /ai/estimate-time"] = f"FAILED: {e}"

        # -------------------------------------------------------------
        # Test 7: POST /generate-roadmap (Existing Long-Term Roadmap)
        # -------------------------------------------------------------
        print("\n[TEST 7] Testing Existing /generate-roadmap...")
        try:
            roadmap_payload = {
                "goal": "Master Docker & Containerization",
                "skill_level": "Beginner",
                "days": 5,
                "hours": 2,
                "current_knowledge": "Basic Linux commands"
            }
            res = client.post("/generate-roadmap", json=roadmap_payload)
            assert res.status_code == 200, f"Status code: {res.status_code}, response: {res.text}"
            roadmap_data = res.json()
            assert "goal" in roadmap_data
            assert "analysis" in roadmap_data
            assert "breakdown" in roadmap_data
            assert "plan" in roadmap_data
            print(f"  [OK] Roadmap Goal: '{roadmap_data['goal']}'")
            print(f"  [OK] Analysis length: {len(roadmap_data['analysis'])} chars")
            print(f"  [OK] Plan preview: {roadmap_data['plan'][:120]}...")

            results["7. /generate-roadmap"] = "PASSED"
        except Exception as e:
            print(f"  [FAIL] /generate-roadmap Failed: {e}")
            results["7. /generate-roadmap"] = f"FAILED: {e}"

        # -------------------------------------------------------------
        # Test 8: POST /goals/{goal_id}/generate-tasks (Existing Task Gen)
        # -------------------------------------------------------------
        print("\n[TEST 8] Testing Existing /goals/{goal_id}/generate-tasks...")
        try:
            # Create a fresh goal without tasks to test generation
            res_g = client.post("/goals", json={
                "title": "Learn GraphQL Basics",
                "deadline": "7 days",
                "priority": "Medium",
                "available_hours": 1,
                "notes": "Know REST APIs"
            })
            new_g_id = res_g.json()["id"]
            created_goal_ids.append(new_g_id)

            res_gen = client.post(f"/goals/{new_g_id}/generate-tasks")
            assert res_gen.status_code == 200, f"Status code: {res_gen.status_code}, response: {res_gen.text}"
            gen_tasks = res_gen.json()
            assert isinstance(gen_tasks, list)
            print(f"  [OK] Generated {len(gen_tasks)} task(s) for Goal #{new_g_id}")
            for gt in gen_tasks[:3]:
                print(f"    - [Task #{gt['id']}] {gt['title']}")

            results["8. /goals/{goal_id}/generate-tasks"] = "PASSED"
        except Exception as e:
            print(f"  [FAIL] /goals/{{goal_id}}/generate-tasks Failed: {e}")
            results["8. /goals/{goal_id}/generate-tasks"] = f"FAILED: {e}"

    finally:
        # CLEANUP: Remove all temporary test goals and tasks
        print("\n[CLEANUP] Cleaning up temporary test goals...")
        for gid in set(created_goal_ids):
            try:
                client.delete(f"/goals/{gid}")
                print(f"  [CLEANUP] Deleted test Goal #{gid}")
            except Exception as ce:
                print(f"  [CLEANUP WARNING] Failed to delete Goal #{gid}: {ce}")

    # -------------------------------------------------------------
    # Summary of all tests
    # -------------------------------------------------------------
    print("\n" + "=" * 60)
    print("VERIFICATION SUMMARY")
    print("=" * 60)
    all_passed = True
    for test_name, status in results.items():
        print(f"  {test_name.ljust(42)}: {status}")
        if status != "PASSED":
            all_passed = False

    print("=" * 60)
    if all_passed:
        print("ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀")
    else:
        print("SOME TESTS ENCOUNTERED ISSUES")
    print("=" * 60)

    return results

if __name__ == "__main__":
    run_tests()
