import sys
from fastapi.testclient import TestClient

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

from app import app
from database import SessionLocal
from models import Goal, Task

client = TestClient(app)

def test_task_breakdown():
    print("=" * 60)
    print("TESTING AI TASK BREAKDOWN CAPABILITY")
    print("=" * 60)

    goal_id = None
    task_id = None
    try:
        # 1. Create a dedicated Goal and Task for testing
        goal_res = client.post("/goals", json={
            "title": "Temporary Breakdown Test Goal",
            "deadline": "14 days",
            "priority": "High",
            "available_hours": 3,
            "notes": "FastAPI, Next.js, Groq integration"
        })
        assert goal_res.status_code == 200
        goal_id = goal_res.json()["id"]

        task_res = client.post(f"/goals/{goal_id}/tasks", json={
            "title": "Integrate AI Daily Planner"
        })
        assert task_res.status_code == 200
        task_id = task_res.json()["id"]
        print(f"Created Test Goal #{goal_id} and Task #{task_id}: 'Integrate AI Daily Planner'")

        # 2. Test 404 handling on non-existent task
        res_404 = client.post("/ai/breakdown-task/999999")
        assert res_404.status_code == 404, f"Expected 404, got {res_404.status_code}"
        print("  [OK] 404 handled correctly for non-existent task ID.")

        # 3. Call POST /ai/breakdown-task/{task_id}
        res = client.post(f"/ai/breakdown-task/{task_id}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()

        # 4. Verify structured response schema
        assert data["task_id"] == task_id
        assert data["task_title"] == "Integrate AI Daily Planner"
        assert data["goal_id"] == goal_id
        assert data["goal_title"] == "Temporary Breakdown Test Goal"
        assert isinstance(data["subtasks"], list)
        assert len(data["subtasks"]) > 0
        assert "summary" in data

        print(f"\nTask Breakdown Result for '{data['task_title']}':")
        print(f"Goal: {data['goal_title']} (Priority: {data['goal_priority']}, Deadline: {data['goal_deadline']})")
        print(f"Total Estimated Minutes: {data['total_estimated_minutes']} min")
        print(f"Summary: {data['summary']}\n")

        print("Actionable Subtasks Generated:")
        for subtask in data["subtasks"]:
            assert "title" in subtask
            assert "step_order" in subtask
            print(f"  Step {subtask['step_order']}: \"{subtask['title']}\" ({subtask.get('estimated_minutes', 0)}m)")
            if subtask.get("description"):
                print(f"    Details: {subtask['description']}")

        print("\n" + "=" * 60)
        print("AI TASK BREAKDOWN VERIFIED SUCCESSFULLY! [PASS]")
        print("=" * 60)

    finally:
        if goal_id:
            try:
                client.delete(f"/goals/{goal_id}")
                print(f"Cleaned up test Goal #{goal_id}")
            except Exception as e:
                print(f"Cleanup error: {e}")

if __name__ == "__main__":
    test_task_breakdown()
