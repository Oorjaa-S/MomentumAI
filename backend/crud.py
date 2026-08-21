from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError

from models import Goal, Task


def create_goal(db: Session, goal, allow_duplicate: bool = False) -> Goal:
    """
    Creates a goal idempotently. If an active goal with the same title
    (case-insensitive, trimmed) already exists for the owner, returns the existing
    goal (updating metadata if specified) rather than creating a duplicate.
    """
    clean_title = goal.title.strip() if goal.title else ""
    if not clean_title:
        raise ValueError("Goal title cannot be empty")

    owner_id = getattr(goal, "owner_id", None)

    # 1. Idempotency check: look for an existing matching goal
    query = db.query(Goal).filter(
        func.lower(func.trim(Goal.title)) == clean_title.lower()
    )
    if owner_id is not None:
        query = query.filter(Goal.owner_id == owner_id)
    else:
        query = query.filter(Goal.owner_id.is_(None))

    existing = query.first()

    if existing and not allow_duplicate:
        # Update existing goal attributes if provided
        updated = False
        if goal.deadline is not None and goal.deadline != "":
            existing.deadline = goal.deadline
            updated = True
        if goal.priority is not None and goal.priority != "":
            existing.priority = goal.priority
            updated = True
        if goal.available_hours is not None:
            existing.available_hours = goal.available_hours
            updated = True
        if goal.notes is not None and goal.notes != "":
            existing.notes = goal.notes
            updated = True

        if updated:
            db.commit()
            db.refresh(existing)
        return existing

    # 2. Insert new Goal
    try:
        db_goal = Goal(
            title=clean_title,
            deadline=goal.deadline if goal.deadline is not None else "",
            priority=goal.priority if goal.priority is not None else "Medium",
            available_hours=goal.available_hours if goal.available_hours is not None else 1,
            notes=goal.notes if goal.notes is not None else "",
            owner_id=owner_id,
        )
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        return db_goal
    except IntegrityError:
        db.rollback()
        # Fallback to returning existing record if racing
        return query.first()


def get_goals(db: Session):
    return db.query(Goal).order_by(Goal.id.asc()).all()


def create_task(db: Session, goal_id: int, title: str) -> Task:
    """
    Creates a task idempotently under a goal. If a task with the exact same title
    (case-insensitive, trimmed) already exists under this goal, returns the existing task.
    """
    clean_title = title.strip() if title else ""
    if not clean_title:
        return None

    # Check if task with exact same title already exists under this goal
    existing = db.query(Task).filter(
        Task.goal_id == goal_id,
        func.lower(func.trim(Task.title)) == clean_title.lower(),
    ).first()

    if existing:
        return existing

    try:
        task = Task(title=clean_title, goal_id=goal_id, completed=False)
        db.add(task)
        db.commit()
        db.refresh(task)
        return task
    except IntegrityError:
        db.rollback()
        return db.query(Task).filter(
            Task.goal_id == goal_id,
            func.lower(func.trim(Task.title)) == clean_title.lower(),
        ).first()


def get_all_tasks(db: Session):
    return db.query(Task).order_by(Task.id.asc()).all()


def get_tasks(db: Session, goal_id: int):
    return db.query(Task).filter(Task.goal_id == goal_id).order_by(Task.id.asc()).all()


def update_goal(db: Session, goal_id: int, goal_data):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        return None

    if goal_data.title is not None and goal_data.title.strip() != "":
        goal.title = goal_data.title.strip()
    if goal_data.deadline is not None:
        goal.deadline = goal_data.deadline
    if goal_data.priority is not None:
        goal.priority = goal_data.priority
    if goal_data.available_hours is not None:
        goal.available_hours = goal_data.available_hours
    if goal_data.notes is not None:
        goal.notes = goal_data.notes

    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, goal_id: int):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        return False

    db.delete(goal)
    db.commit()
    return True


def update_task(db: Session, task_id: int, task_data):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return None

    if hasattr(task_data, "title") and task_data.title is not None and task_data.title.strip() != "":
        task.title = task_data.title.strip()
    if hasattr(task_data, "completed") and task_data.completed is not None:
        task.completed = task_data.completed

    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task_id: int):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        return False

    db.delete(task)
    db.commit()
    return True